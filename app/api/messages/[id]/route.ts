import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { messageService } from '@/lib/services/messageService';

// GET /api/messages/[id] — Get messages for a specific conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAnyRole();
  if (result.error) return result.error;
  const user = result.user;

  const { id: conversationId } = await params;

  try {
    const messages = await messageService.getMessages(conversationId);
    await messageService.markAsRead(conversationId, user.clerkUserId);

    return NextResponse.json({
      ok: true,
      data: {
        messages,
      },
    });
  } catch (error: any) {
    console.error('GET /api/messages/[id] error:', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}

// PATCH /api/messages/[id] — Mark conversation as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAnyRole();
  if (result.error) return result.error;
  const user = result.user;

  const { id: conversationId } = await params;

  try {
    await messageService.markAsRead(conversationId, user.clerkUserId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('PATCH /api/messages/[id] error:', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
