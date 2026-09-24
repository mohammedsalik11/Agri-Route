import { db, collections } from '../firebase-admin';
import { UserProfile } from '../auth';
import { Timestamp } from 'firebase-admin/firestore';

export interface LogisticsTrip {
  tripId: string;
  tripNumber: number; // 1, 2, ...
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleCapacityKg?: number;
  assignedQuantityKg: number;
  tripFee: number; // In paise
  status: 'pending' | 'assigned' | 'en_route_pickup' | 'picked_up' | 'in_transit' | 'delivered';
  pickupOtp?: string;
  deliveryOtp?: string;
  pickupTime?: string;
  deliveredTime?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    address?: string;
    updatedAt: string;
  };
}

export interface LogisticsJob {
  id: string;
  sourceType: 'listing' | 'order' | 'pool' | 'storage_booking';
  sourceId: string;
  orderId?: string;
  listingId?: string;
  poolId?: string;
  storageBookingId?: string;
  facilityId?: string;
  facilityName?: string;
  farmerId?: string;
  farmerName?: string;
  crop: string;
  variety?: string;
  qualityGrade?: string;
  totalQuantityKg: number;
  remainingUnassignedKg: number;
  pickupAddress: string;
  pickupDistrict: string;
  pickupState: string;
  deliveryAddress: string;
  deliveryDistrict: string;
  deliveryState: string;
  estimatedDistanceKm: number;
  totalLogisticsFee: number; // In paise
  requiresRefrigeration?: boolean;
  status: 'open' | 'partially_assigned' | 'fully_assigned' | 'in_progress' | 'completed';
  trips: LogisticsTrip[];
  createdAt: string;
  updatedAt: string;
}

// Pan-India agricultural district & trade hub coordinates for distance calculation
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  // Karnataka
  'Mandya': { lat: 12.5218, lng: 76.8951 },
  'Mysuru': { lat: 12.2958, lng: 76.6394 },
  'Bengaluru Urban': { lat: 12.9716, lng: 77.5946 },
  'Bengaluru Rural': { lat: 13.2847, lng: 77.5404 },
  'Hassan': { lat: 13.0033, lng: 76.1004 },
  'Kolar': { lat: 13.1378, lng: 78.1292 },
  'Belagavi': { lat: 15.8497, lng: 74.4977 },
  'Dharwad': { lat: 15.4589, lng: 75.0078 },
  'Tumakuru': { lat: 13.3379, lng: 77.1173 },
  'Shivamogga': { lat: 13.9299, lng: 75.5681 },
  'Chamarajanagara': { lat: 11.9261, lng: 76.9437 },
  'Ramanagara': { lat: 12.7209, lng: 77.2799 },
  // Maharashtra
  'Nashik': { lat: 19.9975, lng: 73.7898 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Mumbai City': { lat: 18.9388, lng: 72.8354 },
  'Mumbai Suburban': { lat: 19.0760, lng: 72.8777 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Jalgaon': { lat: 21.0077, lng: 75.5626 },
  'Ahmednagar': { lat: 19.0952, lng: 74.7496 },
  'Kolhapur': { lat: 16.7050, lng: 74.2433 },
  'Solapur': { lat: 17.6599, lng: 75.9064 },
  // Punjab
  'Ludhiana': { lat: 30.9010, lng: 75.8573 },
  'Jalandhar': { lat: 31.3260, lng: 75.5762 },
  'Amritsar': { lat: 31.6340, lng: 74.8723 },
  'Bathinda': { lat: 30.2110, lng: 74.9455 },
  'Patiala': { lat: 30.3398, lng: 76.3869 },
  // Uttar Pradesh
  'Agra': { lat: 27.1767, lng: 78.0081 },
  'Varanasi': { lat: 25.3176, lng: 82.9739 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Kanpur': { lat: 26.4499, lng: 80.3319 },
  'Meerut': { lat: 28.9845, lng: 77.7064 },
  'Prayagraj': { lat: 25.4358, lng: 81.8463 },
  // Gujarat
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Rajkot': { lat: 22.3039, lng: 70.8022 },
  'Junagadh': { lat: 21.5222, lng: 70.4579 },
  'Vadodara': { lat: 22.3072, lng: 73.1812 },
  // Madhya Pradesh
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Ujjain': { lat: 23.1765, lng: 75.7885 },
  'Gwalior': { lat: 26.2183, lng: 78.1828 },
  // Andhra Pradesh & Telangana
  'Guntur': { lat: 16.3067, lng: 80.4365 },
  'Vijayawada': { lat: 16.5062, lng: 80.6480 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  // Rajasthan
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Jodhpur': { lat: 26.2389, lng: 73.0243 },
  'Kota': { lat: 25.2138, lng: 75.8648 },
  'Bharatpur': { lat: 27.2152, lng: 77.4890 },
  // West Bengal
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Hooghly': { lat: 22.9056, lng: 88.3976 },
  // Delhi
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  // Tamil Nadu
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
};

export function calculateDistanceKm(fromDistrict: string, toDistrict: string): number {
  const normFrom = Object.keys(DISTRICT_COORDS).find(
    (k) => k.toLowerCase() === (fromDistrict || '').toLowerCase()
  );
  const normTo = Object.keys(DISTRICT_COORDS).find(
    (k) => k.toLowerCase() === (toDistrict || '').toLowerCase()
  );

  const c1 = normFrom ? DISTRICT_COORDS[normFrom] : { lat: 12.52, lng: 76.89 };
  const c2 = normTo ? DISTRICT_COORDS[normTo] : { lat: 12.97, lng: 77.59 };

  const R = 6371; // km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLon = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = Math.round(R * c);
  return Math.max(dist, 25); // Minimum 25 km
}

/**
 * Market Freight Pricing Engine based on commercial agricultural transport rates in India.
 * Payment is directly computed from distance (km), vehicle payload tier, and cold-chain premium.
 */
export interface MarketFreightRate {
  distanceKm: number;
  ratePerKmPaise: number;
  baseFarePaise: number;
  refrigerationSurchargePaise: number;
  totalFeePaise: number;
}

export function calculateMarketFreight(
  distanceKm: number,
  quantityKg: number,
  requiresRefrigeration: boolean = false
): MarketFreightRate {
  const km = Math.max(distanceKm, 20); // Minimum 20 km

  // Indian Agri-Logistics Market Rates per KM:
  // - Small load (<= 1,000 kg, e.g. 3-Wheeler / Tata Ace): ₹22/km, Base ₹400
  // - Medium load (1,001 - 3,000 kg, e.g. Bolero Maxx / Pickup): ₹30/km, Base ₹650
  // - Intermediate load (3,001 - 7,000 kg, e.g. 14-17ft Medium Truck): ₹42/km, Base ₹1,000
  // - Heavy commercial load (> 7,000 kg, e.g. 10-wheeler / Multi-axle): ₹56/km, Base ₹1,500
  let ratePerKmRupees = 30;
  let baseFareRupees = 650;

  if (quantityKg <= 1000) {
    ratePerKmRupees = 22;
    baseFareRupees = 400;
  } else if (quantityKg <= 3000) {
    ratePerKmRupees = 30;
    baseFareRupees = 650;
  } else if (quantityKg <= 7000) {
    ratePerKmRupees = 42;
    baseFareRupees = 1000;
  } else {
    ratePerKmRupees = 56;
    baseFareRupees = 1500;
  }

  const baseFarePaise = baseFareRupees * 100;
  const distanceFarePaise = Math.round(km * ratePerKmRupees * 100);
  const reeferMultiplier = requiresRefrigeration ? 0.25 : 0;
  const refrigerationSurchargePaise = Math.round((baseFarePaise + distanceFarePaise) * reeferMultiplier);
  const totalFeePaise = baseFarePaise + distanceFarePaise + refrigerationSurchargePaise;

  return {
    distanceKm: km,
    ratePerKmPaise: ratePerKmRupees * 100,
    baseFarePaise,
    refrigerationSurchargePaise,
    totalFeePaise,
  };
}

/**
 * Creates a Logistics Job whenever a farmer lists a produce lot.
 */
export async function createLogisticsJobForListing(params: {
  listingId: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  variety?: string;
  qualityGrade?: string;
  quantityKg: number;
  askPricePerKg: number; // in paise
  pickupDistrict: string;
  pickupState?: string;
  pickupAddress?: string;
  deliveryDistrict?: string;
  deliveryState?: string;
  deliveryAddress?: string;
  requiresRefrigeration?: boolean;
}): Promise<LogisticsJob> {
  const jobId = 'job_lst_' + params.listingId;

  const existing = await collections.logisticsJobs.doc(jobId).get();
  if (existing.exists) {
    return existing.data() as LogisticsJob;
  }

  const deliveryDistrict = params.deliveryDistrict || 'Bengaluru Urban';
  const deliveryState = params.deliveryState || 'Karnataka';
  const distanceKm = calculateDistanceKm(params.pickupDistrict, deliveryDistrict);
  
  // Calculate market-based transport fee from distance (km) and cargo weight
  const marketPricing = calculateMarketFreight(
    distanceKm,
    params.quantityKg,
    params.requiresRefrigeration
  );
  const feePaise = marketPricing.totalFeePaise;

  const now = new Date().toISOString();

  const job: LogisticsJob = {
    id: jobId,
    sourceType: 'listing',
    sourceId: params.listingId,
    listingId: params.listingId,
    farmerId: params.farmerId,
    farmerName: params.farmerName,
    crop: params.crop,
    variety: params.variety,
    qualityGrade: params.qualityGrade,
    totalQuantityKg: params.quantityKg,
    remainingUnassignedKg: params.quantityKg,
    pickupDistrict: params.pickupDistrict,
    pickupState: params.pickupState || 'Karnataka',
    pickupAddress: params.pickupAddress || (params.pickupDistrict + ' Farm Gate Node'),
    deliveryDistrict,
    deliveryState,
    deliveryAddress: params.deliveryAddress || (deliveryDistrict + ' Wholesale Mandi Hub'),
    estimatedDistanceKm: distanceKm,
    totalLogisticsFee: feePaise,
    requiresRefrigeration: params.requiresRefrigeration || false,
    status: 'open',
    trips: [],
    createdAt: now,
    updatedAt: now,
  };

  await collections.logisticsJobs.doc(jobId).set(job);
  return job;
}

/**
 * Creates or updates a Logistics Job for an order placed by a wholesaler.
 */
export async function createLogisticsJobForOrder(params: {
  orderId: string;
  crop: string;
  totalQuantityKg: number;
  pickupDistrict: string;
  pickupState?: string;
  pickupAddress?: string;
  deliveryDistrict: string;
  deliveryState?: string;
  deliveryAddress?: string;
  logisticsFeePaise: number;
  requiresRefrigeration?: boolean;
}): Promise<LogisticsJob> {
  const jobId = 'job_' + params.orderId;
  
  const existing = await collections.logisticsJobs.doc(jobId).get();
  if (existing.exists) {
    return existing.data() as LogisticsJob;
  }

  const distanceKm = calculateDistanceKm(params.pickupDistrict, params.deliveryDistrict);
  const marketPricing = calculateMarketFreight(
    distanceKm,
    params.totalQuantityKg,
    params.requiresRefrigeration
  );
  const totalLogisticsFee = params.logisticsFeePaise || marketPricing.totalFeePaise;
  const now = new Date().toISOString();

  const job: LogisticsJob = {
    id: jobId,
    sourceType: 'order',
    sourceId: params.orderId,
    orderId: params.orderId,
    crop: params.crop,
    totalQuantityKg: params.totalQuantityKg,
    remainingUnassignedKg: params.totalQuantityKg,
    pickupDistrict: params.pickupDistrict,
    pickupState: params.pickupState || 'Karnataka',
    pickupAddress: params.pickupAddress || (params.pickupDistrict + ' Farm Gate APMC Node'),
    deliveryDistrict: params.deliveryDistrict,
    deliveryState: params.deliveryState || 'Karnataka',
    deliveryAddress: params.deliveryAddress || (params.deliveryDistrict + ' Wholesale Hub'),
    estimatedDistanceKm: distanceKm,
    totalLogisticsFee,
    requiresRefrigeration: params.requiresRefrigeration || false,
    status: 'open',
    trips: [],
    createdAt: now,
    updatedAt: now,
  };

  await collections.logisticsJobs.doc(jobId).set(job);
  return job;
}

/**
 * Creates a Logistics Job for farm-to-cold-storage haulage transport.
 */
export async function createLogisticsJobForStorageBooking(params: {
  storageBookingId: string;
  facilityId: string;
  facilityName: string;
  facilityDistrict: string;
  facilityAddress: string;
  userId: string;
  userName: string;
  userRole: 'farmer' | 'wholesaler';
  crop: string;
  quantityKg: number;
  pickupAddress: string;
  pickupDistrict: string;
}): Promise<LogisticsJob> {
  const jobId = 'job_str_' + params.storageBookingId;

  const existing = await collections.logisticsJobs.doc(jobId).get();
  if (existing.exists) {
    return existing.data() as LogisticsJob;
  }

  const distanceKm = calculateDistanceKm(params.pickupDistrict, params.facilityDistrict);
  const marketPricing = calculateMarketFreight(distanceKm, params.quantityKg, true);
  const feePaise = marketPricing.totalFeePaise;
  const now = new Date().toISOString();

  const job: LogisticsJob = {
    id: jobId,
    sourceType: 'storage_booking',
    sourceId: params.storageBookingId,
    storageBookingId: params.storageBookingId,
    facilityId: params.facilityId,
    facilityName: params.facilityName,
    farmerId: params.userId,
    farmerName: params.userName,
    crop: params.crop,
    totalQuantityKg: params.quantityKg,
    remainingUnassignedKg: params.quantityKg,
    pickupDistrict: params.pickupDistrict,
    pickupState: 'Karnataka',
    pickupAddress: params.pickupAddress,
    deliveryDistrict: params.facilityDistrict,
    deliveryState: 'Karnataka',
    deliveryAddress: params.facilityAddress,
    estimatedDistanceKm: Math.max(distanceKm, 20),
    totalLogisticsFee: feePaise,
    requiresRefrigeration: true,
    status: 'open',
    trips: [],
    createdAt: now,
    updatedAt: now,
  };

  await collections.logisticsJobs.doc(jobId).set(job);
  return job;
}

/**
 * Fetches all available logistics jobs.
 */
export async function getAvailableJobs(district?: string): Promise<LogisticsJob[]> {
  const snapshot = await collections.logisticsJobs
    .where('remainingUnassignedKg', '>', 0)
    .get();

  let jobs = snapshot.docs
    .map((d) => d.data() as LogisticsJob)
    .filter((j) => j.status !== 'completed' && j.status !== 'fully_assigned');

  if (district) {
    jobs.sort((a, b) => {
      const aMatch = a.pickupDistrict.toLowerCase() === district.toLowerCase() ? 1 : 0;
      const bMatch = b.pickupDistrict.toLowerCase() === district.toLowerCase() ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  } else {
    jobs.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  return jobs;
}

/**
 * Fetches all trips assigned to a specific driver.
 */
export async function getDriverTrips(driverId: string): Promise<Array<{ job: LogisticsJob; trip: LogisticsTrip }>> {
  const snapshot = await collections.logisticsJobs.get();
  const results: Array<{ job: LogisticsJob; trip: LogisticsTrip }> = [];

  for (const doc of snapshot.docs) {
    const job = doc.data() as LogisticsJob;
    if (job.trips && Array.isArray(job.trips)) {
      for (const trip of job.trips) {
        if (trip.assignedDriverId === driverId) {
          results.push({ job, trip });
        }
      }
    }
  }

  results.sort((a, b) =>
    (b.trip.pickupTime || b.job.updatedAt || '').localeCompare(
      a.trip.pickupTime || a.job.updatedAt || ''
    )
  );
  return results;
}

/**
 * Fetches a single logistics job by ID.
 */
export async function getJobById(jobId: string): Promise<LogisticsJob | null> {
  const doc = await collections.logisticsJobs.doc(jobId).get();
  if (!doc.exists) return null;
  return doc.data() as LogisticsJob;
}

/**
 * Assigns a driver to haul a trip for a job.
 */
export async function assignDriverTrip(params: {
  jobId: string;
  driver: UserProfile;
  requestedTripsCount?: number;
}): Promise<{ job: LogisticsJob; newTrips: LogisticsTrip[] }> {
  const { jobId, driver, requestedTripsCount = 1 } = params;

  if (driver.role !== 'logistics_driver') {
    throw new Error('Only registered logistics drivers can accept delivery jobs');
  }

  const vehicleCapacity = Number(driver.vehicleCapacityKg) || 2000;
  if (vehicleCapacity <= 0) {
    throw new Error('Invalid driver vehicle capacity');
  }

  const jobRef = collections.logisticsJobs.doc(jobId);

  return await db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new Error('Logistics job not found');
    }

    const job = jobDoc.data() as LogisticsJob;
    if (job.remainingUnassignedKg <= 0) {
      throw new Error('This shipment has already been claimed by another driver');
    }

    if (job.requiresRefrigeration && !driver.isRefrigerated) {
      throw new Error('This shipment requires a refrigerated vehicle');
    }

    let remaining = job.remainingUnassignedKg;
    const newTrips: LogisticsTrip[] = [];
    const existingTrips = job.trips || [];

    for (let i = 0; i < requestedTripsCount; i++) {
      if (remaining <= 0) break;

      const tripQuantity = Math.min(vehicleCapacity, remaining);
      const tripMarket = calculateMarketFreight(
        job.estimatedDistanceKm,
        tripQuantity,
        job.requiresRefrigeration
      );
      const tripFeePaise = tripMarket.totalFeePaise;

      const tripNumber = existingTrips.length + newTrips.length + 1;
      const tripId = 'trip_' + job.id + '_' + tripNumber + '_' + Math.random().toString(36).slice(2, 6);
      const pickupOtp = String(Math.floor(100000 + Math.random() * 900000));
      const deliveryOtp = String(Math.floor(100000 + Math.random() * 900000));

      const pCoords = DISTRICT_COORDS[job.pickupDistrict] || { lat: 12.5, lng: 76.8 };

      const trip: LogisticsTrip = {
        tripId,
        tripNumber,
        assignedDriverId: driver.clerkUserId,
        assignedDriverName: driver.name,
        assignedDriverPhone: driver.phone || '+919876543210',
        vehicleNumber: driver.vehicleNumber || 'KA-11-E-4281',
        vehicleType: driver.vehicleType || 'truck',
        vehicleCapacityKg: vehicleCapacity,
        assignedQuantityKg: tripQuantity,
        tripFee: tripFeePaise,
        status: 'assigned',
        pickupOtp,
        deliveryOtp,
        currentLocation: {
          lat: pCoords.lat,
          lng: pCoords.lng,
          address: job.pickupAddress || (job.pickupDistrict + ' Farm Gate APMC Node'),
          updatedAt: new Date().toISOString(),
        },
      };

      newTrips.push(trip);
      remaining -= tripQuantity;
    }

    const updatedTrips = [...existingTrips, ...newTrips];
    const fullyAssigned = remaining === 0;

    let newJobStatus: LogisticsJob['status'] = job.status;
    if (fullyAssigned) {
      newJobStatus = 'fully_assigned';
    } else if (updatedTrips.length > 0) {
      newJobStatus = 'partially_assigned';
    }

    const now = new Date().toISOString();
    transaction.update(jobRef, {
      trips: updatedTrips,
      remainingUnassignedKg: remaining,
      status: newJobStatus,
      updatedAt: now,
    });

    return {
      job: {
        ...job,
        trips: updatedTrips,
        remainingUnassignedKg: remaining,
        status: newJobStatus,
        updatedAt: now,
      },
      newTrips,
    };
  });
}

/**
 * Updates a trip's lifecycle status.
 */
export async function updateTripStatus(params: {
  jobId: string;
  tripId: string;
  driverId: string;
  newStatus: LogisticsTrip['status'];
  otpInput?: string;
  location?: { lat: number; lng: number; address?: string };
}): Promise<{ job: LogisticsJob; updatedTrip: LogisticsTrip }> {
  const { jobId, tripId, driverId, newStatus, otpInput, location } = params;
  const jobRef = collections.logisticsJobs.doc(jobId);

  return await db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new Error('Logistics job not found');
    }

    const job = jobDoc.data() as LogisticsJob;
    const trips = job.trips || [];
    const tripIndex = trips.findIndex((t) => t.tripId === tripId);

    if (tripIndex === -1) {
      throw new Error('Trip not found');
    }

    const trip = trips[tripIndex];
    if (trip.assignedDriverId !== driverId) {
      throw new Error('Unauthorized: You are not the assigned driver for this trip');
    }

    const now = new Date().toISOString();

    if (newStatus === 'picked_up') {
      if (trip.pickupOtp && otpInput && trip.pickupOtp !== otpInput.trim()) {
        throw new Error('Invalid Pickup OTP from farmer');
      }
      trip.pickupTime = now;
    }

    if (newStatus === 'delivered') {
      if (trip.deliveryOtp && otpInput && trip.deliveryOtp !== otpInput.trim()) {
        throw new Error('Invalid Delivery OTP from recipient');
      }
      trip.deliveredTime = now;
    }

    trip.status = newStatus;
    if (location) {
      trip.currentLocation = {
        ...location,
        updatedAt: now,
      };
    }

    trips[tripIndex] = trip;

    const allDelivered = trips.every((t) => t.status === 'delivered') && job.remainingUnassignedKg === 0;
    const anyInProgress = trips.some((t) => ['en_route_pickup', 'picked_up', 'in_transit'].includes(t.status));

    let jobStatus: LogisticsJob['status'] = job.status;
    if (allDelivered) {
      jobStatus = 'completed';
    } else if (anyInProgress) {
      jobStatus = 'in_progress';
    }

    transaction.update(jobRef, {
      trips,
      status: jobStatus,
      updatedAt: now,
    });

    return {
      job: { ...job, trips, status: jobStatus, updatedAt: now },
      updatedTrip: trip,
    };
  });
}
