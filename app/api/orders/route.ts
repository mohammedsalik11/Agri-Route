import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAnyRole } from '@/lib/auth';
import { collections } from '@/lib/firebase-admin';
import { createOrder, createRazorpayOrder } from '@/lib/services/escrowService';
import { lockPool } from '@/lib/services/poolingService';
import { createLogisticsJobForOrder } from '@/lib/services/logisticsService';

// POST /api/orders — Create order from listing, pool, or multi-item cart (wholesaler only)
export async function POST(request: NextRequest) {
  const result = await requireRole('wholesaler');
  if (result.error) return result.error;
  const user = result.user;

  try {
    const body = await request.json();

    // Support both legacy single-item { sourceType, sourceId }
    // and new multi-item cart { items: [{ sourceType, sourceId }] }
    const rawItems: Array<{ sourceType: string; sourceId: string }> = body.items
      ? body.items
      : [{ sourceType: body.sourceType, sourceId: body.sourceId }];

    if (!rawItems.length || !rawItems[0]?.sourceType || !rawItems[0]?.sourceId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'sourceType and sourceId required' },
        { status: 400 }
      );
    }

    const createdOrders = [];
    let firstRzp: { razorpayOrderId: string; keyId: string } | null = null;

    for (const rawItem of rawItems) {
      const { sourceType, sourceId } = rawItem;

      let crop: string;
      let quantityKg: number;
      let pricePerKg: number;
      let pickupDistrict: string = 'Mandya';
      let farmerPayouts: Array<{ farmerId: string; farmerName: string; quantityKg: number }>;

      if (sourceType === 'pool') {
        const poolDoc = await collections.pools.doc(sourceId).get();
        if (!poolDoc.exists) {
          return NextResponse.json({ ok: false, error: 'NOT_FOUND', message: `Pool ${sourceId} not found` }, { status: 404 });
        }
        const pool = poolDoc.data()!;

        // If the pool was already locked, check if this buyer has an active unpaid order for it to resume checkout
        if (pool.status === 'locked') {
          const existingOrderSnap = await collections.orders
            .where('buyerId', '==', user.clerkUserId)
            .where('source.id', '==', sourceId)
            .where('escrow.status', '==', 'CREATED')
            .limit(1)
            .get();

          if (!existingOrderSnap.empty) {
            const existingOrder = existingOrderSnap.docs[0].data();
            createdOrders.push(existingOrder);
            continue;
          }
        }

        if (pool.status !== 'ready' && pool.status !== 'open') {
          return NextResponse.json({ ok: false, error: 'POOL_NOT_AVAILABLE', message: `Pool ${sourceId} is not available` }, { status: 400 });
        }

        crop = pool.crop;
        quantityKg = pool.currentKg;
        pricePerKg = pool.poolPricePerKg;
        pickupDistrict = pool.district || 'Mandya';

        const listingDocs = await Promise.all(
          pool.listingIds.map((id: string) => collections.listings.doc(id).get())
        );
        farmerPayouts = listingDocs
          .filter((d) => d.exists)
          .map((d) => {
            const data = d.data()!;
            return { farmerId: data.farmerId, farmerName: data.farmerName, quantityKg: data.quantityKg };
          });

        await lockPool(sourceId);
      } else {
        const listingDoc = await collections.listings.doc(sourceId).get();
        if (!listingDoc.exists) {
          return NextResponse.json({ ok: false, error: 'NOT_FOUND', message: `Listing ${sourceId} not found` }, { status: 404 });
        }
        const listing = listingDoc.data()!;

        // If listing was already locked, check if this buyer has an active unpaid order for it to resume checkout
        if (listing.status === 'locked') {
          const existingOrderSnap = await collections.orders
            .where('buyerId', '==', user.clerkUserId)
            .where('source.id', '==', sourceId)
            .where('escrow.status', '==', 'CREATED')
            .limit(1)
            .get();

          if (!existingOrderSnap.empty) {
            const existingOrder = existingOrderSnap.docs[0].data();
            createdOrders.push(existingOrder);
            continue;
          }
        }

        if (listing.status !== 'available') {
          return NextResponse.json({ ok: false, error: 'LISTING_NOT_AVAILABLE', message: `Listing ${sourceId} is not available` }, { status: 400 });
        }

        crop = listing.crop;
        quantityKg = listing.quantityKg;
        pricePerKg = listing.askPricePerKg;
        pickupDistrict = listing.district || 'Mandya';
        farmerPayouts = [{ farmerId: listing.farmerId, farmerName: listing.farmerName, quantityKg: listing.quantityKg }];

        await collections.listings.doc(sourceId).update({ status: 'locked' });
      }

      const order = await createOrder({
        buyerId: user.clerkUserId,
        buyerName: user.businessName || user.name,
        sourceType: sourceType as 'listing' | 'pool',
        sourceId,
        crop,
        quantityKg,
        pricePerKg,
        farmerPayouts,
      });

      // Auto-provision logistics shipment for this order
      await createLogisticsJobForOrder({
        orderId: order.orderId,
        crop: order.crop,
        totalQuantityKg: order.quantityKg,
        pickupDistrict,
        deliveryDistrict: user.district || 'Bengaluru Urban',
        logisticsFeePaise: order.logisticsFee,
      });

      const rzp = await createRazorpayOrder(order.orderId, order.total);
      createdOrders.push(order);
      if (!firstRzp) firstRzp = rzp;
    }

    // Single order → return in legacy format for backward-compat
    if (createdOrders.length === 1) {
      return NextResponse.json({
        ok: true,
        data: {
          order: createdOrders[0],
          orders: createdOrders,
          razorpayOrderId: firstRzp?.razorpayOrderId,
          razorpayKeyId: firstRzp?.keyId,
        },
      });
    }

    // Multi-order cart checkout — redirect to orders page
    return NextResponse.json({
      ok: true,
      data: {
        orders: createdOrders,
        count: createdOrders.length,
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
    let orders: any[] = [];
    if (user.role === 'wholesaler') {
      const snapshot = await collections.orders
        .where('buyerId', '==', user.clerkUserId)
        .get();
      orders = snapshot.docs.map(d => d.data());
    } else {
      // For farmers, find orders containing their payouts
      const snapshot = await collections.orders.get();
      orders = snapshot.docs
        .map(d => d.data())
        .filter(o =>
          o.payout?.some((p: { farmerId: string }) => p.farmerId === user.clerkUserId)
        );
    }

    // Sort descending by createdAt
    orders.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    return NextResponse.json({ ok: true, data: orders });
  } catch (error: unknown) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
