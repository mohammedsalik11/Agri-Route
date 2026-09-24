import { db, collections } from '../firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type MessageRole = 'farmer' | 'wholesaler' | 'driver' | 'logistics_driver' | 'storage_owner' | 'admin';

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: MessageRole;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface ConversationParticipant {
  userId: string;
  name: string;
  role: MessageRole;
  businessName?: string;
  district?: string;
  phone?: string;
}

export interface Conversation {
  conversationId: string;
  participants: string[]; // [farmerId, wholesalerId]
  participantDetails: Record<string, ConversationParticipant>;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    timestamp: string;
  };
  cropReference?: {
    crop: string;
    variety?: string;
    quantityKg?: number;
    pricePerKgPaise?: number;
    poolId?: string;
    listingId?: string;
    orderId?: string;
  };
  unreadCount?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export const messageService = {
  /**
   * Helper to create a deterministic conversation ID for 2 users, or use custom ID.
   */
  getConversationId(userA: string, userB: string, contextTag?: string): string {
    const sorted = [userA, userB].sort();
    return contextTag ? `conv_${sorted[0]}_${sorted[1]}_${contextTag}` : `conv_${sorted[0]}_${sorted[1]}`;
  },

  /**
   * Get all conversations for a user.
   */
  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    try {
      const snap = await db.collection('conversations')
        .where('participants', 'array-contains', userId)
        .get();

      const convs = snap.docs.map(doc => {
        const d = doc.data();
        return {
          conversationId: doc.id,
          participants: d.participants || [],
          participantDetails: d.participantDetails || {},
          lastMessage: d.lastMessage,
          cropReference: d.cropReference,
          unreadCount: d.unreadCount || {},
          createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt?.toDate?.()?.toISOString() || d.updatedAt || new Date().toISOString(),
        } as Conversation;
      });

      return convs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (err) {
      console.error('getConversationsForUser error:', err);
      return [];
    }
  },

  /**
   * Get all messages in a conversation.
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const snap = await db.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .limit(200)
        .get();

      return snap.docs.map(doc => {
        const d = doc.data();
        return {
          messageId: doc.id,
          conversationId,
          senderId: d.senderId,
          senderName: d.senderName,
          senderRole: d.senderRole,
          text: d.text,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || new Date().toISOString(),
          read: !!d.read,
        };
      });
    } catch (err) {
      console.error('getMessages error:', err);
      return [];
    }
  },

  /**
   * Send a message and update conversation record.
   */
  async sendMessage(params: {
    senderId: string;
    senderName: string;
    senderRole: MessageRole;
    recipientId: string;
    recipientName?: string;
    recipientRole?: MessageRole;
    text: string;
    conversationId?: string;
    cropReference?: Conversation['cropReference'];
  }): Promise<{ ok: boolean; messageId: string; conversationId: string }> {
    const {
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientName = 'Recipient',
      recipientRole = (senderRole === 'farmer' ? 'wholesaler' : 'farmer') as MessageRole,
      text,
      cropReference,
    } = params;

    const convId = params.conversationId || messageService.getConversationId(senderId, recipientId);
    const convRef = db.collection('conversations').doc(convId);
    const convDoc = await convRef.get();

    const now = new Date();
    const nowIso = now.toISOString();

    const lastMsg = {
      text,
      senderId,
      senderName,
      senderRole,
      timestamp: nowIso,
    };

    if (!convDoc.exists) {
      // Create new conversation
      await convRef.set({
        conversationId: convId,
        participants: [senderId, recipientId],
        participantDetails: {
          [senderId]: {
            userId: senderId,
            name: senderName,
            role: senderRole,
          },
          [recipientId]: {
            userId: recipientId,
            name: recipientName,
            role: recipientRole,
          },
        },
        lastMessage: lastMsg,
        cropReference: cropReference || null,
        unreadCount: {
          [recipientId]: 1,
          [senderId]: 0,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Update existing conversation
      const existingData = convDoc.data()!;
      const curUnread = existingData.unreadCount?.[recipientId] || 0;

      const updateData: any = {
        lastMessage: lastMsg,
        [`unreadCount.${recipientId}`]: curUnread + 1,
        [`participantDetails.${senderId}.name`]: senderName,
        [`participantDetails.${senderId}.role`]: senderRole,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (cropReference) {
        updateData.cropReference = cropReference;
      }

      await convRef.update(updateData);
    }

    // Add message to subcollection
    const msgRef = convRef.collection('messages').doc();
    await msgRef.set({
      messageId: msgRef.id,
      conversationId: convId,
      senderId,
      senderName,
      senderRole,
      text,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send notification to recipient
    await collections.notifications.add({
      userId: recipientId,
      type: 'NEW_CHAT_MESSAGE',
      title: `Message from ${senderName}`,
      body: text.length > 80 ? text.slice(0, 80) + '...' : text,
      createdAt: Timestamp.now(),
      read: false,
    }).catch(() => {});

    return { ok: true, messageId: msgRef.id, conversationId: convId };
  },

  /**
   * Mark messages in conversation as read for a user.
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const convRef = db.collection('conversations').doc(conversationId);
      await convRef.update({
        [`unreadCount.${userId}`]: 0,
      });
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  },
};
