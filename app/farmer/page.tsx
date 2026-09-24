'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { KisanBot } from '@/components/KisanBot';
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
  state?: string;
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

          const district = me.district || 'Mandya';
          const state = me.state || 'Karnataka';
          const primaryCrop = me.primaryCrops?.[0] || 'tomato';

          fetch(`/api/prices?crops=tomato,onion,potato,paddy,wheat,ragi,maize,banana&state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`)
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
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome & Persona Banner */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-field-green/10 text-field-green text-[11px] font-bold tracking-wide uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-field-green" />
                {t('farmer.sub.agristackFarmer')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                {t('onboarding.verified')}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-ink capitalize tracking-tight">
              {t('farmer.dashboard.welcome')}, {profile?.name || 'Farmer'} 🌾
            </h1>
            {profile && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-ink-muted">
                <span className="font-semibold text-ink capitalize">{profile.district}</span>
                {profile.village && <span>• {profile.village}</span>}
                {profile.landSizeAcres && (
                  <span className="bg-paper px-2 py-0.5 rounded-md border border-border/80 font-medium">
                    {profile.landSizeAcres} {t('common.acres')}
                  </span>
                )}
                {profile.primaryCrops && profile.primaryCrops.length > 0 && (
                  <span className="text-field-green font-semibold">
                    • {profile.primaryCrops.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/farmer/verification"
              className="px-3.5 py-2.5 bg-white text-field-green border border-field-green/30 rounded-xl text-xs font-bold hover:bg-field-green/10 flex items-center gap-1.5 shadow-xs transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-field-green" />
              <span>{t('verification.title')}</span>
            </Link>
            <Link
              href="/farmer/list"
              className="px-4 py-2.5 bg-field-green text-white rounded-xl text-xs font-bold hover:bg-field-green-light flex items-center gap-1.5 shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>{t('farmer.dashboard.listProduce')}</span>
            </Link>
          </div>
        </div>

        {/* Hero Rate Highlight Card with Wave Aesthetic & Price-vs-MSP Gauge */}
        <div className="agri-hero-wave rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden border border-emerald-700/40">
          {/* Subtle wave contours inspired by the brand identity asset */}
          <svg className="absolute -top-10 -left-10 w-96 h-96 opacity-40 pointer-events-none" viewBox="0 0 400 400" fill="none">
            <path d="M-20 100 C 60 40, 160 180, 280 80 C 360 10, 420 40, 460 20" stroke="#84cc16" strokeWidth="2" strokeOpacity="0.7" fill="none" />
            <path d="M-20 140 C 70 70, 180 220, 310 110" stroke="#4ade80" strokeWidth="1" strokeOpacity="0.4" fill="none" />
          </svg>
          <svg className="absolute -bottom-16 -right-16 w-96 h-96 opacity-35 pointer-events-none" viewBox="0 0 400 400" fill="none">
            <path d="M0 320 C 120 280, 220 380, 340 300 C 400 260, 450 310, 480 340" stroke="#84cc16" strokeWidth="2" strokeOpacity="0.6" fill="none" />
          </svg>

          {/* Micro dot matrix accents in top right and bottom left */}
          <div className="absolute top-4 right-5 grid grid-cols-4 gap-1.5 opacity-20 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-luminous-lime animate-pulse ring-4 ring-lime-400/20" />
              <span className="text-xs font-bold text-white/95 uppercase tracking-wider capitalize">
                {t('farmer.dashboard.todayRate')} · {rateData.crop} ({profile?.district ? `${profile.district} APMC` : `${profile?.state || 'National'} APMC`})
              </span>
            </div>
            <DataSourceBadge source={rateData.source} date={rateData.date} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 my-2 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                ₹{(rateData.modalPrice / 100).toFixed(1)}
              </span>
              <span className="text-sm text-emerald-100/80 font-medium">/ {t('common.kg')}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 font-semibold backdrop-blur-xs">
                {t('farmer.dashboard.range')}: <strong className="text-white">₹{(rateData.minPrice / 100).toFixed(0)}</strong> - <strong className="text-white">₹{(rateData.maxPrice / 100).toFixed(0)}</strong>
              </span>
              <span className="text-luminous-lime font-bold flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs border border-lime-400/20">
                <TrendingUp className="w-3.5 h-3.5" /> +4.2% {t('farmer.dashboard.weeklyTrend')}
              </span>
            </div>
          </div>

          {/* Integrated Price-vs-MSP Visual Gauge */}
          <div className="mt-5 pt-4 border-t border-white/15 relative z-10">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold flex items-center gap-1.5 text-white/90">
                <TrendingUp className="w-3.5 h-3.5 text-luminous-lime" />
                <span>{t('farmer.gauge.title')}</span>
              </span>
              <span className="text-[11px] font-bold text-luminous-lime bg-white/10 px-2.5 py-0.5 rounded-full border border-lime-400/30">
                +14% {t('farmer.gauge.profit')}
              </span>
            </div>

            {/* 3-Zone Visual Gauge Bar */}
            <div className="relative pt-3 pb-1">
              <div className="h-3 w-full rounded-full bg-black/40 overflow-hidden flex p-0.5 gap-0.5 border border-white/20">
                <div className="w-1/4 h-full rounded-l-full bg-gradient-to-r from-rose-500 to-amber-500 opacity-80" />
                <div className="w-2/5 h-full bg-gradient-to-r from-amber-500 to-emerald-500 opacity-90" />
                <div className="flex-1 h-full rounded-r-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400" />
              </div>

              {/* Dynamic needle marker pointing to Fair Direct Price */}
              <div className="absolute top-0 right-[15%] -translate-x-1/2 flex flex-col items-center">
                <span className="text-[10px] font-black text-lime-300 font-mono bg-emerald-950/95 border border-lime-400/70 px-1.5 py-0.5 rounded shadow-xs">
                  ₹{((rateData.modalPrice > 0 ? rateData.modalPrice * 1.14 : 2600) / 100).toFixed(1)}
                </span>
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-lime-300" />
              </div>

              {/* Labels below gauge */}
              <div className="flex justify-between items-center text-[10px] font-bold text-white/80 mt-2 px-1">
                <span className="text-rose-300">{t('farmer.gauge.distress')} (₹{(rateData.minPrice / 100).toFixed(0)})</span>
                <span className="text-amber-200">{t('farmer.gauge.mandi')} (₹{(rateData.modalPrice / 100).toFixed(0)})</span>
                <span className="text-lime-300 font-extrabold">{t('farmer.gauge.fair')} (₹{((rateData.modalPrice > 0 ? rateData.modalPrice * 1.14 : 2600) / 100).toFixed(1)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Multi-Crop Mandi Benchmark Ticker */}
        {Object.keys(multiCropRates).length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-border shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-field-green animate-pulse" />
                <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider">
                  {t('farmer.sub.mandiBenchmark')} ({profile?.district || profile?.state || 'National'})
                </h3>
              </div>
              <span className="text-[11px] text-ink-muted font-medium">{t('farmer.sub.tapCrop')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between active:scale-[0.98] ${
                      isSelected
                        ? 'border-field-green bg-emerald-50/70 ring-2 ring-field-green/20 shadow-xs'
                        : 'border-border bg-white hover:border-field-green/50 hover:bg-paper-well'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink capitalize flex items-center gap-1.5">
                        <span className="text-base">{emojis[cropKey] || '📦'}</span>
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

                    <div className="mt-2.5">
                      <span className="text-base font-extrabold text-ink font-mono block leading-tight">
                        ₹{((info.mandiModalPerKg || 0) / 100).toFixed(1)}
                        <span className="text-[10px] text-ink-muted font-normal ml-0.5">/kg</span>
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
                      className="mt-2 text-[10px] text-field-green font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      Agmarknet ↗
                    </a>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Active Listings / Pooled Quantity */}
          <Link
            href="/farmer/pools"
            className="bg-white rounded-2xl p-5 border border-border hover:border-field-green hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">{t('farmer.dashboard.myPool')}</span>
              <div className="w-8 h-8 rounded-xl bg-earth/10 text-earth flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-ink tracking-tight">
              {formatWeight(stats.pooledQuantityKg)}
            </p>
            <p className="text-xs text-field-green font-bold mt-1.5 flex items-center gap-1">
              <span>{stats.activeListingsCount > 0 ? `${stats.activeListingsCount} ${t('farmer.dashboard.activeListings')}` : t('common.noData')}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </Link>

          {/* Escrow in Flight */}
          <Link
            href="/farmer/orders"
            className="bg-white rounded-2xl p-5 border border-border hover:border-field-green hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">{t('farmer.dashboard.earnings')}</span>
              <div className="w-8 h-8 rounded-xl bg-field-green/10 text-field-green flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-ink tracking-tight">
              {formatCurrency(stats.escrowInFlightPaise)}
            </p>
            <p className="text-xs text-amber-700 font-bold mt-1.5 flex items-center gap-1">
              <span>{stats.escrowInFlightPaise > 0 ? t('farmer.dashboard.escrowHold') : t('common.noData')}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </Link>

          {/* Matched Scheme */}
          <Link
            href="/farmer/schemes"
            className="bg-white rounded-2xl p-5 border border-border hover:border-field-green hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">{t('farmer.dashboard.matchedScheme')}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-base font-extrabold text-ink truncate">
              {stats.matchedSchemeName || t('common.noData')}
            </p>
            <p className="text-xs text-field-green font-bold mt-1.5 truncate">
              {stats.matchedSchemeBenefit ? `${stats.matchedSchemeBenefit}` : `${t('schemes.title')} →`}
            </p>
          </Link>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-ink uppercase tracking-wider">
              {t('farmer.dashboard.quickActions')}
            </h2>
            <span className="text-[11px] text-ink-muted font-medium">{t('farmer.sub.coreTools')}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href="/farmer/list"
              className="bg-white rounded-2xl p-4 border border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-xl bg-field-green/10 text-field-green flex items-center justify-center group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink text-sm block">
                    {t('farmer.dashboard.listProduce')}
                  </span>
                  <span className="text-[11px] text-ink-muted">{t('farmer.sub.aiGraded')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-field-green transition-colors" />
              </div>
            </Link>

            <Link
              href="/farmer/pools"
              className="bg-white rounded-2xl p-4 border border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-xl bg-earth/10 text-earth flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink text-sm block">
                    {t('farmer.dashboard.viewPools')}
                  </span>
                  <span className="text-[11px] text-ink-muted">{t('farmer.sub.bulkLots')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-earth transition-colors" />
              </div>
            </Link>

            <Link
              href="/farmer/storage"
              className="bg-white rounded-2xl p-4 border border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Warehouse className="w-5 h-5" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink text-sm block">
                    {t('farmer.dashboard.coldStorage')}
                  </span>
                  <span className="text-[11px] text-ink-muted">{t('farmer.sub.holdVsSell')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-blue-700 transition-colors" />
              </div>
            </Link>

            <Link
              href="/farmer/earnings"
              className="bg-white rounded-2xl p-4 border border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink text-sm block">
                    {t('farmer.dashboard.myEarnings')}
                  </span>
                  <span className="text-[11px] text-ink-muted">{t('farmer.sub.payoutBreakdown')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-amber-700 transition-colors" />
              </div>
            </Link>

            <Link
              href="/farmer/negotiations"
              className="bg-white rounded-2xl p-4 border border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink text-sm block">
                    {t('farmer.dashboard.negotiationInbox')}
                  </span>
                  <span className="text-[11px] text-ink-muted">{t('farmer.sub.buyerOffers')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-purple-700 transition-colors" />
              </div>
            </Link>

            <Link
              href="/farmer/verification"
              className="bg-white rounded-2xl p-4 border border-border hover:border-field-green hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink text-sm block">
                    {t('verification.title')}
                  </span>
                  <span className="text-[11px] text-ink-muted">{t('farmer.sub.scheduleVisit')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-emerald-800 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

      </main>
      <KisanBot userRole="farmer" />
    </div>
  );
}
