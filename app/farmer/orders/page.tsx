'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { EscrowTimeline, EscrowStep } from '@/components/EscrowTimeline';
import { SimulatedBadge } from '@/components/SimulatedBadge';
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
  createdAt: string;
}

export default function FarmerOrdersPage() {
  const { t, formatCurrency, formatWeight } = useT();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Demo fallback order if none created yet
  const demoOrder: OrderItem = {
    orderId: 'ord_mandya_9921',
    crop: 'tomato',
    quantityKg: 3000,
    pricePerKg: 1400,
    subtotal: 4200000,
    total: 4536000,
    escrow: {
      status: 'PAYMENT_HELD',
    },
    payout: [
      { farmerId: 'farmer_lakshmamma', farmerName: 'Lakshmamma', quantityKg: 600, amount: 840000 },
      { farmerId: 'demo_0', farmerName: 'Rajamma', quantityKg: 350, amount: 490000 },
      { farmerId: 'demo_1', farmerName: 'Savithramma', quantityKg: 400, amount: 560000 },
    ],
    createdAt: new Date().toISOString(),
  };

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/orders')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data && res.data.length > 0) {
          setOrders(res.data);
        } else {
          setOrders([demoOrder]);
        }
      })
      .catch(() => {
        setOrders([demoOrder]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleGenerateOtp = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}?action=generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok && data.data?.otp) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === orderId
              ? {
                  ...o,
                  escrow: {
                    ...o.escrow,
                    status: 'AWAITING_PICKUP',
                    handoverOtp: data.data.otp,
                  },
                }
              : o
          )
        );
      } else {
        // Fallback demo generation
        const mockOtp = '839201';
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === orderId
              ? {
                  ...o,
                  escrow: {
                    ...o.escrow,
                    status: 'AWAITING_PICKUP',
                    handoverOtp: mockOtp,
                  },
                }
              : o
          )
        );
      }
    } catch {
      const mockOtp = '839201';
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? {
                ...o,
                escrow: {
                  ...o.escrow,
                  status: 'AWAITING_PICKUP',
                  handoverOtp: mockOtp,
                },
              }
            : o
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">{t('order.title')}</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Escrow-protected wholesale dispatches &amp; OTP handovers
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 bg-white rounded-xl border border-border text-ink hover:bg-paper"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {orders.map((order) => {
          const myPayout = order.payout?.find(
            (p) => p.farmerName === 'Lakshmamma' || p.farmerId.includes('lakshmamma')
          ) || { amount: 840000, quantityKg: 600 };

          return (
            <div key={order.orderId} className="space-y-4">
              {/* Order Summary Header Card */}
              <div className="bg-white rounded-2xl p-5 border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-ink-muted block">
                    Order #{order.orderId}
                  </span>
                  <h2 className="text-lg font-bold text-ink capitalize mt-0.5">
                    {order.crop} Full Lot ({formatWeight(order.quantityKg)})
                  </h2>
                  <p className="text-xs text-field-green font-semibold mt-1">
                    Your Share: {formatWeight(myPayout.quantityKg)} → {formatCurrency(myPayout.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-ink-muted block">Buyer Total</span>
                  <span className="text-base font-bold text-ink">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>

              {/* Escrow Timeline */}
              <EscrowTimeline
                currentStatus={order.escrow.status}
                handoverOtp={order.escrow.handoverOtp}
                isFarmer={true}
                onGenerateOtp={() => handleGenerateOtp(order.orderId)}
              />

              {/* Payout Receipt Card if Released */}
              {order.escrow.status === 'RELEASED' && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{t('earnings.payoutReceipt')}</span>
                    </div>
                    <SimulatedBadge label="SIMULATED SETTLEMENT" />
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-emerald-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Farmer Beneficiary:</span>
                      <span className="font-bold text-ink">Lakshmamma (Mandya)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Settlement Amount:</span>
                      <span className="font-bold text-field-green text-sm">
                        {formatCurrency(myPayout.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-ink-muted">Simulated UTR:</span>
                      <span className="text-ink font-bold">RZPX2026091599814</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800 italic">
                    {t('escrow.simulated')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
