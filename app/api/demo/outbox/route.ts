import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/services/notificationService';

export async function GET() {
  try {
    const notifications = await getNotifications(50);
    return NextResponse.json({ ok: true, data: notifications });
  } catch (error: unknown) {
    console.error('Outbox error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch outbox' },
      { status: 500 }
    );
  }
}
