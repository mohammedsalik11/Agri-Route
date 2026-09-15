import { collections } from '../firebase-admin';

/**
 * Notification service — writes to a simulated SMS/WhatsApp outbox.
 * In production, this would integrate with an SMS gateway (DLT registered).
 * For the prototype, all messages are written to Firestore and displayed
 * in the /demo panel.
 */

export interface Notification {
  id: string;
  toUserId: string;
  toPhone: string;
  channel: 'sms' | 'whatsapp';
  language: 'en' | 'hi' | 'kn';
  body: string;
  event: string;
  simulated: true;
  createdAt: string;
}

type NotificationEvent =
  | 'LISTING_CREATED'
  | 'POOL_JOINED'
  | 'POOL_READY'
  | 'ORDER_PLACED'
  | 'PAYMENT_HELD'
  | 'OTP_GENERATED'
  | 'DELIVERY_CONFIRMED'
  | 'PAYOUT_RELEASED'
  | 'STORAGE_BOOKED'
  | 'PRICE_ALERT';

// Message templates per event (English — translated versions use i18n keys in production)
const TEMPLATES: Record<NotificationEvent, (data: Record<string, string>) => string> = {
  LISTING_CREATED: (d) =>
    `Your ${d.crop} listing (${d.quantity} kg at ₹${d.price}/kg) is live on Agri Route. Fair price verdict: ${d.verdict}.`,
  POOL_JOINED: (d) =>
    `Your ${d.crop} has been added to a pooled lot. ${d.current}/${d.target} kg collected from ${d.farmers} farmers.`,
  POOL_READY: (d) =>
    `Great news! The ${d.crop} pool in ${d.district} is full at ${d.total} kg. Buyers can now purchase the lot.`,
  ORDER_PLACED: (d) =>
    `Order #${d.orderId} placed for ${d.quantity} kg ${d.crop} at ₹${d.price}/kg. Total: ₹${d.total}.`,
  PAYMENT_HELD: (d) =>
    `Payment of ₹${d.amount} held in escrow for order #${d.orderId}. Prepare your produce for pickup.`,
  OTP_GENERATED: (d) =>
    `Your handover OTP for order #${d.orderId} is ${d.otp}. Share this with the buyer only upon physical handover.`,
  DELIVERY_CONFIRMED: (d) =>
    `Delivery confirmed for order #${d.orderId}. ₹${d.amount} will be released to your account.`,
  PAYOUT_RELEASED: (d) =>
    `₹${d.amount} released to your account for order #${d.orderId}. UTR: ${d.utr}. Thank you for using Agri Route!`,
  STORAGE_BOOKED: (d) =>
    `Cold storage booked: ${d.quantity} kg ${d.crop} at ${d.facility} for ${d.days} days. Cost: ₹${d.cost}.`,
  PRICE_ALERT: (d) =>
    `${d.crop} price in ${d.district}: ₹${d.price}/kg (${d.direction} ${d.change}% from yesterday).`,
};

/**
 * Send a notification (simulated — writes to Firestore outbox).
 */
export async function sendNotification(input: {
  toUserId: string;
  toPhone: string;
  channel?: 'sms' | 'whatsapp';
  language?: 'en' | 'hi' | 'kn';
  event: NotificationEvent;
  data: Record<string, string>;
}): Promise<Notification> {
  const template = TEMPLATES[input.event];
  if (!template) throw new Error(`Unknown event: ${input.event}`);

  const body = template(input.data);
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const notification: Notification = {
    id,
    toUserId: input.toUserId,
    toPhone: input.toPhone,
    channel: input.channel || 'sms',
    language: input.language || 'en',
    body,
    event: input.event,
    simulated: true,
    createdAt: new Date().toISOString(),
  };

  await collections.notifications.doc(id).set(notification);
  return notification;
}

/**
 * Get all notifications (for /demo outbox panel).
 */
export async function getNotifications(limit: number = 50): Promise<Notification[]> {
  const snapshot = await collections.notifications
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map(d => d.data() as Notification);
}
