const fs = require('fs');
const path = require('path');

const resetRouteContent = `import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import coldStoragesData from '@/data/cold-storages.json';

/**
 * POST /api/demo/reset
 * Re-seeds the database to a clean demo state with interconnected Pan-India entities.
 */
export async function POST() {
  try {
    // Delete all existing data
    const collectionsToReset = [
      'users',
      'listings',
      'pools',
      'orders',
      'logisticsJobs',
      'negotiations',
      'storageBookings',
      'verificationBookings',
      'notifications',
      'priceCache',
      'coldStorages',
      'conversations',
    ];

    for (const collectionName of collectionsToReset) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      if (snapshot.docs.length > 0) {
        await batch.commit();
      }
    }

    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 7);

    // 1. Seed Pan-India Cold Storages (All 36 Facilities)
    for (const fac of coldStoragesData) {
      await db.collection('coldStorages').doc(fac.facilityId).set(fac, { merge: true });
    }

    // 2. Pan-India Produce Pools & Listings
    const PAN_INDIA_POOLS = [
      {
        poolId: 'demo_pool_tomato',
        crop: 'tomato',
        variety: 'Bangalore Blue',
        grade: 'A',
        district: 'Mandya',
        state: 'Karnataka',
        centroid: { lat: 12.524, lng: 76.890 },
        targetKg: 3000,
        vehicleType: 'mini_truck',
        vehicleCapacityKg: 3000,
        mandiModal: 1400,
        msp: null,
        farmers: [
          { name: 'Rajamma', qty: 350, price: 1400, lat: 12.5235, lng: 76.8912 },
          { name: 'Nagaraju', qty: 280, price: 1350, lat: 12.5301, lng: 76.8845 },
          { name: 'Manjunath', qty: 320, price: 1450, lat: 12.5178, lng: 76.8978 },
          { name: 'Savithramma', qty: 400, price: 1380, lat: 12.5289, lng: 76.8867 },
          { name: 'Venkatesh', qty: 250, price: 1420, lat: 12.5145, lng: 76.8934 },
          { name: 'Shivamma', qty: 300, price: 1390, lat: 12.5267, lng: 76.8901 },
          { name: 'Basavaraj', qty: 280, price: 1410, lat: 12.5198, lng: 76.8856 },
          { name: 'Gangamma', qty: 220, price: 1370, lat: 12.5312, lng: 76.8923 },
        ],
      },
      {
        poolId: 'demo_pool_onion_nashik',
        crop: 'onion',
        variety: 'Nashik Red Export',
        grade: 'A',
        district: 'Nashik',
        state: 'Maharashtra',
        centroid: { lat: 20.005, lng: 74.002 },
        targetKg: 10000,
        vehicleType: 'truck',
        vehicleCapacityKg: 10000,
        mandiModal: 2400,
        msp: null,
        farmers: [
          { name: 'Ramesh Patil', qty: 3000, price: 2400, lat: 20.012, lng: 73.998 },
          { name: 'Dattatray Shinde', qty: 2500, price: 2350, lat: 20.024, lng: 74.015 },
          { name: 'Sunil Kadam', qty: 1500, price: 2420, lat: 19.989, lng: 74.032 },
        ],
      },
      {
        poolId: 'demo_pool_wheat_ludhiana',
        crop: 'wheat',
        variety: 'Sharbati High Protein',
        grade: 'A',
        district: 'Ludhiana',
        state: 'Punjab',
        centroid: { lat: 30.901, lng: 75.857 },
        targetKg: 10000,
        vehicleType: 'truck',
        vehicleCapacityKg: 10000,
        mandiModal: 2600,
        msp: 2585,
        farmers: [
          { name: 'Gurpreet Singh', qty: 4000, price: 2650, lat: 30.912, lng: 75.845 },
          { name: 'Harbhajan Singh', qty: 2500, price: 2680, lat: 30.895, lng: 75.872 },
          { name: 'Balwinder Sandhu', qty: 2000, price: 2620, lat: 30.923, lng: 75.839 },
        ],
      },
      {
        poolId: 'demo_pool_potato_agra',
        crop: 'potato',
        variety: 'Kufri Jyoti Table',
        grade: 'A',
        district: 'Agra',
        state: 'Uttar Pradesh',
        centroid: { lat: 27.176, lng: 78.008 },
        targetKg: 10000,
        vehicleType: 'truck',
        vehicleCapacityKg: 10000,
        mandiModal: 1600,
        msp: null,
        farmers: [
          { name: 'Shiv Charan Yadav', qty: 3500, price: 1650, lat: 27.185, lng: 78.019 },
          { name: 'Ram Niwas Sharma', qty: 3500, price: 1620, lat: 27.162, lng: 77.994 },
        ],
      },
      {
        poolId: 'demo_pool_chilli_guntur',
        crop: 'green_chilli',
        variety: 'Guntur Teja S17',
        grade: 'A',
        district: 'Guntur',
        state: 'Andhra Pradesh',
        centroid: { lat: 16.306, lng: 80.436 },
        targetKg: 3000,
        vehicleType: 'mini_truck',
        vehicleCapacityKg: 3000,
        mandiModal: 18200,
        msp: null,
        farmers: [
          { name: 'Venkat Rao', qty: 1200, price: 18500, lat: 16.315, lng: 80.448 },
          { name: 'Subba Reddy', qty: 900, price: 18200, lat: 16.298, lng: 80.422 },
        ],
      },
      {
        poolId: 'demo_pool_groundnut_rajkot',
        crop: 'groundnut',
        variety: 'Bold Saurashtra Pods',
        grade: 'A',
        district: 'Rajkot',
        state: 'Gujarat',
        centroid: { lat: 22.303, lng: 70.802 },
        targetKg: 7000,
        vehicleType: 'pickup',
        vehicleCapacityKg: 7000,
        mandiModal: 6700,
        msp: 6783,
        farmers: [
          { name: 'Rajesh Patel', qty: 3000, price: 6800, lat: 22.315, lng: 70.815 },
          { name: 'Pravinbhai Gohil', qty: 2200, price: 6750, lat: 22.292, lng: 70.789 },
        ],
      },
    ];

    for (const p of PAN_INDIA_POOLS) {
      const listingIds = [];
      let totalQty = 0;
      let weightedPriceSum = 0;

      for (let i = 0; i < p.farmers.length; i++) {
        const f = p.farmers[i];
        const listingId = \`lst_\${p.poolId}_\${i}\`;
        listingIds.push(listingId);
        totalQty += f.qty;
        weightedPriceSum += f.qty * f.price;

        await db.collection('listings').doc(listingId).set({
          listingId,
          farmerId: \`farmer_\${p.district.toLowerCase()}_\${i}\`,
          farmerName: f.name,
          crop: p.crop,
          variety: p.variety,
          quantityKg: f.qty,
          askPricePerKg: f.price,
          qualityGrade: p.grade,
          gradeSource: 'ai',
          photoUrl: '',
          harvestDate: now.toISOString().slice(0, 10),
          availableUntil: windowEnd.toISOString().slice(0, 10),
          district: p.district,
          state: p.state,
          lat: f.lat,
          lng: f.lng,
          vehicleType: p.vehicleType,
          vehicleCapacityKg: p.vehicleCapacityKg,
          targetKg: p.targetKg,
          priceCheck: {
            mspPerKg: p.msp,
            mandiModalPerKg: p.mandiModal,
            mandiMinPerKg: Math.round(p.mandiModal * 0.8),
            mandiMaxPerKg: Math.round(p.mandiModal * 1.25),
            verdict: 'FAIR',
            dataSource: 'AGMARKNET_LIVE',
            checkedAt: now.toISOString(),
          },
          poolId: p.poolId,
          status: 'pooled',
          createdAt: new Date(now.getTime() - (8 - i) * 3600000).toISOString(),
        });
      }

      const weightedAsk = Math.round(weightedPriceSum / totalQty);
      const poolPrice = Math.round(weightedAsk * 0.98);

      await db.collection('pools').doc(p.poolId).set({
        poolId: p.poolId,
        crop: p.crop,
        variety: p.variety,
        qualityGrade: p.grade,
        district: p.district,
        state: p.state,
        centroid: p.centroid,
        windowStart: now.toISOString(),
        windowEnd: windowEnd.toISOString(),
        targetKg: p.targetKg,
        currentKg: totalQty,
        farmerCount: p.farmers.length,
        listingIds,
        weightedAskPricePerKg: weightedAsk,
        poolPricePerKg: poolPrice,
        status: 'open',
        createdAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      });
    }

    // 3. Pan-India Logistics Jobs with Standard Market KM Rates
    const LOGISTICS_JOBS = [
      {
        id: 'job_ka_mandya_01',
        sourceType: 'pool',
        sourceId: 'demo_pool_tomato',
        poolId: 'demo_pool_tomato',
        crop: 'tomato',
        variety: 'Bangalore Blue',
        totalQuantityKg: 2400,
        remainingUnassignedKg: 2400,
        pickupAddress: 'Tubinakere Agritech Aggregation Center, Mandya',
        pickupDistrict: 'Mandya',
        pickupState: 'Karnataka',
        deliveryAddress: 'Yeshwanthpur APMC Yard Gate 4, Bengaluru',
        deliveryDistrict: 'Bengaluru Urban',
        deliveryState: 'Karnataka',
        estimatedDistanceKm: 95,
        totalLogisticsFee: 350000,
        requiresRefrigeration: false,
        status: 'open',
        trips: [
          {
            tripId: 'trip_mandya_01',
            tripNumber: 1,
            assignedQuantityKg: 2400,
            vehicleType: 'mini_truck',
            vehicleCapacityKg: 3000,
            tripFee: 350000,
            status: 'pending',
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'job_mh_nashik_01',
        sourceType: 'pool',
        sourceId: 'demo_pool_onion_nashik',
        poolId: 'demo_pool_onion_nashik',
        crop: 'onion',
        variety: 'Nashik Red Export',
        totalQuantityKg: 7000,
        remainingUnassignedKg: 7000,
        pickupAddress: 'Lasalgaon Mandi Yard Gate 1, Nashik',
        pickupDistrict: 'Nashik',
        pickupState: 'Maharashtra',
        deliveryAddress: 'Vashi Wholesale APMC Market Bay 12, Navi Mumbai',
        deliveryDistrict: 'Mumbai Suburban',
        deliveryState: 'Maharashtra',
        estimatedDistanceKm: 168,
        totalLogisticsFee: 805600,
        requiresRefrigeration: false,
        status: 'open',
        trips: [
          {
            tripId: 'trip_nashik_01',
            tripNumber: 1,
            assignedQuantityKg: 7000,
            vehicleType: 'truck',
            vehicleCapacityKg: 10000,
            tripFee: 805600,
            status: 'pending',
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'job_up_agra_01',
        sourceType: 'pool',
        sourceId: 'demo_pool_potato_agra',
        poolId: 'demo_pool_potato_agra',
        crop: 'potato',
        variety: 'Kufri Jyoti Table',
        totalQuantityKg: 7000,
        remainingUnassignedKg: 7000,
        pickupAddress: 'Khandari Cold Storage Cluster, Agra',
        pickupDistrict: 'Agra',
        pickupState: 'Uttar Pradesh',
        deliveryAddress: 'Azadpur Mandi Shed B-4, New Delhi',
        deliveryDistrict: 'Delhi',
        deliveryState: 'Delhi',
        estimatedDistanceKm: 215,
        totalLogisticsFee: 1003000,
        requiresRefrigeration: false,
        status: 'open',
        trips: [
          {
            tripId: 'trip_agra_01',
            tripNumber: 1,
            assignedQuantityKg: 7000,
            vehicleType: 'truck',
            vehicleCapacityKg: 10000,
            tripFee: 1003000,
            status: 'pending',
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'job_pb_ludhiana_01',
        sourceType: 'pool',
        sourceId: 'demo_pool_wheat_ludhiana',
        poolId: 'demo_pool_wheat_ludhiana',
        crop: 'wheat',
        variety: 'Sharbati High Protein',
        totalQuantityKg: 8500,
        remainingUnassignedKg: 8500,
        pickupAddress: 'Samrala Road Grain Depot, Ludhiana',
        pickupDistrict: 'Ludhiana',
        pickupState: 'Punjab',
        deliveryAddress: 'Khanna Asia Largest Grain Terminal, Khanna',
        deliveryDistrict: 'Ludhiana',
        deliveryState: 'Punjab',
        estimatedDistanceKm: 48,
        totalLogisticsFee: 418800,
        requiresRefrigeration: false,
        status: 'open',
        trips: [
          {
            tripId: 'trip_ludhiana_01',
            tripNumber: 1,
            assignedQuantityKg: 8500,
            vehicleType: 'truck',
            vehicleCapacityKg: 10000,
            tripFee: 418800,
            status: 'pending',
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'job_ap_guntur_01',
        sourceType: 'pool',
        sourceId: 'demo_pool_chilli_guntur',
        poolId: 'demo_pool_chilli_guntur',
        crop: 'green_chilli',
        variety: 'Guntur Teja S17',
        totalQuantityKg: 2100,
        remainingUnassignedKg: 2100,
        pickupAddress: 'Guntur Mirchi Yard Gate 3, Guntur',
        pickupDistrict: 'Guntur',
        pickupState: 'Andhra Pradesh',
        deliveryAddress: 'Kothapet Wholesale Spice Market, Hyderabad',
        deliveryDistrict: 'Hyderabad',
        deliveryState: 'Telangana',
        estimatedDistanceKm: 275,
        totalLogisticsFee: 890000,
        requiresRefrigeration: false,
        status: 'open',
        trips: [
          {
            tripId: 'trip_guntur_01',
            tripNumber: 1,
            assignedQuantityKg: 2100,
            vehicleType: 'mini_truck',
            vehicleCapacityKg: 3000,
            tripFee: 890000,
            status: 'pending',
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    for (const job of LOGISTICS_JOBS) {
      await db.collection('logisticsJobs').doc(job.id).set(job);
    }

    // 4. Seed Verified Storage Providers & Drivers
    await db.collection('users').doc('demo_storage_owner_01').set({
      clerkUserId: 'demo_storage_owner_01',
      role: 'storage_owner',
      name: 'H. M. Chandrashekar',
      ownerId: 'STO-KA-2026-1001',
      businessName: 'Karnataka Cold Chain Pvt Ltd',
      facilityName: 'Mandya Agri Cold Store',
      facilityId: 'cs-mandya-01',
      district: 'Mandya',
      state: 'Karnataka',
      phone: '+919876543210',
      email: 'chandrashekar@karnatakacold.in',
      licenseNumber: 'WDRA-KA-MAN-2024-0891',
      storageCapacityKg: 500000,
      availableCapacityKg: 180000,
      pricePerKgPerDay: 15,
      facilityAddress: 'Plot 14-16, KIADB Industrial Area, Tubinakere, Mandya - 571402',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      createdAt: now.toISOString(),
    });

    await db.collection('users').doc('demo_storage_owner_03').set({
      clerkUserId: 'demo_storage_owner_03',
      role: 'storage_owner',
      name: 'Dilip R. Deshmukh',
      ownerId: 'STO-MH-2026-1003',
      businessName: 'Maharashtra State Warehousing Corp',
      facilityName: 'Nashik Agro Cold Chain Hub',
      facilityId: 'cs-nashik-01',
      district: 'Nashik',
      state: 'Maharashtra',
      phone: '+919822334455',
      email: 'deshmukh@mswc.gov.in',
      licenseNumber: 'WDRA-MH-NAS-2023-0412',
      storageCapacityKg: 1000000,
      availableCapacityKg: 420000,
      pricePerKgPerDay: 14,
      facilityAddress: 'MIDC Ambad Industrial Area, Nashik - 422010',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      createdAt: now.toISOString(),
    });

    await db.collection('users').doc('demo_driver_01').set({
      clerkUserId: 'demo_driver_01',
      role: 'logistics_driver',
      name: 'Ramesh Transport',
      driverId: 'DRV-KA-2026-0042',
      phone: '+919845012345',
      vehicleNumber: 'KA-11-TR-4590',
      vehicleType: 'truck',
      vehicleCapacityKg: 10000,
      isRefrigerated: false,
      district: 'Mandya',
      state: 'Karnataka',
      verificationStatus: 'verified',
      createdAt: now.toISOString(),
    });

    await db.collection('users').doc('demo_driver_02').set({
      clerkUserId: 'demo_driver_02',
      role: 'logistics_driver',
      name: 'Harnek Singh Freight',
      driverId: 'DRV-PB-2026-0089',
      phone: '+919814098765',
      vehicleNumber: 'PB-10-CD-5678',
      vehicleType: 'truck',
      vehicleCapacityKg: 10000,
      isRefrigerated: true,
      district: 'Ludhiana',
      state: 'Punjab',
      verificationStatus: 'verified',
      createdAt: now.toISOString(),
    });

    return NextResponse.json({
      ok: true,
      data: {
        message: 'Pan-India demo reset complete across Karnataka, Maharashtra, Punjab, UP, Gujarat, and AP',
        poolsCount: PAN_INDIA_POOLS.length,
        coldStoragesCount: coldStoragesData.length,
        logisticsJobsCount: LOGISTICS_JOBS.length,
      },
    });
  } catch (error: unknown) {
    console.error('Demo reset error:', error);
    return NextResponse.json(
      { ok: false, error: 'RESET_FAILED', message: 'Failed to reset demo data' },
      { status: 500 }
    );
  }
}
`;

fs.writeFileSync(path.resolve(__dirname, '../app/api/demo/reset/route.ts'), resetRouteContent, 'utf8');
console.log('Successfully updated app/api/demo/reset/route.ts!');
