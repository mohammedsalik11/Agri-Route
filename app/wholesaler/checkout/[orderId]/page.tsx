'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import { ShieldCheck, Lock, CheckCircle2, Loader2, ArrowLeft, AlertCircle, CreditCard, Zap } from 'lucide-react';

interface OrderData {
  orderId: string;
  crop: string;
  quantityKg: number;
  subtotal: number;
  logisticsFee: number;
  platformFee: number;
  total: number;
  district?: string;
  state?: string;
  escrow: {
    status: string;
    razorpayOrderId?: string;
  };
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { t, formatCurrency, formatWeight } = useT();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');
  const [buyerName, setBuyerName] = useState('Wholesaler');

  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setDataLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/orders/${orderId}`).then((r) => r.json()),
      fetch('/api/me').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([orderRes, meRes]) => {
        if (orderRes.ok && orderRes.data) {
          setOrder(orderRes.data);
          setRazorpayOrderId(orderRes.razorpayOrderId || orderRes.data.escrow?.razorpayOrderId || null);
          setRazorpayKeyId(orderRes.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '');
        } else {
          setErrorMsg(orderRes.message || 'Order not found');
        }

        if (meRes?.data?.name) {
          setBuyerName(meRes.data.businessName || meRes.data.name);
        }
      })
      .catch((err) => {
        console.error('Error fetching order for checkout:', err);
        setErrorMsg('Failed to load order details');
      })
      .finally(() => setDataLoading(false));
  }, [orderId]);

  const handleSimulatedPay = async () => {
    if (!order) return;
    setVerifying(true);
    setErrorMsg(null);

    try {
      const confirmRes = await fetch(`/api/orders/${order.orderId}?action=confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayOrderId || `order_mock_${Date.now()}`,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock',
        }),
      });

      const confirmData = await confirmRes.json();
      if (confirmData.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/wholesaler/orders');
        }, 1500);
      } else {
        setErrorMsg(confirmData.message || 'Simulated payment failed.');
      }
    } catch {
      setErrorMsg('Network error confirming payment.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    setLoading(true);
    setErrorMsg(null);

    // If order already paid or in hold
    if (order.escrow?.status === 'PAYMENT_HELD' || order.escrow?.status === 'RELEASED') {
      router.push('/wholesaler/orders');
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setErrorMsg('Could not load Razorpay SDK. You can use the Simulated Payment button below.');
      setLoading(false);
      return;
    }

    const key = razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TcMROzxDSVjlR7';
    const rzpOrderId = razorpayOrderId || order.escrow?.razorpayOrderId;

    // Only pass order_id to Razorpay if it is a real Razorpay server-created order ID (not mock)
    const isRealRzpOrderId = rzpOrderId && !rzpOrderId.startsWith('order_mock_');

    const options = {
      key,
      amount: order.total,
      currency: 'INR',
      name: 'Agri Route Escrow',
      description: `Escrow Hold Deposit · Order #${order.orderId}`,
      order_id: isRealRzpOrderId ? rzpOrderId : undefined,
      handler: async function (response: any) {
        try {
          setVerifying(true);
          const confirmRes = await fetch(`/api/orders/${order.orderId}?action=confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || rzpOrderId || `order_mock_${Date.now()}`,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'mock',
            }),
          });
          const confirmData = await confirmRes.json();
          if (confirmData.ok) {
            setSuccess(true);
            setTimeout(() => {
              router.push('/wholesaler/orders');
            }, 1500);
          } else {
            setErrorMsg(confirmData.message || 'Payment signature verification failed.');
          }
        } catch {
          setErrorMsg('Network error verifying payment.');
        } finally {
          setVerifying(false);
          setLoading(false);
        }
      },
      prefill: {
        name: buyerName,
      },
      theme: {
        color: '#1b4332',
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        },
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMsg(response.error?.description || 'Payment was cancelled or test mode encountered an issue. You can complete the demo using Simulated Payment.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay invocation error:', err);
      setErrorMsg('Failed to open Razorpay modal. Please use the Simulated Payment button.');
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-paper pb-24">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-4 text-center">
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-earth text-white mx-auto flex items-center justify-center text-xl mb-3 shadow-sm">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-ink">Escrow Payment Gateway</h1>
          <p className="text-xs text-ink-muted mt-1 font-mono">
            Order #{order?.orderId} · Escrow Ledger
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Escrow Explainer & Logistics */}
          <div className="space-y-4">
            {/* Escrow Explainer Card */}
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Agri Route Escrow Protection
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                  RAZORPAY SECURED
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                Your money is <span className="font-bold underline">HELD in escrow, not transferred</span> to the farmers immediately. Funds remain securely locked in the ledger and will only be disbursed after physical produce inspection and entry of the 6-digit handover OTP.
              </p>
            </div>

            {/* Logistics Route with Google Maps */}
            <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <span>📍</span>
                  <span>Freight Transit Route</span>
                </span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent((order?.district ? `${order.district} APMC Hub, ` : '') + (order?.state || 'India'))}&destination=${encodeURIComponent('Buyer APMC Yard, ' + (order?.state || 'India'))}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-earth font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>View on Google Maps ↗</span>
                </a>
              </div>
              <div className="p-3 bg-paper rounded-xl flex items-center justify-between text-[11px] text-ink-muted">
                <span>Origin: <strong className="text-ink">{order?.district ? `${order.district} Aggregation Hub` : 'Regional Farm Gate'}</strong></span>
                <span>➔</span>
                <span>Destination: <strong className="text-ink">Buyer APMC Yard</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Summary & Checkout Action */}
          <div className="space-y-4 md:sticky md:top-24">
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

              {success ? (
                <div className="p-4 bg-emerald-600 text-white rounded-xl text-center space-y-1 shadow-sm">
                  <CheckCircle2 className="w-6 h-6 mx-auto animate-bounce" />
                  <p className="font-bold text-sm">Payment Secured in Escrow Hold!</p>
                  <p className="text-xs opacity-90">Redirecting to your active shipments...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handlePay}
                    disabled={loading || verifying}
                    className="w-full py-4 px-6 bg-earth text-white font-bold text-sm rounded-xl hover:bg-earth-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Securing Escrow Deposit...</span>
                      </>
                    ) : loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opening Razorpay Gateway...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay {formatCurrency(orderTotalPaise)} via Razorpay</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulatedPay}
                    disabled={loading || verifying}
                    className="w-full py-3 px-4 bg-paper hover:bg-paper-dark border border-earth/30 text-earth font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Simulate Escrow Hold (Demo / Sandbox Mode)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
