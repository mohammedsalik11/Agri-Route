'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import {
  PlusCircle,
  Users,
  Warehouse,
  ShoppingBag,
  Award,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function FarmerDashboard() {
  const { t, formatCurrency, formatWeight } = useT();
  const { language } = useLanguage();

  const [rateData, setRateData] = useState<{
    modalPrice: number;
    minPrice: number;
    maxPrice: number;
    source: 'LIVE' | 'CACHED';
    date: string;
    crop: string;
  }>({
    modalPrice: 1400,
    minPrice: 800,
    maxPrice: 2200,
    source: 'CACHED',
    date: 'Today',
    crop: 'tomato',
  });

  const [stats, setStats] = useState({
    activeListingsCount: 1,
    pooledQuantityKg: 600,
    escrowInFlightPaise: 840000,
    matchedSchemeName: 'PM-KISAN',
    matchedSchemeBenefit: '₹6,000 / year',
  });

  useEffect(() => {
    // Fetch live / cached rate for primary crop
    fetch('/api/prices?crop=tomato&district=Mandya')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setRateData({
            modalPrice: res.data.mandiModalPerKg || 1400,
            minPrice: res.data.mandiMinPerKg || 800,
            maxPrice: res.data.mandiMaxPerKg || 2200,
            source: res.data.dataSource || 'CACHED',
            date: res.data.mandiDate || 'Today',
            crop: res.data.crop || 'tomato',
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome & Persona Banner */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-5 border border-border">
          <div>
            <span className="text-xs font-semibold text-field-green uppercase tracking-wide">
              {t('role.farmer')} Dashboard
            </span>
            <h1 className="text-xl font-bold text-ink mt-0.5">
              Namaskara, Lakshmamma 🌾
            </h1>
            <p className="text-xs text-ink-muted">
              Mandya District · 1.5 Acres · Mandya Centroid
            </p>
          </div>
          <Link
            href="/farmer/list"
            className="px-4 py-2.5 bg-field-green text-paper rounded-xl text-xs font-bold hover:bg-field-green-light flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('farmer.dashboard.listProduce')}</span>
          </Link>
        </div>

        {/* Hero Rate Highlight Card */}
        <div className="bg-gradient-to-br from-field-green to-[#0f291e] rounded-2xl p-6 text-paper shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/80">
              {t('farmer.dashboard.todayRate')} · Tomato (Mandya APMC)
            </span>
            <DataSourceBadge source={rateData.source} date={rateData.date} />
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight font-mono">
              ₹{(rateData.modalPrice / 100).toFixed(1)}
            </span>
            <span className="text-sm text-white/80 font-medium">/ kg modal</span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex justify-between text-xs text-white/80">
            <span>Range: ₹{(rateData.minPrice / 100).toFixed(0)} - ₹{(rateData.maxPrice / 100).toFixed(0)} / kg</span>
            <span className="text-emerald-300 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +4.2% this week
            </span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Active Listings */}
          <Link
            href="/farmer/pools"
            className="bg-white rounded-2xl p-4 border border-border hover:border-field-green transition-all"
          >
            <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
              <span>{t('farmer.dashboard.myPool')}</span>
              <Users className="w-4 h-4 text-earth" />
            </div>
            <p className="text-2xl font-bold text-ink">
              {formatWeight(stats.pooledQuantityKg)}
            </p>
            <p className="text-[11px] text-field-green font-medium mt-1">
              Active in Mandya Tomato Lot
            </p>
          </Link>

          {/* Escrow in Flight */}
          <Link
            href="/farmer/orders"
            className="bg-white rounded-2xl p-4 border border-border hover:border-field-green transition-all"
          >
            <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
              <span>{t('farmer.dashboard.earnings')}</span>
              <ShieldCheck className="w-4 h-4 text-field-green" />
            </div>
            <p className="text-2xl font-bold text-ink">
              {formatCurrency(stats.escrowInFlightPaise)}
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              Secured in escrow hold
            </p>
          </Link>

          {/* Matched Scheme */}
          <Link
            href="/farmer/schemes"
            className="bg-white rounded-2xl p-4 border border-border hover:border-field-green transition-all"
          >
            <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
              <span>Matched Scheme</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-base font-bold text-ink truncate">
              {stats.matchedSchemeName}
            </p>
            <p className="text-[11px] text-field-green font-semibold mt-1">
              {stats.matchedSchemeBenefit} available
            </p>
          </Link>
        </div>

        {/* 4 Big Tappable Action Tiles (Mobile-First) */}
        <div>
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/farmer/list"
              className="bg-white rounded-2xl p-5 border-2 border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between min-h-[110px]"
            >
              <div className="w-10 h-10 rounded-xl bg-field-green/10 text-field-green flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-ink text-sm">
                  {t('farmer.dashboard.listProduce')}
                </span>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </div>
            </Link>

            <Link
              href="/farmer/pools"
              className="bg-white rounded-2xl p-5 border-2 border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between min-h-[110px]"
            >
              <div className="w-10 h-10 rounded-xl bg-earth/10 text-earth flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-ink text-sm">
                  {t('farmer.dashboard.viewPools')}
                </span>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </div>
            </Link>

            <Link
              href="/farmer/storage"
              className="bg-white rounded-2xl p-5 border-2 border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between min-h-[110px]"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Warehouse className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-ink text-sm">
                  {t('farmer.dashboard.coldStorage')}
                </span>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </div>
            </Link>

            <Link
              href="/farmer/earnings"
              className="bg-white rounded-2xl p-5 border-2 border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between min-h-[110px]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-ink text-sm">
                  {t('farmer.dashboard.myEarnings')}
                </span>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
