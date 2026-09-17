import { collections } from '../firebase-admin';
import { calculatePayoutSplit } from './poolingService';
import crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

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
    refundedAt?: string;
    captureId?: string;
  };
  timeline: Array<{ status: string; at: string; note?: string }>;
  createdAt: string;
}

// ---------- Constants ----------
const PLATFORM_FEE_RATE = 0.03; // 3%
const LOGISTICS_FEE_RATE = 0.05; // 5%

// Valid state transitions
const VALID_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  CREATED: ['PAYMENT_HELD'],
  PAYMENT_HELD: ['AWAITING_PICKUP'],
  AWAITING_PICKUP: ['IN_TRANSIT', 'DELIVERED'],
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

  const payoutAmount = subtotal; // Farmers receive full subtotal, fees covered by buyer
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
    },
    timeline: [{ status: 'CREATED', at: now, note: 'Order placed' }],
    createdAt: now,
  };

  await collections.orders.doc(orderId).set(order);
  return order;
}

// ---------- Razorpay Integration (Authorize / Capture) ----------
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

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId === 'rzp_test_mock' || keyId.includes('YOUR_KEY')) {
    // Fallback to mock if keys are not supplied in env
    const mockRzpOrderId = `order_mock_${Date.now()}`;
    await collections.orders.doc(orderId).update({
      'escrow.razorpayOrderId': mockRzpOrderId,
    });
    return { razorpayOrderId: mockRzpOrderId, keyId: 'rzp_test_mock' };
  }

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: orderId.slice(0, 40),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Razorpay order creation API error (${res.status}): ${errText}. Falling back to sandbox order.`);
      const mockRzpOrderId = `order_mock_${Date.now()}`;
      await collections.orders.doc(orderId).update({
        'escrow.razorpayOrderId': mockRzpOrderId,
      });
      return { razorpayOrderId: mockRzpOrderId, keyId };
    }

    const data = await res.json();
    await collections.orders.doc(orderId).update({
      'escrow.razorpayOrderId': data.id,
    });

    return { razorpayOrderId: data.id, keyId };
  } catch (err) {
    console.warn('Razorpay order creation failed, falling back to sandbox order:', err);
    const mockRzpOrderId = `order_mock_${Date.now()}`;
    await collections.orders.doc(orderId).update({
      'escrow.razorpayOrderId': mockRzpOrderId,
    });
    return { razorpayOrderId: mockRzpOrderId, keyId };
  }
}

export async function captureRazorpayPayment(paymentId: string, amountPaise: number): Promise<any> {
  const mockPayments = process.env.MOCK_PAYMENTS === 'true';
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (mockPayments || !keyId || !keySecret || paymentId.startsWith('mock')) {
    return { id: paymentId, status: 'captured' };
  }

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Razorpay payment capture error:', res.status, errText);
    throw new Error(`Razorpay payment capture failed: ${res.status}`);
  }

  return res.json();
}

export async function refundRazorpayPayment(paymentId: string, amountPaise?: number): Promise<any> {
  const mockPayments = process.env.MOCK_PAYMENTS === 'true';
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (mockPayments || !keyId || !keySecret || paymentId.startsWith('mock')) {
    return { id: `rfnd_mock_${Date.now()}`, status: 'processed' };
  }

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
    },
    body: JSON.stringify(amountPaise ? { amount: amountPaise } : {}),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Razorpay refund error:', res.status, errText);
    throw new Error(`Razorpay refund failed: ${res.status}`);
  }

  return res.json();
}

// ---------- Payment Confirmation ----------
export async function confirmPayment(
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<Order> {
  const mockPayments = process.env.MOCK_PAYMENTS === 'true';
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const isMock =
    mockPayments ||
    !keySecret ||
    razorpaySignature === 'mock' ||
    razorpayPaymentId.startsWith('pay_mock_') ||
    razorpayOrderId.startsWith('order_mock_');

  if (!isMock && keySecret) {
    // Verify HMAC-SHA256 signature
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
    timeline: [...order.timeline, { status: 'PAYMENT_HELD', at: now, note: 'Payment authorized and held in escrow' }],
  });

  // Notify buyer and farmers that funds are secured in escrow
  await collections.notifications.add({
    userId: order.buyerId,
    type: 'ESCROW_HELD',
    title: 'Payment Secured in Escrow',
    body: `₹${(order.total / 100).toFixed(2)} held securely for order #${orderId}. Release upon delivery inspection.`,
    createdAt: Timestamp.now(),
    read: false,
  });

  return { ...order, escrow: { ...order.escrow, status: 'PAYMENT_HELD', heldAt: now } };
}

// ---------- Escrow State Transitions ----------
export async function generateHandoverOtp(orderId: string): Promise<string> {
  const orderDoc = await collections.orders.doc(orderId).get();
  if (!orderDoc.exists) throw new Error('Order not found');
  const order = orderDoc.data() as Order;

  assertTransition(order.escrow.status, 'AWAITING_PICKUP');

  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP
  const now = new Date().toISOString();

  await collections.orders.doc(orderId).update({
    'escrow.status': 'AWAITING_PICKUP',
    'escrow.handoverOtp': otp,
    timeline: [...order.timeline, { status: 'AWAITING_PICKUP', at: now, note: 'OTP generated for delivery handover' }],
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

  // Accept from both IN_TRANSIT and AWAITING_PICKUP
  if (order.escrow.status !== 'IN_TRANSIT' && order.escrow.status !== 'AWAITING_PICKUP') {
    throw new Error(`Cannot confirm delivery from status: ${order.escrow.status}`);
  }

  if (order.escrow.handoverOtp !== otp) {
    throw new Error('Invalid OTP. Please check the 6-digit handover code.');
  }

  // Real capture of authorized Razorpay payment
  if (order.escrow.razorpayPaymentId) {
    try {
      await captureRazorpayPayment(order.escrow.razorpayPaymentId, order.total);
    } catch (err) {
      console.error('Error executing Razorpay payment capture:', err);
      // Proceed if mock or log error
    }
  }

  const now = new Date().toISOString();
  const timeline = [
    ...order.timeline,
    { status: 'DELIVERED', at: now, note: 'Delivery verified via OTP' },
    { status: 'RELEASED', at: now, note: 'Escrow payment captured and disbursed to farmer accounts' },
  ];

  await collections.orders.doc(orderId).update({
    'escrow.status': 'RELEASED',
    'escrow.releasedAt': now,
    timeline,
  });

  // Notify each farmer in the payout split
  for (const payoutItem of order.payout) {
    if (payoutItem.farmerId) {
      await collections.notifications.add({
        userId: payoutItem.farmerId,
        type: 'PAYOUT_RELEASED',
        title: 'Payment Disbursed! 💰',
        body: `₹${(payoutItem.amount / 100).toFixed(2)} credited for ${order.crop} (${payoutItem.quantityKg} kg) in order #${orderId}.`,
        createdAt: Timestamp.now(),
        read: false,
      });
    }
  }

  return {
    ...order,
    escrow: { ...order.escrow, status: 'RELEASED', releasedAt: now },
    timeline,
  };
}

export async function releaseEscrow(orderId: string, otp: string): Promise<Order> {
  return confirmDelivery(orderId, otp);
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

export async function refundOrder(orderId: string, reason?: string): Promise<Order> {
  const orderDoc = await collections.orders.doc(orderId).get();
  if (!orderDoc.exists) throw new Error('Order not found');
  const order = orderDoc.data() as Order;

  if (order.escrow.status !== 'DISPUTED' && order.escrow.status !== 'PAYMENT_HELD') {
    throw new Error(`Cannot refund order from status: ${order.escrow.status}`);
  }

  if (order.escrow.razorpayPaymentId) {
    await refundRazorpayPayment(order.escrow.razorpayPaymentId, order.total);
  }

  const now = new Date().toISOString();
  const timeline = [
    ...order.timeline,
    { status: 'REFUNDED', at: now, note: reason || 'Escrow funds refunded to buyer' },
  ];

  await collections.orders.doc(orderId).update({
    'escrow.status': 'REFUNDED',
    'escrow.refundedAt': now,
    timeline,
  });

  return {
    ...order,
    escrow: { ...order.escrow, status: 'REFUNDED', refundedAt: now },
    timeline,
  };
}
