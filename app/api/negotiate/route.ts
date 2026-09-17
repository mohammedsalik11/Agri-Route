import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { collections } from '@/lib/firebase-admin';
import { negotiationService } from '@/lib/services/negotiationService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    if (role === 'farmer') {
      const authResult = await requireRole('farmer');
      if (authResult.error) return authResult.error;
      const data = await negotiationService.getNegotiationsForFarmer(authResult.user.clerkUserId);
      return NextResponse.json({ ok: true, data });
    } else if (role === 'wholesaler') {
      const authResult = await requireRole('wholesaler');
      if (authResult.error) return authResult.error;
      const data = await negotiationService.getNegotiationsForWholesaler(authResult.user.clerkUserId);
      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, message: 'Invalid role' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireRole('wholesaler');
    if (authResult.error) return authResult.error;

    const body = await req.json();
    const { poolId, offerPricePerKgPaise, message } = body;

    if (!poolId || !offerPricePerKgPaise) {
      return NextResponse.json({ ok: false, message: 'Missing fields' }, { status: 400 });
    }

    const candidateIds = Array.from(new Set([poolId, decodeURIComponent(poolId || '')]));
    let poolDoc = null;
    for (const cid of candidateIds) {
      const doc = await collections.pools.doc(cid).get();
      if (doc.exists) {
        poolDoc = doc;
        break;
      }
    }
    if (!poolDoc) {
      for (const cid of candidateIds) {
        const snap = await collections.pools.where('poolId', '==', cid).limit(1).get();
        if (!snap.empty) {
          poolDoc = snap.docs[0];
          break;
        }
      }
    }

    let crop = 'tomato'; // Default fallback
    let district = 'Mandya';
    let state = 'Karnataka';
    let listingPricePerKgPaise = 1460;
    let farmerId = 'all_farmers';
    let farmerIds: string[] = [];

    if (poolDoc && poolDoc.exists) {
      const poolData = poolDoc.data()!;
      crop = poolData.crop || crop;
      district = poolData.district || district;
      state = poolData.state || state;
      listingPricePerKgPaise = poolData.poolPricePerKg || poolData.weightedAskPricePerKg || poolData.pooledPrice || listingPricePerKgPaise;
      
      const memberListingIds: string[] = poolData.listingIds || [];
      if (memberListingIds.length > 0) {
        const listingDocs = await Promise.all(
          memberListingIds.map(id => collections.listings.doc(id).get())
        );
        farmerIds = Array.from(
          new Set(
            listingDocs
              .filter(d => d.exists)
              .map(d => d.data()?.farmerId)
              .filter(Boolean)
          )
        );
      }
      farmerId = farmerIds[0] || poolData.creatorId || 'all_farmers';
    }

    const result = await negotiationService.createNegotiation({
      poolId,
      crop,
      district,
      state,
      wholesalerId: authResult.user.clerkUserId,
      wholesalerBusinessName: authResult.user.businessName || 'Wholesaler',
      farmerId,
      farmerIds: farmerIds.length > 0 ? farmerIds : [farmerId],
      offerPricePerKgPaise,
      listingPricePerKgPaise,
      message,
    });

    if (result.ok) {
      // Send notifications to all relevant farmers
      const notifyTargets = farmerIds.length > 0 ? farmerIds : [farmerId];
      for (const targetId of notifyTargets) {
        if (targetId && targetId !== 'all_farmers') {
          await collections.notifications.add({
            userId: targetId,
            type: 'NEGOTIATION_RECEIVED',
            title: 'New Price Offer Received! 💬',
            body: `A wholesaler offered ₹${(offerPricePerKgPaise / 100).toFixed(2)}/kg for your ${crop} pool. Review and respond now!`,
            createdAt: new Date().toISOString(),
          });
        }
      }
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
