import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { collections } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/verification — farmer gets their own bookings
export async function GET(request: NextRequest) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;
  const user = result.user;

  try {
    const snap = await collections.verificationBookings
      .where('farmerId', '==', user.clerkUserId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const bookings = snap.docs.map((d) => ({ bookingId: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, data: bookings });
  } catch (error) {
    console.error('Get verification bookings error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/verification — farmer books a crop verification visit
export async function POST(request: NextRequest) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;
  const user = result.user;

  try {
    const body = await request.json();
    const { listingId, preferredDate, preferredTimeSlot, notes } = body;

    if (!preferredDate) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_DATE', message: 'preferredDate is required' },
        { status: 400 }
      );
    }

    // Validate preferred date is in future
    const dateObj = new Date(preferredDate);
    if (isNaN(dateObj.getTime()) || dateObj < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_DATE', message: 'preferredDate must be a future date' },
        { status: 400 }
      );
    }

    // If listingId provided, verify it belongs to this farmer
    let listingInfo: { crop?: string; qualityGrade?: string; quantityKg?: number } = {};
    if (listingId) {
      const listingDoc = await collections.listings.doc(listingId).get();
      if (!listingDoc.exists) {
        return NextResponse.json({ ok: false, error: 'LISTING_NOT_FOUND' }, { status: 404 });
      }
      const listingData = listingDoc.data()!;
      if (listingData.farmerId !== user.clerkUserId) {
        return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 403 });
      }
      listingInfo = {
        crop: listingData.crop,
        qualityGrade: listingData.qualityGrade,
        quantityKg: listingData.quantityKg,
      };
    }

    const TIME_SLOTS = ['09:00–11:00', '11:00–13:00', '14:00–16:00', '16:00–18:00'];
    const slot = TIME_SLOTS.includes(preferredTimeSlot) ? preferredTimeSlot : TIME_SLOTS[0];

    const booking = {
      farmerId: user.clerkUserId,
      farmerName: user.name,
      farmerDistrict: user.district || '',
      listingId: listingId || null,
      ...listingInfo,
      preferredDate,
      preferredTimeSlot: slot,
      notes: notes?.trim().slice(0, 500) || '',
      status: 'pending',           // pending → confirmed → completed | cancelled
      assignedInspector: null,
      confirmedDate: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const ref = await collections.verificationBookings.add(booking);

    // Notify farmer
    await collections.notifications.add({
      userId: user.clerkUserId,
      type: 'verification_booked',
      title: 'Verification Booked',
      body: `Your crop verification request for ${preferredDate} (${slot}) has been received. We'll confirm within 24 hours.`,
      createdAt: Timestamp.now(),
      read: false,
    });

    return NextResponse.json({
      ok: true,
      data: { bookingId: ref.id, ...booking },
    });
  } catch (error) {
    console.error('Create verification booking error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
