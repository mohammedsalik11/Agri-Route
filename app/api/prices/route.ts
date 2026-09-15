import { NextRequest, NextResponse } from 'next/server';
import { checkFairPrice, getMandiPrice, getMSP } from '@/lib/services/fairPriceEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get('crop');
    const state = searchParams.get('state') || 'Karnataka';
    const district = searchParams.get('district') || 'Mandya';

    if (!crop) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_PARAM', message: 'crop is required' },
        { status: 400 }
      );
    }

    const mspPerKg = getMSP(crop);
    const { price: mandi, source: dataSource } = await getMandiPrice(crop, state, district);

    return NextResponse.json({
      ok: true,
      data: {
        crop,
        state,
        district,
        mspPerKg,
        mandiMinPerKg: mandi.minPrice,
        mandiModalPerKg: mandi.modalPrice,
        mandiMaxPerKg: mandi.maxPrice,
        mandiDate: mandi.date,
        mandiMarket: mandi.market,
        dataSource,
      },
    });
  } catch (error: unknown) {
    console.error('Price fetch error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
