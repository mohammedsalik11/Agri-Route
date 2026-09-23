import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import coldStoragesData from '@/data/cold-storages.json';

/**
 * POST /api/demo/reset
 * Re-seeds the database to a clean demo state with interconnected entities.
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
    ];

    for (const collectionName of collectionsToReset) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      if (snapshot.docs.length > 0) {
        await batch.commit();
      }
    }

    // Seed demo pool with 8 farmers at 2,400/3,000 kg (missing Lakshmamma's 600 kg)
    const demoFarmers = [
      { name: 'Rajamma', qty: 350, price: 1400, lat: 12.5235, lng: 76.8912 },
      { name: 'Nagaraju', qty: 280, price: 1350, lat: 12.5301, lng: 76.8845 },
      { name: 'Manjunath', qty: 320, price: 1450, lat: 12.5178, lng: 76.8978 },
      { name: 'Savithramma', qty: 400, price: 1380, lat: 12.5289, lng: 76.8867 },
      { name: 'Venkatesh', qty: 250, price: 1420, lat: 12.5145, lng: 76.8934 },
      { name: 'Shivamma', qty: 300, price: 1390, lat: 12.5267, lng: 76.8901 },
      { name: 'Basavaraj', qty: 280, price: 1410, lat: 12.5198, lng: 76.8856 },
      { name: 'Gangamma', qty: 220, price: 1370, lat: 12.5312, lng: 76.8923 },
    ];

    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 5);

    const listingIds: string[] = [];
    let totalQty = 0;
    let weightedPriceSum = 0;

    for (let i = 0; i < demoFarmers.length; i++) {
      const f = demoFarmers[i];
      const listingId = `demo_lst_${i}`;
      listingIds.push(listingId);
      totalQty += f.qty;
      weightedPriceSum += f.qty * f.price;

      await db.collection('listings').doc(listingId).set({
        listingId,
        farmerId: `demo_farmer_${i}`,
        farmerName: f.name,
        crop: 'tomato',
        variety: 'Local',
        quantityKg: f.qty,
        askPricePerKg: f.price,
        qualityGrade: 'A',
        gradeSource: 'self-declared',
        photoUrl: '',
        harvestDate: now.toISOString().slice(0, 10),
        availableUntil: windowEnd.toISOString().slice(0, 10),
        district: 'Mandya',
        state: 'Karnataka',
        lat: f.lat,
        lng: f.lng,
        priceCheck: {
          mspPerKg: null,
          mandiModalPerKg: 1400,
          mandiMinPerKg: 800,
          mandiMaxPerKg: 2200,
          verdict: 'FAIR',
          dataSource: 'CACHED',
          checkedAt: now.toISOString(),
        },
        poolId: 'demo_pool_tomato',
        status: 'pooled',
        createdAt: new Date(now.getTime() - (8 - i) * 3600000).toISOString(),
      });
    }

    const weightedAsk = Math.round(weightedPriceSum / totalQty);
    const poolPrice = Math.round(weightedAsk * 0.98); // 2% discount

    await db.collection('pools').doc('demo_pool_tomato').set({
      poolId: 'demo_pool_tomato',
      crop: 'tomato',
      qualityGrade: 'A',
      district: 'Mandya',
      state: 'Karnataka',
      centroid: { lat: 12.524, lng: 76.890 },
      windowStart: now.toISOString(),
      windowEnd: windowEnd.toISOString(),
      targetKg: 3000,
      currentKg: totalQty, // 2,400 kg — Lakshmamma's 600 completes it
      farmerCount: demoFarmers.length,
      listingIds,
      weightedAskPricePerKg: weightedAsk,
      poolPricePerKg: poolPrice,
      status: 'open',
      createdAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
    });

    // Seed cold storage facilities into Firestore
    for (const fac of coldStoragesData) {
      await db.collection('coldStorages').doc(fac.facilityId).set(fac, { merge: true });
    }

    return NextResponse.json({
      ok: true,
      data: {
        message: 'Interconnected demo seed reset complete',
        pool: {
          id: 'demo_pool_tomato',
          currentKg: totalQty,
          targetKg: 3000,
          farmerCount: demoFarmers.length,
          missingKg: 3000 - totalQty,
          note: `Pool at ${totalQty}/3000 kg. Lakshmamma's 600 kg will complete it.`,
        },
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
