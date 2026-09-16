import { NextRequest, NextResponse } from 'next/server';
import { getMandiPrice, getMSP, getMultipleMandiPrices } from '@/lib/services/fairPriceEngine';

const DEFAULT_CROPS = ['tomato', 'onion', 'potato', 'paddy', 'wheat', 'ragi', 'banana', 'maize'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get('crop');
    const cropsParam = searchParams.get('crops');
    const state = searchParams.get('state') || 'Karnataka';
    const district = searchParams.get('district') || 'Mandya';

    // Multi-crop query
    if (cropsParam || (!crop && !cropsParam)) {
      const cropList = cropsParam
        ? cropsParam.split(',').map(c => c.trim()).filter(Boolean)
        : DEFAULT_CROPS;

      const prices = await getMultipleMandiPrices(cropList, state, district);

      return NextResponse.json({
        ok: true,
        data: {
          state,
          district,
          crops: prices,
        },
      });
    }

    // Single crop query
    const mspPerKg = getMSP(crop!);
    const { price: mandi, source: dataSource } = await getMandiPrice(crop!, state, district);

    return NextResponse.json({
      ok: true,
      data: {
        crop: crop!,
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
