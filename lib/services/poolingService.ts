import { collections } from '../firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// ---------- Types ----------
export interface Pool {
  poolId: string;
  crop: string;
  qualityGrade: 'A' | 'B' | 'C';
  district: string;
  state: string;
  centroid: { lat: number; lng: number };
  windowStart: string;
  windowEnd: string;
  targetKg: number;
  currentKg: number;
  farmerCount: number;
  listingIds: string[];
  weightedAskPricePerKg: number; // paise
  poolPricePerKg: number;        // paise
  status: 'open' | 'ready' | 'locked' | 'sold' | 'expired';
  createdAt: string;
}

// ---------- Constants ----------
const POOL_DISCOUNT = 0.02; // 2% volume discount for buyers
const MIN_VIABLE_RATIO = 0.6; // 60% of target = still sellable

export const TRUCK_THRESHOLD: Record<string, number> = {
  tomato: 3000,
  onion: 5000,
  potato: 5000,
  paddy: 10000,
  paddy_common: 10000,
  wheat: 10000,
  ragi: 5000,
  maize: 8000,
  banana: 3000,
  default: 3000,
};

function getTargetKg(crop: string): number {
  return TRUCK_THRESHOLD[crop.toLowerCase()] || TRUCK_THRESHOLD.default;
}

/**
 * Generate a pool grouping key.
 * Deliberately simple: crop + grade + district + ISO week.
 */
function getPoolKey(crop: string, grade: string, district: string, availableUntil: string): string {
  const date = new Date(availableUntil);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const isoWeek = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  const safeCrop = (crop || 'produce').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeDistrict = (district || 'district').toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${safeCrop}__${grade}__${safeDistrict}__W${isoWeek}`;
}

/**
 * Compute weighted average ask price across listings.
 */
function computeWeightedPrice(
  listings: Array<{ quantityKg: number; askPricePerKg: number }>
): number {
  const totalQty = listings.reduce((sum, l) => sum + l.quantityKg, 0);
  if (totalQty === 0) return 0;
  const weightedSum = listings.reduce((sum, l) => sum + l.quantityKg * l.askPricePerKg, 0);
  return Math.round(weightedSum / totalQty);
}

/**
 * Compute centroid from listing coordinates.
 */
function computeCentroid(
  listings: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } {
  if (listings.length === 0) return { lat: 0, lng: 0 };
  const sumLat = listings.reduce((s, l) => s + l.lat, 0);
  const sumLng = listings.reduce((s, l) => s + l.lng, 0);
  return {
    lat: Number((sumLat / listings.length).toFixed(6)),
    lng: Number((sumLng / listings.length).toFixed(6)),
  };
}

// ---------- Core Operations ----------

/**
 * Try to attach a listing to an existing pool, or create a new one.
 * Called when a listing is created.
 */
export async function attachToPool(listing: {
  listingId: string;
  crop: string;
  qualityGrade: 'A' | 'B' | 'C';
  district: string;
  state: string;
  quantityKg: number;
  askPricePerKg: number;
  lat: number;
  lng: number;
  availableUntil: string;
}): Promise<{ poolId: string; pool: Pool }> {
  const poolKey = getPoolKey(listing.crop, listing.qualityGrade, listing.district, listing.availableUntil);

  // Find existing open pool with this key
  const existing = await collections.pools
    .where('status', '==', 'open')
    .where('crop', '==', listing.crop.toLowerCase())
    .where('qualityGrade', '==', listing.qualityGrade)
    .where('district', '==', listing.district)
    .get();

  let poolId: string;
  let pool: Pool;

  if (!existing.empty) {
    // Attach to existing pool
    const poolDoc = existing.docs[0];
    poolId = poolDoc.id;
    const existingPool = poolDoc.data() as Pool;

    const newCurrentKg = existingPool.currentKg + listing.quantityKg;
    const newListingIds = [...existingPool.listingIds, listing.listingId];
    const newFarmerCount = existingPool.farmerCount + 1;

    // Recompute weighted price - fetch all listings in pool
    const listingDocs = await Promise.all(
      newListingIds.map(id => collections.listings.doc(id).get())
    );
    const listingsData = listingDocs
      .filter(d => d.exists)
      .map(d => d.data() as { quantityKg: number; askPricePerKg: number; lat: number; lng: number });

    const weightedAsk = computeWeightedPrice(listingsData);
    const poolPrice = Math.round(weightedAsk * (1 - POOL_DISCOUNT));
    const centroid = computeCentroid(listingsData);

    const newStatus = newCurrentKg >= existingPool.targetKg ? 'ready' : 'open';

    await collections.pools.doc(poolId).update({
      currentKg: newCurrentKg,
      farmerCount: newFarmerCount,
      listingIds: newListingIds,
      weightedAskPricePerKg: weightedAsk,
      poolPricePerKg: poolPrice,
      centroid,
      status: newStatus,
    });

    pool = {
      ...existingPool,
      currentKg: newCurrentKg,
      farmerCount: newFarmerCount,
      listingIds: newListingIds,
      weightedAskPricePerKg: weightedAsk,
      poolPricePerKg: poolPrice,
      centroid,
      status: newStatus as Pool['status'],
    };
  } else {
    // Create new pool
    poolId = `pool_${poolKey}_${Date.now()}`;
    const targetKg = getTargetKg(listing.crop);

    const weightedAsk = listing.askPricePerKg;
    const poolPrice = Math.round(weightedAsk * (1 - POOL_DISCOUNT));

    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 7);

    pool = {
      poolId,
      crop: listing.crop.toLowerCase(),
      qualityGrade: listing.qualityGrade,
      district: listing.district,
      state: listing.state,
      centroid: { lat: listing.lat, lng: listing.lng },
      windowStart: now.toISOString(),
      windowEnd: windowEnd.toISOString(),
      targetKg,
      currentKg: listing.quantityKg,
      farmerCount: 1,
      listingIds: [listing.listingId],
      weightedAskPricePerKg: weightedAsk,
      poolPricePerKg: poolPrice,
      status: listing.quantityKg >= targetKg ? 'ready' : 'open',
      createdAt: now.toISOString(),
    };

    await collections.pools.doc(poolId).set(pool);
  }

  // Update listing with pool reference
  await collections.listings.doc(listing.listingId).update({
    poolId,
    status: 'pooled',
  });

  return { poolId, pool };
}

async function findPoolDoc(poolId: string) {
  const candidateIds = Array.from(new Set([poolId, decodeURIComponent(poolId || '')]));
  for (const cid of candidateIds) {
    const doc = await collections.pools.doc(cid).get();
    if (doc.exists) return doc;
  }
  for (const cid of candidateIds) {
    const snap = await collections.pools.where('poolId', '==', cid).limit(1).get();
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

/**
 * Manually join an existing listing to an existing pool.
 */
export async function joinPool(poolId: string, listingId: string): Promise<Pool> {
  const poolDoc = await findPoolDoc(poolId);
  if (!poolDoc || !poolDoc.exists) throw new Error('Pool not found');
  const actualPoolId = poolDoc.id;
  const pool = poolDoc.data() as Pool;
  if (pool.status !== 'open') throw new Error('Pool is not accepting new listings');

  const listingDoc = await collections.listings.doc(listingId).get();
  if (!listingDoc.exists) throw new Error('Listing not found');
  const listing = listingDoc.data()!;
  if (listing.status !== 'available') throw new Error('Listing is not available');
  if (listing.poolId) throw new Error('Listing is already in a pool');

  // Add to pool
  const newCurrentKg = pool.currentKg + listing.quantityKg;
  const newListingIds = [...pool.listingIds, listingId];

  // Recompute price
  const listingDocs = await Promise.all(
    newListingIds.map(id => collections.listings.doc(id).get())
  );
  const listingsData = listingDocs
    .filter(d => d.exists)
    .map(d => d.data() as { quantityKg: number; askPricePerKg: number; lat: number; lng: number });

  const weightedAsk = computeWeightedPrice(listingsData);
  const poolPrice = Math.round(weightedAsk * (1 - POOL_DISCOUNT));
  const centroid = computeCentroid(listingsData);
  const newStatus = newCurrentKg >= pool.targetKg ? 'ready' : 'open';

  const updatedPool: Partial<Pool> = {
    currentKg: newCurrentKg,
    farmerCount: pool.farmerCount + 1,
    listingIds: newListingIds,
    weightedAskPricePerKg: weightedAsk,
    poolPricePerKg: poolPrice,
    centroid,
    status: newStatus as Pool['status'],
  };

  await collections.pools.doc(actualPoolId).update(updatedPool);
  await collections.listings.doc(listingId).update({ poolId: actualPoolId, status: 'pooled' });

  return { ...pool, ...updatedPool } as Pool;
}

/**
 * Remove a listing from a pool (only while pool is 'open').
 */
export async function leavePool(poolId: string, listingId: string): Promise<Pool> {
  const poolDoc = await findPoolDoc(poolId);
  if (!poolDoc || !poolDoc.exists) throw new Error('Pool not found');
  const actualPoolId = poolDoc.id;
  const pool = poolDoc.data() as Pool;
  if (pool.status !== 'open') throw new Error('Cannot leave a pool that is not open');

  const listingDoc = await collections.listings.doc(listingId).get();
  if (!listingDoc.exists) throw new Error('Listing not found');
  const listing = listingDoc.data()!;

  const newListingIds = pool.listingIds.filter(id => id !== listingId);
  const newCurrentKg = pool.currentKg - (listing.quantityKg || 0);

  if (newListingIds.length === 0) {
    // Pool is empty — expire it
    await collections.pools.doc(actualPoolId).update({ status: 'expired', listingIds: [], currentKg: 0, farmerCount: 0 });
    await collections.listings.doc(listingId).update({ poolId: null, status: 'available' });
    return { ...pool, status: 'expired', listingIds: [], currentKg: 0, farmerCount: 0 };
  }

  // Recompute
  const listingDocs = await Promise.all(
    newListingIds.map(id => collections.listings.doc(id).get())
  );
  const listingsData = listingDocs
    .filter(d => d.exists)
    .map(d => d.data() as { quantityKg: number; askPricePerKg: number; lat: number; lng: number });

  const weightedAsk = computeWeightedPrice(listingsData);
  const poolPrice = Math.round(weightedAsk * (1 - POOL_DISCOUNT));
  const centroid = computeCentroid(listingsData);

  const updatedPool: Partial<Pool> = {
    currentKg: newCurrentKg,
    farmerCount: pool.farmerCount - 1,
    listingIds: newListingIds,
    weightedAskPricePerKg: weightedAsk,
    poolPricePerKg: poolPrice,
    centroid,
  };

  await collections.pools.doc(actualPoolId).update(updatedPool);
  await collections.listings.doc(listingId).update({ poolId: null, status: 'available' });

  return { ...pool, ...updatedPool } as Pool;
}

/**
 * Lock a pool when an order is placed.
 */
export async function lockPool(poolId: string): Promise<void> {
  const poolDoc = await findPoolDoc(poolId);
  if (!poolDoc || !poolDoc.exists) throw new Error('Pool not found');
  const actualPoolId = poolDoc.id;
  const pool = poolDoc.data() as Pool;

  await collections.pools.doc(actualPoolId).update({ status: 'locked' });

  // Lock all member listings
  const batch = collections.listings.firestore.batch();
  for (const listingId of (pool.listingIds || [])) {
    batch.update(collections.listings.doc(listingId), { status: 'locked' });
  }
  await batch.commit();
}

/**
 * Mark pool as sold after escrow release.
 */
export async function markPoolSold(poolId: string): Promise<void> {
  const poolDoc = await findPoolDoc(poolId);
  if (!poolDoc || !poolDoc.exists) return;
  const actualPoolId = poolDoc.id;
  const pool = poolDoc.data() as Pool;

  await collections.pools.doc(actualPoolId).update({ status: 'sold' });

  const batch = collections.listings.firestore.batch();
  for (const listingId of (pool.listingIds || [])) {
    batch.update(collections.listings.doc(listingId), { status: 'sold' });
  }
  await batch.commit();
}

/**
 * Calculate payout split for a pool order.
 */
export function calculatePayoutSplit(
  listings: Array<{ farmerId: string; farmerName: string; quantityKg: number }>,
  totalAmount: number // paise
): Array<{ farmerId: string; farmerName: string; quantityKg: number; amount: number }> {
  const totalKg = listings.reduce((sum, l) => sum + l.quantityKg, 0);
  if (totalKg === 0) return [];

  const payouts = listings.map(l => ({
    farmerId: l.farmerId,
    farmerName: l.farmerName,
    quantityKg: l.quantityKg,
    amount: Math.floor((l.quantityKg / totalKg) * totalAmount),
  }));

  // Distribute rounding remainder to the largest contributor
  const distributed = payouts.reduce((sum, p) => sum + p.amount, 0);
  const remainder = totalAmount - distributed;
  if (remainder > 0) {
    const largest = payouts.reduce((max, p) => (p.quantityKg > max.quantityKg ? p : max), payouts[0]);
    largest.amount += remainder;
  }

  // Assert total matches
  const total = payouts.reduce((sum, p) => sum + p.amount, 0);
  if (total !== totalAmount) {
    throw new Error(`Payout split error: ${total} !== ${totalAmount}`);
  }

  return payouts;
}

/**
 * Get pools by district and/or crop.
 */
export async function getPools(filters: {
  district?: string;
  crop?: string;
  status?: string;
}): Promise<Pool[]> {
  try {
    const snapshot = await collections.pools.get();
    let pools = snapshot.docs.map(d => d.data() as Pool);

    if (filters.district) {
      pools = pools.filter(p => p.district?.toLowerCase() === filters.district!.toLowerCase());
    }
    if (filters.crop) {
      pools = pools.filter(p => p.crop?.toLowerCase() === filters.crop!.toLowerCase());
    }
    if (filters.status) {
      pools = pools.filter(p => p.status === filters.status);
    }

    pools.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    return pools;
  } catch (err) {
    console.error('getPools error:', err);
    return [];
  }
}
