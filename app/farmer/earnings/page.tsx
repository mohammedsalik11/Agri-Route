'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { RupeeSplitBar } from '@/components/RupeeSplitBar';
import { SimulatedBadge } from '@/components/SimulatedBadge';
import { useT } from '@/lib/i18n/LanguageProvider';
import { TrendingUp, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function EarningsPage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [earningsData, setEarningsData] = useState({
    totalEarned: 840000, // Rs 8,400 (600 kg @ Rs 14)
    totalExtraVsFloor: 360000, // Rs 3,600 extra vs Rs 8/kg distress floor
  });

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('earnings.title')}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time financial transparency and disintermediation dividend
          </p>
        </div>

        {/* Hero Earnings Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-border">
            <span className="text-xs font-semibold text-ink-muted uppercase">
              {t('earnings.totalEarned')}
            </span>
            <p className="text-3xl font-extrabold text-field-green font-mono mt-1">
              {formatCurrency(earningsData.totalEarned)}
            </p>
            <p className="text-[11px] text-ink-muted mt-1">
              Across verified truck-scale wholesale settlements
            </p>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-800 uppercase flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              {t('earnings.extraEarned')}
            </span>
            <p className="text-3xl font-extrabold text-emerald-900 font-mono mt-1">
              +{formatCurrency(earningsData.totalExtraVsFloor)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">
              Extra earned above traditional APMC distress floor rates
            </p>
          </div>
        </div>

        {/* Rupee Split Bar (Signature Component) */}
        <RupeeSplitBar
          farmerPercent={92}
          logisticsPercent={5}
          platformPercent={3}
          totalAmountPaise={earningsData.totalEarned}
        />

        {/* Payout Settlements Ledger */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">
              Settlement Ledger &amp; Payout Records
            </h3>
            <SimulatedBadge label="LEDGER ACTIVE" />
          </div>

          <div className="divide-y divide-border-light text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-ink block">
                  Mandya Tomato Pool Lot (600 kg)
                </span>
                <span className="text-[11px] text-ink-muted">
                  Order #ord_mandya_9921 · Paid by Suresh Traders
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-field-green text-sm block">
                  +₹8,400.00
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                  Escrow Held ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
