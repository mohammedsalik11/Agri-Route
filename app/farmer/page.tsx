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
  MessageSquare,
} from 'lucide-react';

interface UserProfile {
  name: string;
  district: string;
  landSizeAcres?: number;
  village?: string;
  primaryCrops?: string[];
  clerkUserId: string;
}

interface StatsData {
  activeListingsCount: number;
  pooledQuantityKg: number;
  escrowInFlightPaise: number;
  matchedSchemeName: string;
  matchedSchemeBenefit: string;
}

export default function FarmerDashboard() {
  const { t, formatCurrency, formatWeight } = useT();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [rateData, setRateData] = useState<{
    modalPrice: number;
    minPrice: number;
    maxPrice: number;
    source: 'LIVE' | 'CACHED';
    date: string;
    crop: string;
  }>({
    modalPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    source: 'LIVE',
    date: 'Today',
    crop: 'tomato',
  });

  const [multiCropRates, setMultiCropRates] = useState<Record<string, any>>({});

  const [stats, setStats] = useState<StatsData>({
    activeListingsCount: 0,
    pooledQuantityKg: 0,
    escrowInFlightPaise: 0,
    matchedSchemeName: '',
    matchedSchemeBenefit: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, listingsRes, ordersRes, earningsRes, schemesRes] = await Promise.all([
          fetch('/api/me').then((res) => (res.ok ? res.json() : null)),
          fetch('/api/listings').then((res) => (res.ok ? res.json() : null)),
          fetch('/api/orders').then((res) => (res.ok ? res.json() : null)),
          fetch('/api/earnings').then((res) => (res.ok ? res.json() : null)),
          fetch('/api/schemes/match').then((res) => (res.ok ? res.json() : null)),
        ]);

        const me: UserProfile | null = meRes?.data || null;
        if (me) {
          setProfile(me);

          // Fetch rates for multiple crops & district at once
          const district = me.district || 'Mandya';
          const primaryCrop = me.primaryCrops?.[0] || 'tomato';

          fetch(`/api/prices?crops=tomato,onion,potato,paddy,wheat,ragi,maize,banana&district=${district}`)
            .then((res) => res.json())
            .then((res) => {
              if (res.ok && res.data?.crops) {
                setMultiCropRates(res.data.crops);
                const active = res.data.crops[primaryCrop.toLowerCase()] || res.data.crops['tomato'];
                if (active) {
                  setRateData({
                    modalPrice: active.mandiModalPerKg || 0,
                    minPrice: active.mandiMinPerKg || 0,
                    maxPrice: active.mandiMaxPerKg || 0,
                    source: active.dataSource || 'LIVE',
                    date: active.mandiDate || 'Today',
                    crop: active.crop || primaryCrop,
                  });
                }
              }
            })
            .catch(() => {});
        }

        // Real listings from database
        const userListings: any[] = listingsRes?.data || [];
        const activeListings = userListings.filter(
          (l) => l.status === 'available' || l.status === 'pooled'
        );
        const activeListingsCount = activeListings.length;

        // Pooled quantity from user's actual pooled listings
        const pooledQuantityKg = userListings
          .filter((l) => l.status === 'pooled')
          .reduce((sum, l) => sum + (Number(l.quantityKg) || 0), 0);

        // Real escrow amount from active orders
        let escrowInFlightPaise = 0;
        if (ordersRes?.data && me) {
          ordersRes.data.forEach((o: any) => {
            if (o.escrow?.status !== 'RELEASED' && o.escrow?.status !== 'REFUNDED') {
              const myPayout = o.payout?.find(
                (p: any) => p.farmerId === me.clerkUserId
              );
              if (myPayout) {
                escrowInFlightPaise += myPayout.amount || 0;
              }
            }
          });
        }

        // Matched scheme from rules engine for this farmer's profile
        let matchedSchemeName = '';
        let matchedSchemeBenefit = '';
        if (schemesRes?.data && schemesRes.data.length > 0) {
          const topScheme = schemesRes.data[0];
          matchedSchemeName = topScheme.nameKey ? t(topScheme.nameKey) : (topScheme.name || '');
          matchedSchemeBenefit = topScheme.benefit || '';
        }

        setStats({
          activeListingsCount,
          pooledQuantityKg,
          escrowInFlightPaise,
          matchedSchemeName,
          matchedSchemeBenefit,
        });
      } catch (err) {
        console.error('Farmer dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper pb-24">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="animate-pulse bg-white rounded-2xl h-24 w-full border border-border" />
          <div className="animate-pulse bg-white rounded-2xl h-48 w-full border border-border" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="animate-pulse bg-white rounded-2xl h-28 w-full border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-28 w-full border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-28 w-full border border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="animate-pulse bg-white rounded-2xl h-28 w-full border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-28 w-full border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-28 w-full border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-28 w-full border border-border" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome & Persona Banner */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-5 border border-border">
          <div>
            <span className="text-xs font-semibold text-field-green uppercase tracking-wide">
              {t('role.farmer')} {t('farmer.dashboard.title')}
            </span>
            <h1 className="text-xl font-bold text-ink mt-0.5 capitalize">
              {t('farmer.dashboard.welcome')}, {profile?.name || 'Farmer'} 🌾
            </h1>
            {profile && (
              <p className="text-xs text-ink-muted capitalize mt-0.5">
                {profile.district}
                {profile.village ? ` · ${profile.village}` : ''}
                {profile.landSizeAcres ? ` · ${profile.landSizeAcres} ${t('common.acres')}` : ''}
                {profile.primaryCrops && profile.primaryCrops.length > 0
                  ? ` · ${profile.primaryCrops.join(', ')}`
                  : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/farmer/verification"
              className="px-3.5 py-2.5 bg-paper text-field-green border border-field-green/30 rounded-xl text-xs font-bold hover:bg-field-green/10 flex items-center gap-1.5 shadow-xs transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Crop</span>
            </Link>
            <Link
              href="/farmer/list"
              className="px-4 py-2.5 bg-field-green text-paper rounded-xl text-xs font-bold hover:bg-field-green-light flex items-center gap-1.5 shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('farmer.dashboard.listProduce')}</span>
            </Link>
          </div>
        </div>

        {/* Hero Rate Highlight Card */}
        <div className="bg-gradient-to-br from-field-green to-[#0f291e] rounded-2xl p-6 text-paper shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/80 capitalize">
              {t('farmer.dashboard.todayRate')} · {rateData.crop} ({profile?.district || 'Karnataka'} APMC)
            </span>
            <DataSourceBadge source={rateData.source} date={rateData.date} />
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight font-mono">
              ₹{(rateData.modalPrice / 100).toFixed(1)}
            </span>
            <span className="text-sm text-white/80 font-medium">/ {t('common.kg')} modal</span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex justify-between text-xs text-white/80">
            <span>
              {t('farmer.dashboard.range')}: ₹{(rateData.minPrice / 100).toFixed(0)} - ₹
              {(rateData.maxPrice / 100).toFixed(0)} / {t('common.kg')}
            </span>
            <span className="text-emerald-300 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +4.2% {t('farmer.dashboard.weeklyTrend')}
            </span>
          </div>
        </div>

        {/* Live Multi-Crop Mandi Benchmark Ticker */}
        {Object.keys(multiCropRates).length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Live Agmarknet Mandi Rates ({profile?.district || 'Karnataka'})
                </h3>
              </div>
              <span className="text-[10px] text-ink-muted">Tap crop to inspect</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(multiCropRates).map(([cropKey, info]: [string, any]) => {
                const isSelected = rateData.crop.toLowerCase() === cropKey.toLowerCase();
                const emojis: Record<string, string> = {
                  tomato: '🍅', onion: '🧅', potato: '🥔', paddy: '🌾',
                  wheat: '🌾', ragi: '🌱', maize: '🌽', banana: '🍌',
                };
                const agmarknetUrl = `https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=0&Tx_State=0&Tx_District=0&Tx_Market=0&DateFrom=&DateTo=&Fr_Date=&To_Date=&Tx_Comm=&Tx_State1=&Tx_District1=&Tx_Market1=&Tx_Comm1=${encodeURIComponent(cropKey)}`;
                const varietyCount = Array.isArray(info.varieties) ? info.varieties.length : 0;

                return (
                  <button
                    key={cropKey}
                    onClick={() => {
                      setRateData({
                        modalPrice: info.mandiModalPerKg || 0,
                        minPrice: info.mandiMinPerKg || 0,
                        maxPrice: info.mandiMaxPerKg || 0,
                        source: info.dataSource || 'LIVE',
                        date: info.mandiDate || 'Today',
                        crop: cropKey,
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-field-green bg-emerald-50/60 ring-2 ring-field-green/20'
                        : 'border-border bg-paper/60 hover:border-field-green/40 hover:bg-paper'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink capitalize flex items-center gap-1.5">
                        <span>{emojis[cropKey] || '📦'}</span>
                        <span>{cropKey}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {varietyCount > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {varietyCount}v
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          info.dataSource === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {info.dataSource || 'LIVE'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className="text-sm font-extrabold text-ink font-mono block">
                        ₹{((info.mandiModalPerKg || 0) / 100).toFixed(1)}
                        <span className="text-[10px] text-ink-muted font-normal">/kg</span>
                      </span>
                      <span className="text-[10px] text-ink-muted block mt-0.5">
                        ₹{((info.mandiMinPerKg || 0) / 100).toFixed(0)} - ₹{((info.mandiMaxPerKg || 0) / 100).toFixed(0)}
                      </span>
                    </div>

                    <a
                      href={agmarknetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 text-[9px] text-field-green font-semibold hover:underline"
                    >
                      View on Agmarknet ↗
                    </a>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Active Listings / Pooled Quantity */}
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
              {stats.activeListingsCount > 0
                ? `${stats.activeListingsCount} ${t('farmer.dashboard.activeListings')}`
                : t('common.noData')}
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
              {stats.escrowInFlightPaise > 0
                ? t('farmer.dashboard.escrowHold')
                : t('common.noData')}
            </p>
          </Link>

          {/* Matched Scheme */}
          <Link
            href="/farmer/schemes"
            className="bg-white rounded-2xl p-4 border border-border hover:border-field-green transition-all"
          >
            <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
              <span>{t('farmer.dashboard.matchedScheme')}</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-base font-bold text-ink truncate">
              {stats.matchedSchemeName || t('common.noData')}
            </p>
            <p className="text-[11px] text-field-green font-semibold mt-1">
              {stats.matchedSchemeBenefit ? `${stats.matchedSchemeBenefit}` : ''}
            </p>
          </Link>
        </div>

        {/* 4 Big Tappable Action Tiles (Mobile-First) */}
        <div>
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">
            {t('farmer.dashboard.quickActions')}
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
