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
  sourceType: 'listing' | 'order' | 'pool';
  sourceId: string;
  orderId?: string;
  listingId?: string;
  poolId?: string;
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

// Karnataka district coordinates for distance calculation
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
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
};

export function calculateDistanceKm(fromDistrict: string, toDistrict: string): number {
  const c1 = DISTRICT_COORDS[fromDistrict] || { lat: 12.5, lng: 76.8 };
  const c2 = DISTRICT_COORDS[toDistrict] || { lat: 12.97, lng: 77.59 };
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
  const jobId = `job_lst_${params.listingId}`;

  const existing = await collections.logisticsJobs.doc(jobId).get();
  if (existing.exists) {
    return existing.data() as LogisticsJob;
  }

  const deliveryDistrict = params.deliveryDistrict || 'Bengaluru Urban';
  const deliveryState = params.deliveryState || 'Karnataka';
  const distanceKm = calculateDistanceKm(params.pickupDistrict, deliveryDistrict);
  
  // Calculate standard 5% transport fee or min ₹1.20/kg
  const subtotal = params.quantityKg * params.askPricePerKg;
  const feePaise = Math.max(
    Math.round(subtotal * 0.05),
    Math.round(params.quantityKg * 120)
  );

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
    pickupAddress: params.pickupAddress || `${params.pickupDistrict} Farm Gate Node`,
    deliveryDistrict,
    deliveryState,
    deliveryAddress: params.deliveryAddress || `${deliveryDistrict} Wholesale Mandi Hub`,
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
  const jobId = `job_${params.orderId}`;
  
  const existing = await collections.logisticsJobs.doc(jobId).get();
  if (existing.exists) {
    return existing.data() as LogisticsJob;
  }

  const distanceKm = calculateDistanceKm(params.pickupDistrict, params.deliveryDistrict);
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
    pickupAddress: params.pickupAddress || `${params.pickupDistrict} Farm Gate APMC Node`,
    deliveryDistrict: params.deliveryDistrict,
    deliveryState: params.deliveryState || 'Karnataka',
    deliveryAddress: params.deliveryAddress || `${params.deliveryDistrict} Wholesale Hub`,
    estimatedDistanceKm: distanceKm,
    totalLogisticsFee: params.logisticsFeePaise,
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
 * Fetches all available logistics jobs (open or partially assigned with remaining kg > 0).
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
 * PREVENTS DOUBLE ASSIGNMENT via Firestore Transaction.
 * STRICT CAPACITY CONSTRAINT:
 * assignedQuantityKg <= vehicleCapacityKg is enforced.
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

      // Strict constraint: Each trip load is MIN(vehicleCapacity, remaining)
      const tripQuantity = Math.min(vehicleCapacity, remaining);
      const tripFeePaise = Math.round(
        (job.totalLogisticsFee * tripQuantity) / job.totalQuantityKg
      );

      const tripNumber = existingTrips.length + newTrips.length + 1;
      const tripId = `trip_${job.id}_${tripNumber}_${Math.random().toString(36).slice(2, 6)}`;
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
          address: `${job.pickupDistrict} Farm Gate APMC Node`,
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
 * Updates a trip's lifecycle status (en_route_pickup, picked_up, in_transit, delivered).
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
        throw new Error('Invalid Delivery OTP from wholesaler/buyer');
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
