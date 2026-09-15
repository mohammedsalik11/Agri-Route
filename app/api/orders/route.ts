import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAnyRole } from '@/lib/auth';
import { collections } from '@/lib/firebase-admin';
import { createOrder, createRazorpayOrder } from '@/lib/services/escrowService';
import { lockPool } from '@/lib/services/poolingService';

// POST /api/orders — Create order from listing or pool (wholesaler only)
export async function POST(request: NextRequest) {
  const result = await requireRole('wholesaler');
  if (result.error) return result.error;
  const user = result.user;

  try {
    const body = await request.json();
    const { sourceType, sourceId } = body; // 'listing' or 'pool'

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'sourceType and sourceId required' },
        { status: 400 }
      );
    }

    let crop: string;
    let quantityKg: number;
    let pricePerKg: number;
    let farmerPayouts: Array<{ farmerId: string; farmerName: string; quantityKg: number }>;

    if (sourceType === 'pool') {
      const poolDoc = await collections.pools.doc(sourceId).get();
      if (!poolDoc.exists) {
        return NextResponse.json({ ok: false, error: 'NOT_FOUND', message: 'Pool not found' }, { status: 404 });
      }
      const pool = poolDoc.data()!;
      if (pool.status !== 'ready' && pool.status !== 'open') {
        return NextResponse.json({ ok: false, error: 'POOL_NOT_AVAILABLE', message: 'Pool is not available for purchase' }, { status: 400 });
      }

      crop = pool.crop;
      quantityKg = pool.currentKg;
      pricePerKg = pool.poolPricePerKg;

      // Get farmer details from listings
      const listingDocs = await Promise.all(
        pool.listingIds.map((id: string) => collections.listings.doc(id).get())
      );
      farmerPayouts = listingDocs
        .filter(d => d.exists)
        .map(d => {
          const data = d.data()!;
          return { farmerId: data.farmerId, farmerName: data.farmerName, quantityKg: data.quantityKg };
        });

      // Lock the pool
      await lockPool(sourceId);
    } else {
      // Individual listing
      const listingDoc = await collections.listings.doc(sourceId).get();
      if (!listingDoc.exists) {
        return NextResponse.json({ ok: false, error: 'NOT_FOUND', message: 'Listing not found' }, { status: 404 });
      }
      const listing = listingDoc.data()!;
      if (listing.status !== 'available') {
        return NextResponse.json({ ok: false, error: 'LISTING_NOT_AVAILABLE', message: 'Listing is not available' }, { status: 400 });
      }

      crop = listing.crop;
      quantityKg = listing.quantityKg;
      pricePerKg = listing.askPricePerKg;
      farmerPayouts = [{ farmerId: listing.farmerId, farmerName: listing.farmerName, quantityKg: listing.quantityKg }];

      await collections.listings.doc(sourceId).update({ status: 'locked' });
    }

    const order = await createOrder({
      buyerId: user.clerkUserId,
      buyerName: user.businessName || user.name,
      sourceType,
      sourceId,
      crop,
      quantityKg,
      pricePerKg,
      farmerPayouts,
    });

    // Create Razorpay order
    const rzp = await createRazorpayOrder(order.orderId, order.total);

    return NextResponse.json({
      ok: true,
      data: {
        order,
        razorpayOrderId: rzp.razorpayOrderId,
        razorpayKeyId: rzp.keyId,
      },
    });
  } catch (error: unknown) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/orders — Get user's orders (role-scoped)
export async function GET() {
  const result = await requireAnyRole();
  if (result.error) return result.error;
  const user = result.user;

  try {
    let snapshot;
    if (user.role === 'wholesaler') {
      snapshot = await collections.orders
        .where('buyerId', '==', user.clerkUserId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    } else {
      // For farmers, find orders containing their payouts
      snapshot = await collections.orders
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
    }

    let orders = snapshot.docs.map(d => d.data());

    // Filter for farmer's orders (orders where they have a payout entry)
    if (user.role === 'farmer') {
      orders = orders.filter(o =>
        o.payout?.some((p: { farmerId: string }) => p.farmerId === user.clerkUserId)
      );
    }

    return NextResponse.json({ ok: true, data: orders });
  } catch (error: unknown) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
