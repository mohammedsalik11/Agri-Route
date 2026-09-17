import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { messageService } from '@/lib/services/messageService';
import { collections } from '@/lib/firebase-admin';

// GET /api/messages — Get all conversations for current user
export async function GET(req: NextRequest) {
  const result = await requireAnyRole();
  if (result.error) return result.error;
  const user = result.user;

  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    const conversations = await messageService.getConversationsForUser(user.clerkUserId);

    // If targetUserId requested, check if a conversation already exists with them
    let targetConv = null;
    if (targetUserId) {
      targetConv = conversations.find(c => c.participants.includes(targetUserId));
    }

    return NextResponse.json({
      ok: true,
      data: {
        conversations,
        targetConv,
      },
    });
  } catch (error: any) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}

// POST /api/messages — Send a new message
export async function POST(req: NextRequest) {
  const result = await requireAnyRole();
  if (result.error) return result.error;
  const user = result.user;

  try {
    const body = await req.json();
    const {
      recipientId,
      recipientName,
      recipientRole,
      text,
      conversationId,
      cropReference,
    } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ ok: false, message: 'Message text is required' }, { status: 400 });
    }

    if (!recipientId && !conversationId) {
      return NextResponse.json({ ok: false, message: 'Recipient ID or Conversation ID required' }, { status: 400 });
    }

    let targetRecipientId = recipientId;
    let targetRecipientName = recipientName;
    let targetRecipientRole = recipientRole;

    // If conversationId provided without recipientId, deduce recipient from conversation participants
    if (conversationId && !targetRecipientId) {
      const convSnap = await collections.users.firestore.collection('conversations').doc(conversationId).get();
      if (convSnap.exists) {
        const convData = convSnap.data()!;
        const otherId = (convData.participants || []).find((id: string) => id !== user.clerkUserId);
        if (otherId) {
          targetRecipientId = otherId;
          const otherDetails = convData.participantDetails?.[otherId];
          targetRecipientName = otherDetails?.name || 'User';
          targetRecipientRole = otherDetails?.role;
        }
      }
    }

    if (!targetRecipientId) {
      return NextResponse.json({ ok: false, message: 'Could not determine recipient' }, { status: 400 });
    }

    const senderName = user.name || user.businessName || (user.role === 'farmer' ? 'Farmer' : 'Wholesaler');

    const res = await messageService.sendMessage({
      senderId: user.clerkUserId,
      senderName,
      senderRole: user.role as 'farmer' | 'wholesaler' | 'driver' | 'admin',
      recipientId: targetRecipientId,
      recipientName: targetRecipientName,
      recipientRole: targetRecipientRole,
      text: text.trim(),
      conversationId,
      cropReference,
    });

    return NextResponse.json({ ok: true, data: res });
  } catch (error: any) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
