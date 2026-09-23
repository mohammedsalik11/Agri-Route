import { collections, db } from '../firebase-admin';
import coldStoragesData from '../../data/cold-storages.json';
import { getPriceTrend } from './fairPriceEngine';
import { createLogisticsJobForStorageBooking } from './logisticsService';

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
  ownerId?: string;
  licenseNumber?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  address?: string;
  rating?: number;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StorageBooking {
  bookingId: string;
  facilityId: string;
  facilityName: string;
  farmerId?: string;
  userId: string;
  userRole: 'farmer' | 'wholesaler';
  userName?: string;
  userPhone?: string;
  listingId?: string | null;
  crop: string;
  quantityKg: number;
  startDate: string;
  endDate: string;
  days: number;
  totalCost: number; // paise
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  contactPhone?: string;
  pickupAddress?: string;
  requestLogistics?: boolean;
  logisticsJobId?: string | null;
  createdAt: string;
  updatedAt?: string;
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
 * Merges Firestore registered facilities with the expanded seed dataset.
 */
export async function getAvailableStorages(filters?: {
  crop?: string;
  district?: string;
  onlyVerified?: boolean;
}): Promise<ColdStorage[]> {
  const seedStorages = (coldStoragesData as unknown as ColdStorage[]).map(s => ({
    ...s,
    verificationStatus: s.verificationStatus || 'verified',
    rating: s.rating || 4.7,
  }));

  // Fetch from Firestore
  let firestoreStorages: ColdStorage[] = [];
  try {
    const snap = await collections.coldStorages.get();
    firestoreStorages = snap.docs.map(doc => doc.data() as ColdStorage);
  } catch (err) {
    console.warn('Error fetching Firestore coldStorages:', err);
  }

  // Combine: Firestore entries override or append to seed entries
  const storageMap = new Map<string, ColdStorage>();
  for (const item of seedStorages) {
    storageMap.set(item.facilityId, item);
  }
  for (const item of firestoreStorages) {
    storageMap.set(item.facilityId, { ...(storageMap.get(item.facilityId) || {}), ...item });
  }

  let storages = Array.from(storageMap.values());

  if (filters?.onlyVerified) {
    storages = storages.filter(s => s.verificationStatus === 'verified');
  }

  if (filters?.crop) {
    const cropLower = filters.crop.toLowerCase().trim();
    const matchingCrop = storages.filter(s =>
      s.suitableCrops.some(c => {
        const cLower = c.toLowerCase();
        return (
          cLower === cropLower ||
          cLower.includes(cropLower) ||
          cropLower.includes(cLower) ||
          cLower === 'vegetables' ||
          cLower === 'fruits' ||
          cLower === 'all'
        );
      })
    );
    if (matchingCrop.length > 0) {
      storages = matchingCrop;
    }
  }

  if (filters?.district && filters.district !== 'ALL') {
    const districtLower = filters.district.toLowerCase().trim();
    const exactDistrict = storages.filter(
      s => s.district.toLowerCase().trim() === districtLower
    );
    const otherDistricts = storages.filter(
      s => s.district.toLowerCase().trim() !== districtLower
    );

    // Put exact district match first, followed by other facilities
    if (exactDistrict.length > 0) {
      storages = [...exactDistrict, ...otherDistricts];
    }
  }

  const result = storages.filter(s => (s.availableCapacityKg ?? 0) > 0);
  return result.length > 0 ? result : storages;
}

/**
 * Get all cold storage facilities owned by a specific storage owner.
 */
export async function getOwnerFacilities(ownerId: string): Promise<ColdStorage[]> {
  try {
    const snap = await collections.coldStorages.where('ownerId', '==', ownerId).get();
    const facilities = snap.docs.map(d => d.data() as ColdStorage);
    return facilities.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  } catch (err) {
    console.error('getOwnerFacilities error:', err);
    return [];
  }
}

/**
 * Register or create a cold storage facility.
 */
export async function createStorageFacility(data: Partial<ColdStorage> & {
  name: string;
  operator: string;
  district: string;
  totalCapacityKg: number;
  pricePerKgPerDay: number;
  contactPhone: string;
  ownerId?: string;
  licenseNumber?: string;
}): Promise<ColdStorage> {
  const facilityId = data.facilityId || `cs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const isWdraValid = data.licenseNumber ? /^(WDRA|FSSAI|KA-CS)-\d{4}-\d{4,6}$/i.test(data.licenseNumber.trim()) : true;

  const facility: ColdStorage = {
    facilityId,
    name: data.name,
    operator: data.operator,
    district: data.district,
    state: data.state || 'Karnataka',
    lat: data.lat || 12.9716,
    lng: data.lng || 77.5946,
    totalCapacityKg: data.totalCapacityKg,
    availableCapacityKg: data.availableCapacityKg ?? data.totalCapacityKg,
    suitableCrops: data.suitableCrops || ['tomato', 'potato', 'onion', 'vegetables', 'fruits'],
    tempRangeC: data.tempRangeC || [2, 8],
    pricePerKgPerDay: data.pricePerKgPerDay,
    contactPhone: data.contactPhone,
    subsidySchemeTag: data.subsidySchemeTag || 'AIF',
    ownerId: data.ownerId,
    licenseNumber: data.licenseNumber || `WDRA-KA-${Math.floor(1000 + Math.random() * 9000)}-2026`,
    verificationStatus: isWdraValid ? 'verified' : 'pending',
    address: data.address || `${data.district} APMC Agri Warehouse Corridor`,
    rating: data.rating || 4.8,
    features: data.features || ['24/7 Power Backup', 'Humidity Control', 'WDRA Certified', 'AIF Subsidy Eligible'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await collections.coldStorages.doc(facilityId).set(facility, { merge: true });
  return facility;
}

/**
 * Update facility specifications, capacities, or pricing.
 */
export async function updateStorageFacility(
  facilityId: string,
  updates: Partial<ColdStorage>
): Promise<ColdStorage> {
  const ref = collections.coldStorages.doc(facilityId);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error('Facility not found');
  }

  const updatedData = {
    ...doc.data(),
    ...updates,
    updatedAt: new Date().toISOString(),
  } as ColdStorage;

  await ref.set(updatedData, { merge: true });
  return updatedData;
}

/**
 * Get all storage bookings for a specific farmer or user.
 */
export async function getFarmerBookings(userId: string): Promise<StorageBooking[]> {
  try {
    const snap1 = await collections.storageBookings
      .where('farmerId', '==', userId)
      .get();
    const snap2 = await collections.storageBookings
      .where('userId', '==', userId)
      .get();

    const map = new Map<string, StorageBooking>();
    snap1.docs.forEach(d => map.set(d.id, d.data() as StorageBooking));
    snap2.docs.forEach(d => map.set(d.id, d.data() as StorageBooking));

    const bookings = Array.from(map.values());
    return bookings.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  } catch (err) {
    console.error('getFarmerBookings error:', err);
    return [];
  }
}

/**
 * Get all bookings across all facilities owned by a storage owner.
 */
export async function getOwnerBookings(ownerId: string): Promise<StorageBooking[]> {
  try {
    const facilities = await getOwnerFacilities(ownerId);
    if (facilities.length === 0) return [];

    const facilityIds = facilities.map(f => f.facilityId);
    const snap = await collections.storageBookings.get();
    
    const bookings = snap.docs
      .map(d => d.data() as StorageBooking)
      .filter(b => facilityIds.includes(b.facilityId));

    return bookings.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  } catch (err) {
    console.error('getOwnerBookings error:', err);
    return [];
  }
}

/**
 * Get bookings for a single facility.
 */
export async function getFacilityBookings(facilityId: string): Promise<StorageBooking[]> {
  try {
    const snap = await collections.storageBookings.where('facilityId', '==', facilityId).get();
    const bookings = snap.docs.map(d => d.data() as StorageBooking);
    return bookings.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  } catch (err) {
    console.error('getFacilityBookings error:', err);
    return [];
  }
}

/**
 * Update a storage booking status (confirmed, active, completed, cancelled).
 */
export async function updateBookingStatus(
  bookingId: string,
  status: StorageBooking['status']
): Promise<StorageBooking> {
  const ref = collections.storageBookings.doc(bookingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Booking not found');

  const booking = doc.data() as StorageBooking;
  const oldStatus = booking.status;

  booking.status = status;
  booking.updatedAt = new Date().toISOString();

  await ref.set(booking, { merge: true });

  // If cancelled, restore capacity to facility
  if (status === 'cancelled' && oldStatus !== 'cancelled') {
    const facilityRef = collections.coldStorages.doc(booking.facilityId);
    const fDoc = await facilityRef.get();
    if (fDoc.exists) {
      const fData = fDoc.data() as ColdStorage;
      const restored = Math.min(fData.totalCapacityKg, (fData.availableCapacityKg || 0) + booking.quantityKg);
      await facilityRef.update({ availableCapacityKg: restored });
    }
  }

  return booking;
}

// ---------- Booking ----------

/**
 * Book cold storage, decrement available capacity, and optionally dispatch a logistics job.
 */
export async function bookStorage(input: {
  facilityId: string;
  userId: string;
  farmerId?: string;
  userRole?: 'farmer' | 'wholesaler';
  userName?: string;
  userPhone?: string;
  listingId?: string;
  crop: string;
  quantityKg: number;
  days: number;
  pickupAddress?: string;
  requestLogistics?: boolean;
}): Promise<StorageBooking> {
  const allStorages = await getAvailableStorages();
  const facility = allStorages.find(s => s.facilityId === input.facilityId);
  if (!facility) throw new Error('Cold storage facility not found');

  // Check real-time capacity
  let availableKg = facility.availableCapacityKg;
  const firestoreDoc = await collections.coldStorages.doc(input.facilityId).get();
  if (firestoreDoc.exists) {
    availableKg = firestoreDoc.data()!.availableCapacityKg ?? availableKg;
  }

  if (input.quantityKg > availableKg) {
    throw new Error(`Insufficient storage capacity. Only ${availableKg.toLocaleString()} kg available.`);
  }

  const totalCost = input.quantityKg * facility.pricePerKgPerDay * input.days;

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + input.days);

  const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const uId = input.userId || input.farmerId || 'unknown_user';
  const role = input.userRole || 'farmer';

  let logisticsJobId: string | null = null;

  // Create logistics job if requested
  if (input.requestLogistics) {
    try {
      const job = await createLogisticsJobForStorageBooking({
        storageBookingId: bookingId,
        facilityId: facility.facilityId,
        facilityName: facility.name,
        facilityDistrict: facility.district,
        facilityAddress: facility.address || `${facility.district} Cold Storage Complex`,
        userId: uId,
        userName: input.userName || 'Agri Producer',
        userRole: role,
        crop: input.crop,
        quantityKg: input.quantityKg,
        pickupAddress: input.pickupAddress || `${facility.district} Farm Gate`,
        pickupDistrict: facility.district,
      });
      logisticsJobId = job.id;
    } catch (logErr) {
      console.warn('Could not auto-create logistics job for storage booking:', logErr);
    }
  }

  const booking: StorageBooking = {
    bookingId,
    facilityId: input.facilityId,
    facilityName: facility.name,
    farmerId: input.farmerId || uId,
    userId: uId,
    userRole: role,
    userName: input.userName,
    userPhone: input.userPhone,
    listingId: input.listingId || null,
    crop: input.crop,
    quantityKg: input.quantityKg,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    days: input.days,
    totalCost,
    status: 'confirmed',
    contactPhone: facility.contactPhone,
    pickupAddress: input.pickupAddress,
    requestLogistics: input.requestLogistics || false,
    logisticsJobId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Decrement capacity
  const newCapacity = Math.max(0, availableKg - input.quantityKg);
  await collections.coldStorages.doc(input.facilityId).set(
    {
      ...facility,
      availableCapacityKg: newCapacity,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // Save booking in Firestore
  await collections.storageBookings.doc(bookingId).set(booking);

  // Update listing status if listingId provided
  if (input.listingId) {
    try {
      await collections.listings.doc(input.listingId).update({
        status: 'in_storage',
      });
    } catch (err) {
      console.warn('Could not update listing status on storage booking:', err);
    }
  }

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
