'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SimulatedBadge } from '@/components/SimulatedBadge';
import { useT } from '@/lib/i18n/LanguageProvider';
import { ShieldCheck, Lock, CheckCircle2, Loader2, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const { t, formatCurrency } = useT();
  const router = useRouter();
  const params = useParams();
  const orderId = (params?.orderId as string) || 'ord_mandya_9921';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const orderTotalPaise = 4536000; // ₹45,360

  const handlePayTest = async () => {
    setLoading(true);

    try {
      // Trigger confirm payment with mock / test payload
      const res = await fetch(`/api/orders/${orderId}?action=confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: `rzp_ord_${Date.now()}`,
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_signature: 'mock_verified_signature',
        }),
      });

      const data = await res.json();
      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        router.push('/wholesaler/orders');
      }, 1500);
    } catch {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/wholesaler/orders');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-earth text-white mx-auto flex items-center justify-center text-xl mb-3">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-ink">Escrow Payment Gateway</h1>
          <p className="text-xs text-ink-muted mt-1">
            Order #{orderId} · Razorpay Test Rails
          </p>
        </div>

        {/* Escrow Explainer Card (§12.1, §15, §20) */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Agri Route Escrow Protection
            </span>
            <SimulatedBadge label="ESCROW ACTIVE" />
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed font-medium">
            Your money is <span className="font-bold underline">HELD, not transferred</span> to the farmers. Funds are locked securely in an escrow ledger and will only be disbursed after you physically inspect the truckload and verify the 6-digit handover OTP.
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Lot Subtotal (3,000 kg Tomato Grade A):</span>
              <span className="font-bold text-ink">₹42,000.00</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Freight Handling:</span>
              <span className="font-bold text-ink">₹2,100.00</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Platform Escrow Fee (3%):</span>
              <span className="font-bold text-ink">₹1,260.00</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between text-base font-extrabold text-ink">
              <span>Total Deposit Required:</span>
              <span className="text-earth text-lg">{formatCurrency(orderTotalPaise)}</span>
            </div>
          </div>

          {/* Test Credentials banner */}
          <div className="p-3 bg-paper rounded-xl border border-border text-[11px] text-ink-muted space-y-1">
            <p className="font-bold text-ink">Test Rails Credentials:</p>
            <p>Razorpay Test Card: <code className="bg-white px-1 rounded">4111 1111 1111 1111</code> · UPI: <code className="bg-white px-1 rounded">success@razorpay</code></p>
          </div>

          {success ? (
            <div className="p-4 bg-emerald-500 text-white rounded-xl text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 mx-auto animate-bounce" />
              <p className="font-bold text-sm">Payment Secured in Escrow Hold!</p>
              <p className="text-xs opacity-90">Redirecting to active dispatches...</p>
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
