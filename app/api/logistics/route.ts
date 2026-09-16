import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole, requireRole } from '@/lib/auth';
import {
  getAvailableJobs,
  getDriverTrips,
  assignDriverTrip,
  getJobById,
} from '@/lib/services/logisticsService';

// GET /api/logistics — List available jobs or driver trips
export async function GET(request: NextRequest) {
  const authRes = await requireAnyRole();
  if (authRes.error) return authRes.error;
  const user = authRes.user;

  try {
    const { searchParams } = new URL(request.url);
    const myTrips = searchParams.get('my_trips') === 'true';
    const district = searchParams.get('district') || user.district;

    if (myTrips) {
      if (user.role !== 'logistics_driver') {
        return NextResponse.json(
          { ok: false, error: 'FORBIDDEN', message: 'Only logistics drivers have personal trip records' },
          { status: 403 }
        );
      }
      const trips = await getDriverTrips(user.clerkUserId);
      return NextResponse.json({ ok: true, data: trips });
    }

    const jobs = await getAvailableJobs(district);
    return NextResponse.json({ ok: true, data: jobs });
  } catch (error: unknown) {
    console.error('Logistics GET error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch logistics data';
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR', message: msg }, { status: 500 });
  }
}

// POST /api/logistics — Driver accepts a job / allocates trip(s)
export async function POST(request: NextRequest) {
  const authRes = await requireRole('logistics_driver');
  if (authRes.error) return authRes.error;
  const user = authRes.user;

  try {
    const body = await request.json();
    const { jobId, requestedTripsCount = 1 } = body;

    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'jobId is required' },
        { status: 400 }
      );
    }

    const result = await assignDriverTrip({
      jobId,
      driver: user,
      requestedTripsCount: Number(requestedTripsCount) || 1,
    });

    return NextResponse.json({
      ok: true,
      data: result,
      message: `Successfully accepted trip(s) for ${result.job.crop}`,
    });
  } catch (error: unknown) {
    console.error('Logistics POST error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to assign logistics trip';
    return NextResponse.json({ ok: false, error: 'ASSIGNMENT_FAILED', message: msg }, { status: 400 });
  }
}