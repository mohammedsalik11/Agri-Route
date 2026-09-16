import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { collections } from '@/lib/firebase-admin';
import { LogisticsJob } from '@/lib/services/logisticsService';

// GET /api/logistics/track/[orderId] — Live shipment tracking for an order
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orderId: string }> }
) {
  const authRes = await requireAnyRole();
  if (authRes.error) return authRes.error;

  const { orderId } = await props.params;

  try {
    const jobId = `job_${orderId}`;
    const jobDoc = await collections.logisticsJobs.doc(jobId).get();
    
    if (!jobDoc.exists) {
      return NextResponse.json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'No logistics shipment allocated for this order yet',
      }, { status: 404 });
    }

    const job = jobDoc.data() as LogisticsJob;
    return NextResponse.json({ ok: true, data: job });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Tracking lookup failed';
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR', message: msg }, { status: 500 });
  }
}