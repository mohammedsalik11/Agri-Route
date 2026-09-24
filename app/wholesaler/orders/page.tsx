'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { EscrowTimeline, EscrowStep } from '@/components/EscrowTimeline';
import { LogisticsTracker } from '@/components/LogisticsTracker';
import { useT } from '@/lib/i18n/LanguageProvider';
import { ShieldCheck, CheckCircle2, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

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
  createdAt?: string;
}

export default function WholesalerOrdersPage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/orders')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && Array.isArray(res.data)) {
          setOrders(res.data);
        }
      })
      .catch((err) => console.error('Error fetching wholesaler orders:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmDelivery = async (orderId: string, otp: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}?action=confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();

      if (data.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === orderId
              ? { ...o, escrow: { ...o.escrow, status: 'RELEASED' } }
              : o
          )
        );
        setStatusMessage('OTP Verified successfully! Payment released to farmers.');
      } else {
        setErrorMsg(data.message || 'OTP verification failed. Please re-check the OTP.');
      }
    } catch {
      setErrorMsg('Network error. Failed to confirm delivery.');
    }
  };

  const handleRaiseDispute = async (orderId: string, reason: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}?action=dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();

      if (data.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === orderId
              ? { ...o, escrow: { ...o.escrow, status: 'DISPUTED' } }
              : o
          )
        );
        setStatusMessage('Dispute registered. Escrow funds placed on hold.');
      }
    } catch {
      setErrorMsg('Failed to raise dispute.');
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">{t('wholesaler.orders')}</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Track active shipments, enter farmer handover OTP upon physical receipt, and release escrow funds.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 bg-white rounded-xl border border-border text-ink hover:bg-paper"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {statusMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-pulse bg-white rounded-2xl h-48 border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-48 border border-border" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-earth/10 text-earth flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-ink text-base">{t('order.noOrders')}</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              You haven't placed any wholesale orders yet. Browse available farmer pooled lots and purchase with escrow protection.
            </p>
            <Link
              href="/wholesaler"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all shadow-xs"
            >
              <span>{t('wholesaler.browse')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {orders.map((order) => (
              <div key={order.orderId} className="space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-ink-muted block">
                      Shipment #{order.orderId}
                    </span>
                    <h2 className="text-lg font-bold text-ink capitalize mt-0.5">
                      {order.crop} Lot ({formatWeight(order.quantityKg)})
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Direct Farmer Sourcing · Escrow Protected
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

                <LogisticsTracker orderId={order.orderId} isFarmer={false} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
