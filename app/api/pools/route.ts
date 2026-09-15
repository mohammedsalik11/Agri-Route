import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { getPools } from '@/lib/services/poolingService';

export async function GET(request: NextRequest) {
  const result = await requireAnyRole();
  if (result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district') || undefined;
  const crop = searchParams.get('crop') || undefined;
  const status = searchParams.get('status') || undefined;

  try {
    const pools = await getPools({ district, crop, status });
    return NextResponse.json({ ok: true, data: pools });
  } catch (error: unknown) {
    console.error('Get pools error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch pools' },
      { status: 500 }
    );
  }
}
