'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { EscrowTimeline, EscrowStep } from '@/components/EscrowTimeline';
import { useT } from '@/lib/i18n/LanguageProvider';
import { ShieldCheck, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';


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
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const meRes = await fetch('/api/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUserId(meData.data?.clerkId || '');
      }

      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleGenerateOtp = async (orderId: string) => {
    try {
      setErrorMsg('');
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
        setErrorMsg('Failed to generate OTP. Please try again.');
      }
    } catch {
      setErrorMsg('Network error. Failed to generate OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">{t('order.title')}</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              {t('order.escrowProtected')}
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 bg-white rounded-xl border border-border text-ink hover:bg-paper"
            title={t('order.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse bg-white rounded-2xl h-32 w-full border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-48 w-full border border-border" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-border mt-4">
            <div className="w-12 h-12 rounded-full bg-paper mx-auto flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-ink-muted" />
            </div>
            <p className="text-sm font-semibold text-ink">{t('order.noOrders')}</p>
            <p className="text-xs text-ink-muted mt-1">{t('order.noOrdersDesc')}</p>
          </div>
        ) : (
          orders.map((order) => {
            const myPayout = order.payout?.find((p) => p.farmerId === userId) || { amount: 0, quantityKg: 0, farmerName: t('order.farmer') };

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
                      {t('order.yourShare')}: {formatWeight(myPayout.quantityKg)} → {formatCurrency(myPayout.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-ink-muted block">{t('order.buyerTotal')}</span>
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
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-emerald-200 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Farmer Beneficiary:</span>
                        <span className="font-bold text-ink capitalize">{myPayout.farmerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">{t('order.settlementAmount')}:</span>
                        <span className="font-bold text-field-green text-sm">
                          {formatCurrency(myPayout.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-ink-muted">{t('order.simulatedUtr')}:</span>
                        <span className="text-ink font-bold">RZPX{Math.floor(Math.random() * 10000000000)}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-800 italic">
                      {t('order.settlementNote')}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
