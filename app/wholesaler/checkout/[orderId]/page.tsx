'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import { ShieldCheck, Lock, CheckCircle2, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

interface OrderData {
  orderId: string;
  crop: string;
  quantityKg: number;
  subtotal: number;
  logisticsFee: number;
  platformFee: number;
  total: number;
  escrow: {
    status: string;
  };
}

export default function CheckoutPage() {
  const { t, formatCurrency, formatWeight } = useT();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setDataLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setOrder(res.data);
        } else {
          setErrorMsg(res.message || 'Order not found');
        }
      })
      .catch((err) => {
        console.error('Error fetching order for checkout:', err);
        setErrorMsg('Failed to load order details');
      })
      .finally(() => setDataLoading(false));
  }, [orderId]);

  const handlePayTest = async () => {
    if (!order) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${order.orderId}?action=confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: `rzp_ord_${Date.now()}`,
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_signature: 'verified_escrow_deposit',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/wholesaler/orders');
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Payment deposit failed');
      }
    } catch {
      setErrorMsg('Network error. Failed to process escrow deposit.');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-paper pb-24">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
          <div className="animate-pulse bg-white rounded-2xl h-48 border border-border" />
          <div className="animate-pulse bg-white rounded-2xl h-64 border border-border" />
        </main>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="min-h-screen bg-paper pb-24">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-8 space-y-4 text-center">
          <div className="p-8 bg-white rounded-2xl border border-border space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="font-bold text-lg text-ink">Order Not Found</h2>
            <p className="text-xs text-ink-muted">{errorMsg}</p>
            <div className="pt-3">
              <Link
                href="/wholesaler"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-earth text-white font-bold text-xs rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Marketplace</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const orderTotalPaise = order?.total || 0;
  const subtotalPaise = order?.subtotal || 0;
  const logisticsFeePaise = order?.logisticsFee || 0;
  const platformFeePaise = order?.platformFee || 0;

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-earth text-white mx-auto flex items-center justify-center text-xl mb-3 shadow-sm">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-ink">Escrow Payment Gateway</h1>
          <p className="text-xs text-ink-muted mt-1 font-mono">
            Order #{order?.orderId} · Escrow Ledger
          </p>
        </div>

        {/* Escrow Explainer Card */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Agri Route Escrow Protection
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
              SECURE
            </span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed font-medium">
            Your money is <span className="font-bold underline">HELD, not transferred</span> to the farmers. Funds remain securely locked in the escrow ledger and will only be disbursed after physical produce inspection and entry of the 6-digit handover OTP.
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span className="capitalize">Lot Subtotal ({formatWeight(order?.quantityKg || 0)} {order?.crop}):</span>
              <span className="font-bold text-ink">{formatCurrency(subtotalPaise)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Freight Handling &amp; Logistics:</span>
              <span className="font-bold text-ink">{formatCurrency(logisticsFeePaise)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Platform Escrow Fee (3%):</span>
              <span className="font-bold text-ink">{formatCurrency(platformFeePaise)}</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between text-base font-extrabold text-ink">
              <span>Total Deposit Required:</span>
              <span className="text-earth text-lg">{formatCurrency(orderTotalPaise)}</span>
            </div>
          </div>

          {/* Test Rails Credentials banner */}
          <div className="p-3 bg-paper rounded-xl border border-border text-[11px] text-ink-muted space-y-1">
            <p className="font-bold text-ink">Escrow Gateway Test Mode:</p>
            <p>Direct escrow deposit simulation enabled with full transaction ledger tracking.</p>
          </div>

          {success ? (
            <div className="p-4 bg-emerald-600 text-white rounded-xl text-center space-y-1 shadow-sm">
              <CheckCircle2 className="w-6 h-6 mx-auto animate-bounce" />
              <p className="font-bold text-sm">Payment Secured in Escrow Hold!</p>
              <p className="text-xs opacity-90">Redirecting to your active shipments...</p>
            </div>
          ) : (
            <button
              onClick={handlePayTest}
              disabled={loading}
              className="w-full py-4 px-6 bg-earth text-white font-bold text-sm rounded-xl hover:bg-earth-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Holding funds in escrow...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Deposit {formatCurrency(orderTotalPaise)} to Escrow</span>
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
