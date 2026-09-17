import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { confirmPayment, generateHandoverOtp, confirmDelivery, raiseDispute } from '@/lib/services/escrowService';
import { markPoolSold } from '@/lib/services/poolingService';
import { collections } from '@/lib/firebase-admin';

// POST /api/orders/[id]/confirm-payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAnyRole();
  if (result.error) return result.error;

  const { id: orderId } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const body = await request.json();

  try {
    switch (action) {
      case 'confirm-payment': {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

        if (!razorpay_order_id || !razorpay_payment_id) {
          return NextResponse.json(
            { ok: false, error: 'MISSING_PAYMENT_FIELDS', message: 'razorpay_order_id and razorpay_payment_id required' },
            { status: 400 }
          );
        }

        const mockPayments = process.env.MOCK_PAYMENTS === 'true';
        const order = await confirmPayment(
          orderId,
          razorpay_order_id,
          razorpay_payment_id,
          mockPayments ? 'mock' : (razorpay_signature || 'mock')
        );
        return NextResponse.json({ ok: true, data: order });
      }

      case 'generate-otp': {
        const otp = await generateHandoverOtp(orderId);
        return NextResponse.json({ ok: true, data: { otp } });
      }

      case 'confirm-delivery': {
        const { otp } = body;
        if (!otp) {
          return NextResponse.json(
            { ok: false, error: 'MISSING_OTP', message: 'OTP is required' },
            { status: 400 }
          );
        }
        const order = await confirmDelivery(orderId, otp);

        // Mark pool as sold if it was a pool order
        if (order.source.type === 'pool') {
          await markPoolSold(order.source.id);
        }

        return NextResponse.json({ ok: true, data: order });
      }

      case 'dispute': {
        const { reason } = body;
        await raiseDispute(orderId, reason || 'Issue raised by buyer');
        return NextResponse.json({ ok: true, data: { status: 'DISPUTED' } });
      }

      default:
        return NextResponse.json(
          { ok: false, error: 'INVALID_ACTION', message: 'Use ?action=confirm-payment|generate-otp|confirm-delivery|dispute' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Action failed';
    console.error(`Order action ${action} error:`, error);
    return NextResponse.json(
      { ok: false, error: 'ACTION_FAILED', message },
      { status: 400 }
    );
  }
}

// GET /api/orders/[id] — Get single order with Razorpay details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAnyRole();
  if (result.error) return result.error;

  const { id: rawOrderId } = await params;

  try {
    const candidateIds = Array.from(new Set([rawOrderId, decodeURIComponent(rawOrderId || '')]));
    let orderDoc = null;
    for (const cid of candidateIds) {
      const doc = await collections.orders.doc(cid).get();
      if (doc.exists) {
        orderDoc = doc;
        break;
      }
    }
    if (!orderDoc) {
      for (const cid of candidateIds) {
        const snap = await collections.orders.where('orderId', '==', cid).limit(1).get();
        if (!snap.empty) {
          orderDoc = snap.docs[0];
          break;
        }
      }
    }

    if (!orderDoc || !orderDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Order not found' },
        { status: 404 }
      );
    }
    const orderId = orderDoc.id;
    const orderData = orderDoc.data()!;

    // Ensure a valid Razorpay order ID exists if payment not completed yet
    let razorpayOrderId = orderData.escrow?.razorpayOrderId;
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_mock';

    const mockPayments = process.env.MOCK_PAYMENTS === 'true';
    if (!mockPayments && (!razorpayOrderId || razorpayOrderId.startsWith('order_mock_')) && orderData.escrow?.status === 'CREATED') {
      try {
        const { createRazorpayOrder } = await import('@/lib/services/escrowService');
        const rzp = await createRazorpayOrder(orderId, orderData.total);
        razorpayOrderId = rzp.razorpayOrderId;
        orderData.escrow = { ...orderData.escrow, razorpayOrderId };
      } catch (e) {
        console.error('Failed to create Razorpay order on GET /api/orders/[id]:', e);
      }
    }

    return NextResponse.json({
      ok: true,
      data: orderData,
      razorpayOrderId,
      razorpayKeyId: keyId,
    });
  } catch (error: unknown) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
