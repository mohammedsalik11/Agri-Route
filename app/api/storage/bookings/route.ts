import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import {
  getOwnerBookings,
  getFarmerBookings,
  updateBookingStatus,
} from '@/lib/services/coldStorageService';

// GET /api/storage/bookings - Fetch bookings based on user role
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAnyRole();
    if (authResult.error) return authResult.error;
    const profile = authResult.user;

    if (profile.role === 'storage_owner') {
      const bookings = await getOwnerBookings(profile.clerkUserId);
      return NextResponse.json({ success: true, bookings });
    } else {
      const bookings = await getFarmerBookings(profile.clerkUserId);
      return NextResponse.json({ success: true, bookings });
    }
  } catch (error: any) {
    console.error('GET /api/storage/bookings error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}

// PATCH /api/storage/bookings - Update booking status
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAnyRole();
    if (authResult.error) return authResult.error;

    const body = await req.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'bookingId and status are required' }, { status: 400 });
    }

    if (!['confirmed', 'active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await updateBookingStatus(bookingId, status);
    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    console.error('PATCH /api/storage/bookings error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update booking' }, { status: 400 });
  }
}
