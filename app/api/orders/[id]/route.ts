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

        // Mock payments mode
        const mockPayments = process.env.MOCK_PAYMENTS === 'true';
        const order = await confirmPayment(
          orderId,
          razorpay_order_id || 'mock',
          razorpay_payment_id || 'mock',
          mockPayments ? 'mock' : razorpay_signature
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

// GET /api/orders/[id] — Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAnyRole();
  if (result.error) return result.error;

  const { id: orderId } = await params;

  try {
    const orderDoc = await collections.orders.doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Order not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: orderDoc.data() });
  } catch (error: unknown) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
