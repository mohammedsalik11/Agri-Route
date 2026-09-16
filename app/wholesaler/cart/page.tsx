'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useCart } from '@/lib/context/CartContext';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  ShoppingCart,
  Trash2,
  Package,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { items, totalKg, totalPaise, removeItem, clearCart } = useCart();
  const { formatCurrency, formatWeight } = useT();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformFee = Math.round(totalPaise * 0.03);
  const logisticsFee = Math.round(totalPaise * 0.05);
  const grandTotal = totalPaise + platformFee + logisticsFee;

  const getCropEmoji = (crop: string) => {
    const map: Record<string, string> = {
      tomato: '🍅', onion: '🧅', potato: '🥔', paddy: '🌾',
      ragi: '🌾', wheat: '🌾', maize: '🌽', banana: '🍌',
      brinjal: '🍆', cabbage: '🥬', cauliflower: '🥦', groundnut: '🥜',
      soybean: '🫘', sugarcane: '🎋', cotton: '🌿',
    };
    return map[crop.toLowerCase()] ?? '🌱';
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            sourceType: i.sourceType,
            sourceId: i.sourceId,
          })),
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.message || 'Failed to place order. Please try again.');
        setLoading(false);
        return;
      }

      // If multiple orders were created, go to orders list
      // If single, go to the checkout/payment page
      const orders = data.data?.orders ?? [];
      clearCart();

      if (orders.length === 1 && data.data?.razorpayOrderId) {
        router.push(`/wholesaler/checkout/${orders[0].orderId}`);
      } else {
        router.push('/wholesaler/orders');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-paper pb-24 md:pb-8">
          <div className="max-w-2xl mx-auto px-4 pt-6">
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-border flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-ink-muted" />
              </div>
              <div>
                <p className="font-bold text-ink text-lg">Your cart is empty</p>
                <p className="text-sm text-ink-muted mt-1">
                  Browse available lots and add produce to your cart
                </p>
              </div>
              <Link
                href="/wholesaler"
                className="px-6 py-3 bg-earth text-white rounded-xl font-bold text-sm hover:bg-earth/90 transition-colors"
              >
                Browse Lots
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-paper pb-32 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link
              href="/wholesaler"
              className="p-2 rounded-xl bg-white border border-border text-ink hover:bg-paper transition-colors"
              aria-label="Back to browse"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-ink">Cart &amp; Checkout</h1>
              <p className="text-xs text-ink-muted">
                {items.length} {items.length === 1 ? 'item' : 'items'} ·{' '}
                {formatWeight(totalKg)} total
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => {
              const itemSubtotal = item.quantityKg * item.pricePerKgPaise;
              return (
                <div
                  key={item.sourceId}
                  className="bg-white rounded-2xl p-5 border border-border shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-paper flex items-center justify-center text-2xl shrink-0">
                        {getCropEmoji(item.crop)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-ink capitalize text-base">{item.crop}</p>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          <span className="text-[11px] px-1.5 py-0.5 bg-field-green/10 text-field-green font-semibold rounded-md">
                            Grade {item.qualityGrade}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 bg-paper text-ink-muted font-medium rounded-md border border-border">
                            {item.district}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 bg-paper text-ink-muted font-medium rounded-md border border-border">
                            {item.sourceType === 'pool' ? 'Pool lot' : 'Individual'}
                          </span>
                          {item.farmerCount && (
                            <span className="text-[11px] px-1.5 py-0.5 bg-paper text-ink-muted font-medium rounded-md border border-border">
                              {item.farmerCount} farmers
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.sourceId)}
                      className="p-2 rounded-xl hover:bg-red-50 text-ink-muted hover:text-red-500 transition-colors shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Quantity', value: formatWeight(item.quantityKg) },
                      { label: 'Rate /kg', value: formatCurrency(item.pricePerKgPaise) },
                      { label: 'Subtotal', value: formatCurrency(itemSubtotal), accent: true },
                    ].map(({ label, value, accent }) => (
                      <div key={label} className="bg-paper rounded-xl p-3">
                        <p className="text-[10px] text-ink-muted font-medium">{label}</p>
                        <p className={`text-sm font-bold ${accent ? 'text-earth' : 'text-ink'}`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-5 border border-border shadow-xs">
            <h2 className="font-bold text-ink text-sm mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-earth" />
              Order Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Produce subtotal ({formatWeight(totalKg)})</span>
                <span>{formatCurrency(totalPaise)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Platform fee (3%)</span>
                <span>{formatCurrency(platformFee)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Logistics estimate (5%)</span>
                <span>{formatCurrency(logisticsFee)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-ink text-base">
                <span>Total Payable</span>
                <span className="text-earth">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-blue-50 rounded-xl flex items-center gap-2 text-xs text-blue-700">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Payment is held in escrow until successful delivery confirmation.
                Funds are released to farmers only after OTP handover.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-6">
            <button
              onClick={clearCart}
              className="flex-1 py-3.5 border border-border rounded-xl font-semibold text-sm text-ink-muted hover:bg-border/50 transition-colors"
            >
              Clear Cart
            </button>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="flex-[2] py-3.5 bg-earth text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-earth/90 transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Place Order · {formatCurrency(grandTotal)}
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
