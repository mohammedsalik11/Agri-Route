import { NextRequest, NextResponse } from 'next/server';
import { getPriceTrend } from '@/lib/services/fairPriceEngine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get('crop');
  const days = parseInt(searchParams.get('days') || '7', 10);

  if (!crop) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_PARAM', message: 'crop is required' },
      { status: 400 }
    );
  }

  const trend = getPriceTrend(crop, days);
  return NextResponse.json({ ok: true, data: trend });
}
