import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import {
  getAvailableStorages,
  bookStorage,
  getHoldVsSellAdvice,
  getFarmerBookings,
} from '@/lib/services/coldStorageService';

// GET /api/storage - List cold storages with optional crop/district filters, or get farmer bookings
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAnyRole();
    if (authResult.error) return authResult.error;
    const profile = authResult.user;

    const { searchParams } = new URL(req.url);

    const crop = searchParams.get('crop') || undefined;
    const district = searchParams.get('district') || undefined;
    const onlyVerified = searchParams.get('verified') === 'true';
    const mode = searchParams.get('mode');

    // Return current user's bookings if mode=bookings
    if (mode === 'bookings') {
      const bookings = await getFarmerBookings(profile.clerkUserId);
      return NextResponse.json({ success: true, bookings });
    }

    // Return hold vs sell advice if mode=advice
    if (mode === 'advice') {
      const adviceCrop = searchParams.get('crop') || 'tomato';
      const adviceDistrict = searchParams.get('district') || 'Mandya';
      const quantityKg = Number(searchParams.get('quantityKg')) || 1000;
      const currentAskPricePerKg = Number(searchParams.get('askPricePerKg')) || 2200;
      const storagePricePerKgPerDay = Number(searchParams.get('storagePricePerKgPerDay')) || 15;

      const advice = getHoldVsSellAdvice({
        crop: adviceCrop,
        district: adviceDistrict,
        quantityKg,
        currentAskPricePerKg,
        storagePricePerKgPerDay,
      });

      return NextResponse.json({ success: true, advice });
    }

    const storages = await getAvailableStorages({ crop, district, onlyVerified });
    return NextResponse.json({ success: true, storages });
  } catch (error: any) {
    console.error('GET /api/storage error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch storages' }, { status: 500 });
  }
}

// POST /api/storage - Book cold storage
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAnyRole();
    if (authResult.error) return authResult.error;
    const profile = authResult.user;

    const body = await req.json();

    const {
      facilityId,
      crop,
      quantityKg,
      days,
      listingId,
      pickupAddress,
      requestLogistics,
    } = body;

    if (!facilityId || !crop || !quantityKg || !days) {
      return NextResponse.json(
        { error: 'Missing required fields: facilityId, crop, quantityKg, days' },
        { status: 400 }
      );
    }

    if (quantityKg <= 0 || days <= 0) {
      return NextResponse.json(
        { error: 'quantityKg and days must be greater than 0' },
        { status: 400 }
      );
    }

    const booking = await bookStorage({
      facilityId,
      userId: profile.clerkUserId,
      farmerId: profile.role === 'farmer' ? profile.clerkUserId : undefined,
      userRole: profile.role === 'wholesaler' ? 'wholesaler' : 'farmer',
      userName: profile.name,
      userPhone: profile.phone,
      listingId,
      crop,
      quantityKg: Number(quantityKg),
      days: Number(days),
      pickupAddress,
      requestLogistics: Boolean(requestLogistics),
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/storage error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to book storage' }, { status: 400 });
  }
}
