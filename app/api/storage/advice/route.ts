import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getHoldVsSellAdvice } from '@/lib/services/coldStorageService';
import { collections } from '@/lib/firebase-admin';
import coldStoragesData from '@/data/cold-storages.json';

export async function GET(request: NextRequest) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');

  if (!listingId) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_PARAM', message: 'listingId required' },
      { status: 400 }
    );
  }

  try {
    const listingDoc = await collections.listings.doc(listingId).get();
    if (!listingDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Listing not found' },
        { status: 404 }
      );
    }

    const listing = listingDoc.data()!;

    // Find cheapest storage for this crop in this district
    const storages = (coldStoragesData as Array<{ suitableCrops: string[]; district: string; pricePerKgPerDay: number }>).filter(
      s => s.suitableCrops.includes(listing.crop) && s.district.toLowerCase() === listing.district.toLowerCase()
    );
    const cheapestStorage = storages.sort((a, b) => a.pricePerKgPerDay - b.pricePerKgPerDay)[0];
    const storagePricePerKgPerDay = cheapestStorage?.pricePerKgPerDay || 15;

    const advice = getHoldVsSellAdvice({
      crop: listing.crop,
      district: listing.district,
      quantityKg: listing.quantityKg,
      currentAskPricePerKg: listing.askPricePerKg,
      storagePricePerKgPerDay,
    });

    return NextResponse.json({ ok: true, data: advice });
  } catch (error: unknown) {
    console.error('Hold-vs-sell advice error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to get advice' },
      { status: 500 }
    );
  }
}
