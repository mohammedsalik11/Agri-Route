import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole, requireRole } from '@/lib/auth';
import { getJobById, updateTripStatus } from '@/lib/services/logisticsService';

// GET /api/logistics/[id] — Fetch job details
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAnyRole();
  if (authRes.error) return authRes.error;

  const { id } = await props.params;

  try {
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ ok: false, error: 'NOT_FOUND', message: 'Logistics job not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: job });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch job';
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR', message: msg }, { status: 500 });
  }
}

// PATCH /api/logistics/[id] — Update trip status / OTP / location
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const authRes = await requireRole('logistics_driver');
  if (authRes.error) return authRes.error;
  const user = authRes.user;

  const { id } = await props.params;

  try {
    const body = await request.json();
    const { tripId, newStatus, otpInput, location } = body;

    if (!tripId || !newStatus) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'tripId and newStatus are required' },
        { status: 400 }
      );
    }

    const result = await updateTripStatus({
      jobId: id,
      tripId,
      driverId: user.clerkUserId,
      newStatus,
      otpInput,
      location,
    });

    return NextResponse.json({
      ok: true,
      data: result,
      message: `Trip status updated to ${newStatus}`,
    });
  } catch (error: unknown) {
    console.error('Trip status update error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update trip status';
    return NextResponse.json({ ok: false, error: 'UPDATE_FAILED', message: msg }, { status: 400 });
  }
}