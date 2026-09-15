import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getAvailableStorages, bookStorage, getHoldVsSellAdvice } from '@/lib/services/coldStorageService';

// GET /api/storage — List available cold storages
export async function GET(request: NextRequest) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const crop = searchParams.get('crop') || undefined;
  const district = searchParams.get('district') || undefined;

  try {
    const storages = await getAvailableStorages({ crop, district });
    return NextResponse.json({ ok: true, data: storages });
  } catch (error: unknown) {
    console.error('Get storage error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch storages' },
      { status: 500 }
    );
  }
}

// POST /api/storage — Book cold storage
export async function POST(request: NextRequest) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;

  try {
    const body = await request.json();
    const { facilityId, listingId, crop, quantityKg, days } = body;

    if (!facilityId || !listingId || !crop || !quantityKg || !days) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'facilityId, listingId, crop, quantityKg, days required' },
        { status: 400 }
      );
    }

    const booking = await bookStorage({
      facilityId,
      farmerId: result.user.clerkUserId,
      listingId,
      crop,
      quantityKg: Number(quantityKg),
      days: Number(days),
    });

    return NextResponse.json({ ok: true, data: booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Booking failed';
    return NextResponse.json(
      { ok: false, error: 'BOOKING_FAILED', message },
      { status: 400 }
    );
  }
}
