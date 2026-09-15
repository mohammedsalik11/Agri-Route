import { collections } from '../firebase-admin';
import { calculatePayoutSplit } from './poolingService';
import crypto from 'crypto';

// ---------- Types ----------
export type EscrowStatus =
  | 'CREATED'
  | 'PAYMENT_HELD'
  | 'AWAITING_PICKUP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUNDED';

export interface Order {
  orderId: string;
  buyerId: string;
  buyerName: string;
  source: { type: 'listing' | 'pool'; id: string };
  crop: string;
  quantityKg: number;
  pricePerKg: number;        // paise
  subtotal: number;           // paise
  platformFee: number;        // paise
  logisticsFee: number;       // paise
  total: number;              // paise
  payout: Array<{ farmerId: string; farmerName: string; quantityKg: number; amount: number }>;
  escrow: {
    status: EscrowStatus;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    handoverOtp?: string;
    heldAt?: string;
    releasedAt?: string;
    simulated: true;
  };
  timeline: Array<{ status: string; at: string; note?: string }>;
  createdAt: string;
}

// ---------- Constants ----------
const PLATFORM_FEE_RATE = 0.03; // 3%
const LOGISTICS_FEE_RATE = 0.05; // 5% (simulated)

// Valid state transitions
const VALID_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  CREATED: ['PAYMENT_HELD'],
  PAYMENT_HELD: ['AWAITING_PICKUP'],
  AWAITING_PICKUP: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['RELEASED'],
  RELEASED: [],
  DISPUTED: ['RELEASED', 'REFUNDED'],
  REFUNDED: [],
};

function assertTransition(from: EscrowStatus, to: EscrowStatus): void {
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    throw new Error(`Invalid escrow transition: ${from} → ${to}`);
  }
}

// ---------- Order Creation ----------
export async function createOrder(input: {
  buyerId: string;
  buyerName: string;
  sourceType: 'listing' | 'pool';
  sourceId: string;
  crop: string;
  quantityKg: number;
  pricePerKg: number; // paise
  farmerPayouts: Array<{ farmerId: string; farmerName: string; quantityKg: number }>;
}): Promise<Order> {
  const subtotal = input.pricePerKg * input.quantityKg;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const logisticsFee = Math.round(subtotal * LOGISTICS_FEE_RATE);
  const total = subtotal + platformFee + logisticsFee;

  const payoutAmount = subtotal; // Farmers get full subtotal, fees come from buyer
  const payout = calculatePayoutSplit(input.farmerPayouts, payoutAmount);

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const order: Order = {
    orderId,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    source: { type: input.sourceType, id: input.sourceId },
    crop: input.crop,
    quantityKg: input.quantityKg,
    pricePerKg: input.pricePerKg,
    subtotal,
    platformFee,
    logisticsFee,
    total,
    payout,
    escrow: {
      status: 'CREATED',
      simulated: true,
    },
    timeline: [{ status: 'CREATED', at: now, note: 'Order placed' }],
    createdAt: now,
  };

  await collections.orders.doc(orderId).set(order);
  return order;
}

// ---------- Razorpay Integration ----------
export async function createRazorpayOrder(orderId: string, amountPaise: number): Promise<{
  razorpayOrderId: string;
  keyId: string;
}> {
  const mockPayments = process.env.MOCK_PAYMENTS === 'true';

  if (mockPayments) {
    const mockRzpOrderId = `order_mock_${Date.now()}`;
    await collections.orders.doc(orderId).update({
      'escrow.razorpayOrderId': mockRzpOrderId,
    });
    return { razorpayOrderId: mockRzpOrderId, keyId: 'rzp_test_mock' };
  }

  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: orderId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Razorpay order creation failed: ${res.status}`);
  }

  const data = await res.json();

  await collections.orders.doc(orderId).update({
    'escrow.razorpayOrderId': data.id,
  });

  return { razorpayOrderId: data.id, keyId };
}

// ---------- Payment Confirmation ----------
export async function confirmPayment(
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<Order> {
  const mockPayments = process.env.MOCK_PAYMENTS === 'true';

  if (!mockPayments) {
    // Verify HMAC-SHA256 signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new Error('Invalid payment signature');
    }
  }

  const orderDoc = await collections.orders.doc(orderId).get();
  if (!orderDoc.exists) throw new Error('Order not found');
  const order = orderDoc.data() as Order;

  assertTransition(order.escrow.status, 'PAYMENT_HELD');

  const now = new Date().toISOString();
  await collections.orders.doc(orderId).update({
    'escrow.status': 'PAYMENT_HELD',
    'escrow.razorpayPaymentId': razorpayPaymentId,
    'escrow.heldAt': now,
    timeline: [...order.timeline, { status: 'PAYMENT_HELD', at: now, note: 'Payment received and held in escrow' }],
  });

  return { ...order, escrow: { ...order.escrow, status: 'PAYMENT_HELD', heldAt: now } };
}

// ---------- Escrow State Transitions ----------
export async function generateHandoverOtp(orderId: string): Promise<string> {
  const orderDoc = await collections.orders.doc(orderId).get();
  if (!orderDoc.exists) throw new Error('Order not found');
  const order = orderDoc.data() as Order;

  assertTransition(order.escrow.status, 'AWAITING_PICKUP');

  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  const now = new Date().toISOString();

  await collections.orders.doc(orderId).update({
    'escrow.status': 'AWAITING_PICKUP',
    'escrow.handoverOtp': otp,
    timeline: [...order.timeline, { status: 'AWAITING_PICKUP', at: now, note: 'OTP generated for handover' }],
  });

  return otp;
}

export async function markInTransit(orderId: string): Promise<void> {
  const orderDoc = await collections.orders.doc(orderId).get();
  if (!orderDoc.exists) throw new Error('Order not found');
  const order = orderDoc.data() as Order;

  assertTransition(order.escrow.status, 'IN_TRANSIT');

  const now = new Date().toISOString();
  await collections.orders.doc(orderId).update({
    'escrow.status': 'IN_TRANSIT',
    timeline: [...order.timeline, { status: 'IN_TRANSIT', at: now, note: 'Produce handed over, in transit' }],
  });
}

export async function confirmDelivery(orderId: string, otp: string): Promise<Order> {
  const orderDoc = await collections.orders.doc(orderId).get();
  if (!orderDoc.exists) throw new Error('Order not found');
  const order = orderDoc.data() as Order;

  // Accept from both IN_TRANSIT and AWAITING_PICKUP for demo flexibility
  if (order.escrow.status !== 'IN_TRANSIT' && order.escrow.status !== 'AWAITING_PICKUP') {
    throw new Error(`Cannot confirm delivery from status: ${order.escrow.status}`);
  }

  if (order.escrow.handoverOtp !== otp) {
    throw new Error('Invalid OTP');
  }

  const now = new Date().toISOString();
  const timeline = [
    ...order.timeline,
    { status: 'DELIVERED', at: now, note: 'Delivery confirmed with OTP' },
    { status: 'RELEASED', at: now, note: 'Payment released to farmers (simulated)' },
  ];

  await collections.orders.doc(orderId).update({
    'escrow.status': 'RELEASED',
    'escrow.releasedAt': now,
    timeline,
  });

  return {
    ...order,
    escrow: { ...order.escrow, status: 'RELEASED', releasedAt: now },
    timeline,
  };
}

export async function raiseDispute(orderId: string, reason: string): Promise<void> {
  const orderDoc = await collections.orders.doc(orderId).get();
  if (!orderDoc.exists) throw new Error('Order not found');
  const order = orderDoc.data() as Order;

  assertTransition(order.escrow.status, 'DISPUTED');

  const now = new Date().toISOString();
  await collections.orders.doc(orderId).update({
    'escrow.status': 'DISPUTED',
    timeline: [...order.timeline, { status: 'DISPUTED', at: now, note: reason }],
  });
}
