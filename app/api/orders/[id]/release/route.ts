import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { confirmDelivery } from '@/lib/services/escrowService';
import { markPoolSold } from '@/lib/services/poolingService';

// POST /api/orders/[id]/release — Release escrow funds upon OTP verification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAnyRole();
  if (result.error) return result.error;

  const { id: orderId } = await params;

  try {
    const body = await request.json();
    const { otp } = body as { otp?: string };

    if (!otp) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_OTP', message: 'Handover OTP is required to release escrow funds.' },
        { status: 400 }
      );
    }

    const order = await confirmDelivery(orderId, otp);

    // If it was a pool order, mark the pool sold
    if (order.source.type === 'pool') {
      try {
        await markPoolSold(order.source.id);
      } catch (poolErr) {
        console.warn('Error marking pool sold:', poolErr);
      }
    }

    return NextResponse.json({ ok: true, data: order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Release failed';
    console.error(`Order release error for ${orderId}:`, error);
    return NextResponse.json(
      { ok: false, error: 'RELEASE_FAILED', message },
      { status: 400 }
    );
  }
}
