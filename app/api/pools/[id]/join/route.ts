import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { joinPool } from '@/lib/services/poolingService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;

  const { id: poolId } = await params;
  const body = await request.json();
  const { listingId } = body;

  if (!listingId) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_FIELDS', message: 'listingId required' },
      { status: 400 }
    );
  }

  try {
    const pool = await joinPool(poolId, listingId);
    return NextResponse.json({ ok: true, data: pool });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join pool';
    return NextResponse.json(
      { ok: false, error: 'JOIN_FAILED', message },
      { status: 400 }
    );
  }
}
