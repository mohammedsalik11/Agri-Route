import { NextResponse, NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { negotiationService } from '@/lib/services/negotiationService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole('farmer');
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await req.json();
    const { response } = body as { response?: string };

    if (!response || !['accepted', 'declined'].includes(response)) {
      return NextResponse.json({ ok: false, message: 'Invalid response value' }, { status: 400 });
    }

    const result = await negotiationService.respondToNegotiation(
      id,
      response as 'accepted' | 'declined',
      authResult.user.clerkUserId
    );

    if (result.ok) {
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
