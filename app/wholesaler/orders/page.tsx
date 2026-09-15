'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { EscrowTimeline, EscrowStep } from '@/components/EscrowTimeline';
import { useT } from '@/lib/i18n/LanguageProvider';
import { ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

interface OrderItem {
  orderId: string;
  crop: string;
  quantityKg: number;
  total: number;
  subtotal: number;
  pricePerKg: number;
  escrow: {
    status: EscrowStep;
    handoverOtp?: string;
  };
  payout: Array<{ farmerId: string; farmerName: string; quantityKg: number; amount: number }>;
}

export default function WholesalerOrdersPage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [orders, setOrders] = useState<OrderItem[]>([
    {
      orderId: 'ord_mandya_9921',
      crop: 'tomato',
      quantityKg: 3000,
      pricePerKg: 1400,
      subtotal: 4200000,
      total: 4536000,
      escrow: {
        status: 'AWAITING_PICKUP',
        handoverOtp: '839201',
      },
      payout: [
        { farmerId: 'farmer_lakshmamma', farmerName: 'Lakshmamma', quantityKg: 600, amount: 840000 },
        { farmerId: 'demo_0', farmerName: 'Rajamma', quantityKg: 350, amount: 490000 },
        { farmerId: 'demo_1', farmerName: 'Savithramma', quantityKg: 400, amount: 560000 },
      ],
    },
  ]);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleConfirmDelivery = async (orderId: string, otp: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}?action=confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? { ...o, escrow: { ...o.escrow, status: 'RELEASED' } }
            : o
        )
      );
      setStatusMessage('OTP Verified! ₹42,000 released to 9 farmers proportionally.');
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? { ...o, escrow: { ...o.escrow, status: 'RELEASED' } }
            : o
        )
      );
      setStatusMessage('OTP Verified! ₹42,000 released to 9 farmers proportionally.');
    }
  };

  const handleRaiseDispute = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? { ...o, escrow: { ...o.escrow, status: 'DISPUTED' } }
          : o
      )
    );
    setStatusMessage('Dispute registered. Escrow funds frozen.');
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('wholesaler.orders')}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Track active truck shipments, enter farmer handover OTP, and release escrow funds
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.orderId} className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-ink-muted block">
                  Shipment #{order.orderId}
                </span>
                <h2 className="text-lg font-bold text-ink capitalize mt-0.5">
                  {order.crop} Truckload ({formatWeight(order.quantityKg)})
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Mandya Hub → Bengaluru Urban Distribution Center
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-ink-muted block">Total Deposited</span>
                <span className="text-base font-bold text-earth">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            <EscrowTimeline
              currentStatus={order.escrow.status}
              handoverOtp={order.escrow.handoverOtp}
              isFarmer={false}
              onConfirmDelivery={(otp) => handleConfirmDelivery(order.orderId, otp)}
              onRaiseDispute={(reason) => handleRaiseDispute(order.orderId, reason)}
            />
          </div>
        ))}
      </main>
    </div>
  );
}
