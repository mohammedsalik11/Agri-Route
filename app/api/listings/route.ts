import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAnyRole } from '@/lib/auth';
import { collections } from '@/lib/firebase-admin';
import { checkFairPrice } from '@/lib/services/fairPriceEngine';
import { attachToPool } from '@/lib/services/poolingService';
import { sendNotification } from '@/lib/services/notificationService';

// POST /api/listings — Create a new listing (farmer only)
export async function POST(request: NextRequest) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;
  const user = result.user;

  try {
    const body = await request.json();
    const {
      crop,
      variety,
      quantityKg,
      askPricePerKg, // paise
      qualityGrade,
      photoUrl,
      harvestDate,
      availableUntil,
      lat,
      lng,
    } = body;

    if (!crop || !quantityKg || !askPricePerKg) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_FIELDS', message: 'crop, quantityKg, askPricePerKg required' },
        { status: 400 }
      );
    }

    // Run fair price check
    const priceCheck = await checkFairPrice({
      crop,
      state: user.state,
      district: user.district,
      quantityKg,
      askPricePerKg,
      qualityGrade: qualityGrade || 'B',
    });

    const listingId = `lst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const listing = {
      listingId,
      farmerId: user.clerkUserId,
      farmerName: user.name,
      crop: crop.toLowerCase(),
      variety: variety || null,
      quantityKg: Number(quantityKg),
      askPricePerKg: Number(askPricePerKg),
      qualityGrade: qualityGrade || 'B',
      gradeSource: body.gradeSource || 'self-declared',
      photoUrl: photoUrl || '',
      harvestDate: harvestDate || new Date().toISOString().slice(0, 10),
      availableUntil: availableUntil || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      district: user.district,
      state: user.state,
      lat: lat || 12.52,
      lng: lng || 76.89,
      priceCheck: {
        mspPerKg: priceCheck.mspPerKg,
        mandiModalPerKg: priceCheck.mandiModalPerKg,
        mandiMinPerKg: priceCheck.mandiMinPerKg,
        mandiMaxPerKg: priceCheck.mandiMaxPerKg,
        verdict: priceCheck.verdict,
        dataSource: priceCheck.dataSource,
        checkedAt: priceCheck.checkedAt,
      },
      poolId: null,
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    await collections.listings.doc(listingId).set(listing);

    // Try to attach to a pool
    const poolResult = await attachToPool({
      listingId,
      crop: crop.toLowerCase(),
      qualityGrade: qualityGrade || 'B',
      district: user.district,
      state: user.state,
      quantityKg: Number(quantityKg),
      askPricePerKg: Number(askPricePerKg),
      lat: lat || 12.52,
      lng: lng || 76.89,
      availableUntil: availableUntil || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });

    // Send notification
    await sendNotification({
      toUserId: user.clerkUserId,
      toPhone: user.phone,
      language: user.language,
      event: 'LISTING_CREATED',
      data: {
        crop,
        quantity: String(quantityKg),
        price: String((askPricePerKg / 100).toFixed(2)),
        verdict: priceCheck.verdict,
      },
    }).catch(() => {}); // Don't fail on notification error

    // Reload listing to get updated pool status
    const updatedDoc = await collections.listings.doc(listingId).get();

    return NextResponse.json({
      ok: true,
      data: {
        listing: updatedDoc.data(),
        priceCheck,
        pool: poolResult.pool,
      },
    });
  } catch (error: unknown) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

// GET /api/listings — Browse listings (wholesaler) or get farmer's own
export async function GET(request: NextRequest) {
  const result = await requireAnyRole();
  if (result.error) return result.error;
  const user = result.user;

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get('mine') === 'true';

  try {
    if (mine || user.role === 'farmer') {
      // Farmer's own listings
      const snapshot = await collections.listings
        .where('farmerId', '==', user.clerkUserId)
        .get();

      const myListings = snapshot.docs
        .map(d => d.data())
        .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

      return NextResponse.json({
        ok: true,
        data: myListings,
      });
    }

    // Wholesaler browsing
    const crop = searchParams.get('crop');
    const district = searchParams.get('district');
    const grade = searchParams.get('grade');
    const maxPrice = searchParams.get('maxPrice');

    const snapshot = await collections.listings
      .where('status', '==', 'available')
      .get();

    let listings = snapshot.docs
      .map(d => d.data())
      .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    if (crop) listings = listings.filter((l: any) => l.crop === crop.toLowerCase());
    if (district) listings = listings.filter((l: any) => l.district?.toLowerCase() === district.toLowerCase());
    if (grade) listings = listings.filter((l: any) => l.qualityGrade === grade);
    if (maxPrice) listings = listings.filter((l: any) => l.askPricePerKg <= Number(maxPrice));

    return NextResponse.json({ ok: true, data: listings });
  } catch (error: unknown) {
    console.error('List listings error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
