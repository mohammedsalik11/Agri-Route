'use client';

import React from 'react';
import Link from 'next/link';
import { X, ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useT } from '@/lib/i18n/LanguageProvider';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, count, totalKg, totalPaise, removeItem, clearCart } = useCart();
  const { formatCurrency, formatWeight } = useT();

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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-paper">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-earth" />
            <span className="font-bold text-ink text-base">Cart</span>
            {count > 0 && (
              <span className="px-2 py-0.5 bg-earth text-white text-xs font-bold rounded-full">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-border transition-colors"
            aria-label="Close cart"
          >
            <X className="w-4 h-4 text-ink-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-paper flex items-center justify-center">
                <Package className="w-7 h-7 text-ink-muted" />
              </div>
              <p className="text-sm font-semibold text-ink-muted">Your cart is empty</p>
              <p className="text-xs text-ink-muted/70">
                Browse lots and add produce to buy in bulk
              </p>
            </div>
          ) : (
            items.map((item) => {
              const itemSubtotal = item.quantityKg * item.pricePerKgPaise;
              return (
                <div
                  key={item.sourceId}
                  className="bg-paper rounded-2xl p-4 border border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl shrink-0">{getCropEmoji(item.crop)}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-ink text-sm capitalize">
                          {item.crop}{' '}
                          <span className="font-normal text-xs px-1.5 py-0.5 bg-field-green/10 text-field-green rounded-md">
                            Grade {item.qualityGrade}
                          </span>
                        </p>
                        <p className="text-xs text-ink-muted truncate">
                          {item.district} ·{' '}
                          {item.sourceType === 'pool' ? `Pool lot` : 'Individual listing'}{' '}
                          {item.farmerCount ? `· ${item.farmerCount} farmers` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.sourceId)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-ink-muted hover:text-red-500 transition-colors shrink-0"
                      aria-label="Remove from cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-ink-muted">Quantity</p>
                        <p className="font-semibold text-ink">{formatWeight(item.quantityKg)}</p>
                      </div>
                      <div>
                        <p className="text-ink-muted">Rate</p>
                        <p className="font-semibold text-ink">
                          {formatCurrency(item.pricePerKgPaise)}/kg
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-ink-muted">Subtotal</p>
                      <p className="font-bold text-earth text-sm">
                        {formatCurrency(itemSubtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 bg-paper space-y-3">
            {/* Summary */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-ink-muted">
                <span>Produce ({formatWeight(totalKg)})</span>
                <span>{formatCurrency(totalPaise)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Platform fee (3%)</span>
                <span>{formatCurrency(platformFee)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Logistics (5%)</span>
                <span>{formatCurrency(logisticsFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-ink text-sm border-t border-border pt-1.5">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="flex-1 py-2.5 border border-border rounded-xl text-xs font-semibold text-ink-muted hover:bg-border/50 transition-colors"
              >
                Clear all
              </button>
              <Link
                href="/wholesaler/cart"
                onClick={onClose}
                className="flex-[2] py-2.5 bg-earth text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-earth/90 transition-colors"
              >
                Proceed to Checkout
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
