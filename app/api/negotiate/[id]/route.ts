import { NextResponse, NextRequest } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { negotiationService } from '@/lib/services/negotiationService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAnyRole();
    if (authResult.error) return authResult.error;
    const user = authResult.user;

    if (user.role !== 'farmer' && user.role !== 'wholesaler') {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN', message: 'Only farmers and wholesalers can negotiate prices' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { response, counterPricePerKgPaise, message } = body as {
      response?: 'accepted' | 'declined' | 'countered';
      counterPricePerKgPaise?: number;
      message?: string;
    };

    if (!response || !['accepted', 'declined', 'countered'].includes(response)) {
      return NextResponse.json(
        { ok: false, message: 'Invalid response value. Must be accepted, declined, or countered.' },
        { status: 400 }
      );
    }

    const result = await negotiationService.respondToNegotiation(id, {
      response,
      counterPricePerKgPaise,
      message,
      responderId: user.clerkUserId,
      responderRole: user.role,
      responderName: user.name,
    });

    if (result.ok) {
      return NextResponse.json({ ok: true, data: result.data });
    } else {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
