'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { RupeeSplitBar } from '@/components/RupeeSplitBar';
import { useT } from '@/lib/i18n/LanguageProvider';
import { TrendingUp, ArrowRight, ShieldCheck, CheckCircle2, Clock, ShoppingBag } from 'lucide-react';

interface OrderEarning {
  orderId: string;
  crop: string;
  quantityKg: number;
  earned: number; // paise
  escrowStatus: string;
  date: string;
}

interface RupeeSplitData {
  farmerPercent: number;
  logisticsPercent: number;
  platformPercent: number;
  orderId: string;
}

export default function EarningsPage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalExtraVsFloor, setTotalExtraVsFloor] = useState(0);
  const [orders, setOrders] = useState<OrderEarning[]>([]);
  const [rupeeSplit, setRupeeSplit] = useState<RupeeSplitData | null>(null);

  useEffect(() => {
    fetch('/api/earnings')
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res?.ok && res.data) {
          setTotalEarned(res.data.totalEarned || 0);
          setTotalExtraVsFloor(res.data.totalExtraVsFloor || 0);
          setOrders(Array.isArray(res.data.orders) ? res.data.orders : []);
          if (res.data.rupeeSplit) {
            setRupeeSplit(res.data.rupeeSplit);
          }
        }
      })
      .catch((err) => console.error('Error fetching earnings:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('earnings.title')}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time financial transparency and disintermediation dividend from database records
          </p>
        </div>

        {/* Hero Earnings Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-border">
            <span className="text-xs font-semibold text-ink-muted uppercase">
              {t('earnings.totalEarned')}
            </span>
            <p className="text-3xl font-extrabold text-field-green font-mono mt-1">
              {formatCurrency(totalEarned)}
            </p>
            <p className="text-[11px] text-ink-muted mt-1">
              {orders.length > 0
                ? `Across ${orders.length} verified wholesale settlement${orders.length > 1 ? 's' : ''}`
                : 'Across verified truck-scale wholesale settlements'}
            </p>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-800 uppercase flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              {t('earnings.extraEarned')}
            </span>
            <p className="text-3xl font-extrabold text-emerald-900 font-mono mt-1">
              +{formatCurrency(totalExtraVsFloor)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">
              Extra earned above traditional APMC distress floor rates
            </p>
          </div>
        </div>

        {/* Rupee Split Bar (Signature Component) */}
        <RupeeSplitBar
          farmerPercent={rupeeSplit?.farmerPercent || 92}
          logisticsPercent={rupeeSplit?.logisticsPercent || 5}
          platformPercent={rupeeSplit?.platformPercent || 3}
          totalAmountPaise={totalEarned}
        />

        {/* Payout Settlements Ledger */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">
              Settlement Ledger &amp; Payout Records
            </h3>
            <span className="text-[11px] font-bold text-field-green bg-field-green/10 px-2.5 py-0.5 rounded-full">
              LIVE LEDGER
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-paper rounded-xl h-14" />
              <div className="animate-pulse bg-paper rounded-xl h-14" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-paper mx-auto flex items-center justify-center text-ink-muted">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-ink">No settlements recorded yet</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                When wholesale buyers purchase your pooled produce lots and verify handover via OTP, your proportional settlement payouts will appear here in real-time.
              </p>
              <div className="pt-2">
                <Link
                  href="/farmer/list"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-field-green text-white rounded-xl text-xs font-bold hover:bg-field-green-light transition-all"
                >
                  <span>{t('farmer.dashboard.listProduce')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border-light text-xs">
              {orders.map((order) => {
                const isReleased = order.escrowStatus === 'RELEASED';
                return (
                  <div key={order.orderId} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-ink block capitalize">
                        {order.crop} Pool Lot ({formatWeight(order.quantityKg)})
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        Order #{order.orderId}
                        {order.date ? ` · ${new Date(order.date).toLocaleDateString()}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-field-green text-sm block">
                        +{formatCurrency(order.earned)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isReleased
                            ? 'text-emerald-800 bg-emerald-100'
                            : 'text-amber-800 bg-amber-100'
                        }`}
                      >
                        {isReleased ? 'Released ✓' : 'Escrow Held'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
