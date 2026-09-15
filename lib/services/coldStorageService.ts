import { collections } from '../firebase-admin';
import coldStoragesData from '../../data/cold-storages.json';
import { getPriceTrend } from './fairPriceEngine';

// ---------- Types ----------
export interface ColdStorage {
  facilityId: string;
  name: string;
  operator: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  totalCapacityKg: number;
  availableCapacityKg: number;
  suitableCrops: string[];
  tempRangeC: [number, number];
  pricePerKgPerDay: number; // paise
  contactPhone: string;
  subsidySchemeTag?: string;
}

export interface StorageBooking {
  bookingId: string;
  facilityId: string;
  facilityName: string;
  farmerId: string;
  listingId: string;
  crop: string;
  quantityKg: number;
  startDate: string;
  endDate: string;
  days: number;
  totalCost: number; // paise
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface HoldVsSellAdvice {
  recommendation: 'hold' | 'sell';
  holdDays: number;
  currentPrice: number;     // paise/kg
  projectedPrice: number;   // paise/kg
  storageCostPerKg: number; // paise for holdDays
  potentialGainPerKg: number; // paise
  trendDirection: 'up' | 'down' | 'flat';
  trend: Array<{ date: string; modalPrice: number }>;
}

// ---------- Storage Discovery ----------

/**
 * Get available cold storages, optionally filtered by crop and district.
 */
export async function getAvailableStorages(filters?: {
  crop?: string;
  district?: string;
}): Promise<ColdStorage[]> {
  let storages = coldStoragesData as ColdStorage[];

  if (filters?.crop) {
    storages = storages.filter(s =>
      s.suitableCrops.includes(filters.crop!.toLowerCase())
    );
  }

  if (filters?.district) {
    storages = storages.filter(
      s => s.district.toLowerCase() === filters.district!.toLowerCase()
    );
  }

  // Merge with Firestore for real-time capacity updates
  for (const storage of storages) {
    const doc = await collections.coldStorages.doc(storage.facilityId).get();
    if (doc.exists) {
      const data = doc.data()!;
      storage.availableCapacityKg = data.availableCapacityKg ?? storage.availableCapacityKg;
    }
  }

  return storages.filter(s => s.availableCapacityKg > 0);
}

// ---------- Booking ----------

/**
 * Book cold storage and decrement available capacity.
 */
export async function bookStorage(input: {
  facilityId: string;
  farmerId: string;
  listingId: string;
  crop: string;
  quantityKg: number;
  days: number;
}): Promise<StorageBooking> {
  const allStorages = coldStoragesData as ColdStorage[];
  const facility = allStorages.find(s => s.facilityId === input.facilityId);
  if (!facility) throw new Error('Facility not found');

  // Check real-time capacity from Firestore (or use seed data)
  let availableKg = facility.availableCapacityKg;
  const firestoreDoc = await collections.coldStorages.doc(input.facilityId).get();
  if (firestoreDoc.exists) {
    availableKg = firestoreDoc.data()!.availableCapacityKg ?? availableKg;
  }

  if (input.quantityKg > availableKg) {
    throw new Error('Insufficient storage capacity');
  }

  const totalCost = input.quantityKg * facility.pricePerKgPerDay * input.days;

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + input.days);

  const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const booking: StorageBooking = {
    bookingId,
    facilityId: input.facilityId,
    facilityName: facility.name,
    farmerId: input.farmerId,
    listingId: input.listingId,
    crop: input.crop,
    quantityKg: input.quantityKg,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    days: input.days,
    totalCost,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  // Decrement capacity
  const newCapacity = availableKg - input.quantityKg;
  await collections.coldStorages.doc(input.facilityId).set(
    { availableCapacityKg: newCapacity },
    { merge: true }
  );

  // Save booking
  await collections.storageBookings.doc(bookingId).set(booking);

  // Update listing status
  await collections.listings.doc(input.listingId).update({
    status: 'in_storage',
  });

  return booking;
}

// ---------- Hold vs Sell Advisor ----------

/**
 * Analyze price trend and storage cost to recommend hold vs sell.
 */
export function getHoldVsSellAdvice(input: {
  crop: string;
  district: string;
  quantityKg: number;
  currentAskPricePerKg: number; // paise
  storagePricePerKgPerDay: number; // paise
}): HoldVsSellAdvice {
  const trend = getPriceTrend(input.crop, 7);
  if (trend.length < 2) {
    return {
      recommendation: 'sell',
      holdDays: 0,
      currentPrice: input.currentAskPricePerKg,
      projectedPrice: input.currentAskPricePerKg,
      storageCostPerKg: 0,
      potentialGainPerKg: 0,
      trendDirection: 'flat',
      trend: [],
    };
  }

  // Calculate trend: compare latest 3 days vs previous 3 days
  const recent = trend.slice(0, 3);
  const older = trend.slice(3, 6);

  const recentAvg = recent.reduce((s, t) => s + t.modalPrice, 0) / recent.length;
  const olderAvg = older.length > 0
    ? older.reduce((s, t) => s + t.modalPrice, 0) / older.length
    : recentAvg;

  const trendPercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  const trendDirection: 'up' | 'down' | 'flat' =
    trendPercent > 2 ? 'up' : trendPercent < -2 ? 'down' : 'flat';

  // Project price 4 days ahead using linear trend
  const holdDays = 4;
  const dailyChange = trend.length >= 2
    ? (trend[0].modalPrice - trend[trend.length - 1].modalPrice) / (trend.length - 1)
    : 0;
  const projectedPrice = Math.round(trend[0].modalPrice + dailyChange * holdDays);

  const storageCostPerKg = input.storagePricePerKgPerDay * holdDays;
  const potentialGainPerKg = projectedPrice - trend[0].modalPrice - storageCostPerKg;

  const recommendation = potentialGainPerKg > 0 ? 'hold' : 'sell';

  return {
    recommendation,
    holdDays,
    currentPrice: trend[0].modalPrice,
    projectedPrice,
    storageCostPerKg,
    potentialGainPerKg,
    trendDirection,
    trend: trend.map(t => ({ date: t.date, modalPrice: t.modalPrice })),
  };
}
