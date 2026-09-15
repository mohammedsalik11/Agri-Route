import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { collections } from '@/lib/firebase-admin';

export async function GET() {
  const result = await requireRole('farmer');
  if (result.error) return result.error;
  const user = result.user;

  try {
    // Get all completed orders where this farmer has payouts
    const snapshot = await collections.orders
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const myOrders = snapshot.docs
      .map(d => d.data())
      .filter(o =>
        o.payout?.some((p: { farmerId: string }) => p.farmerId === user.clerkUserId)
      );

    let totalEarned = 0;
    let totalExtraVsFloor = 0;

    const orderDetails = myOrders.map(order => {
      const myPayout = order.payout.find(
        (p: { farmerId: string }) => p.farmerId === user.clerkUserId
      );
      const amount = myPayout?.amount || 0;
      totalEarned += amount;

      // Calculate earnings vs floor
      const listing = order; // priceCheck is on the listing, not order — approximate
      const floorPrice = 0; // Would need listing lookup for precision

      return {
        orderId: order.orderId,
        crop: order.crop,
        quantityKg: myPayout?.quantityKg || 0,
        earned: amount,
        escrowStatus: order.escrow?.status,
        date: order.createdAt,
      };
    });

    // Rupee split (for the last/any completed order)
    const lastCompleted = myOrders.find(o => o.escrow?.status === 'RELEASED');
    let rupeeSplit = null;
    if (lastCompleted) {
      const farmerShare = Math.round((lastCompleted.subtotal / lastCompleted.total) * 100);
      const logisticsShare = Math.round((lastCompleted.logisticsFee / lastCompleted.total) * 100);
      const platformShare = 100 - farmerShare - logisticsShare;
      rupeeSplit = {
        farmerPercent: farmerShare,
        logisticsPercent: logisticsShare,
        platformPercent: platformShare,
        orderId: lastCompleted.orderId,
      };
    }

    return NextResponse.json({
      ok: true,
      data: {
        totalEarned,
        totalExtraVsFloor,
        orders: orderDetails,
        rupeeSplit,
      },
    });
  } catch (error: unknown) {
    console.error('Earnings error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
