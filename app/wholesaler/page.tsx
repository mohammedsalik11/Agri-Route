'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { KisanBot } from '@/components/KisanBot';
import { useCart } from '@/lib/context/CartContext';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  Truck,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  MapPin,
  RefreshCw,
  Warehouse,
  Plus,
  Check,
} from 'lucide-react';

interface PoolLot {
  poolId: string;
  crop: string;
  qualityGrade: string;
  district: string;
  state?: string;
  currentKg: number;
  targetKg: number;
  farmerCount: number;
  poolPricePerKg: number; // in paise
  status: string;
}

interface IndividualListing {
  listingId: string;
  farmerName: string;
  crop: string;
  variety?: string;
  quantityKg: number;
  askPricePerKg: number; // in paise
  qualityGrade: string;
  district: string;
  state: string;
  status: string;
  createdAt: string;
  poolId?: string | null;
}

export default function WholesalerBrowsePage() {
  const { t, formatCurrency, formatWeight } = useT();
  const { count, addItem, hasItem } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'pools' | 'individual'>('pools');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [pools, setPools] = useState<PoolLot[]>([]);
  const [listings, setListings] = useState<IndividualListing[]>([]);
  const [liveRates, setLiveRates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; district: string; gstin?: string } | null>(null);

  const displayedPools = selectedState === 'ALL'
    ? pools
    : pools.filter((p) => p.state && p.state.toLowerCase() === selectedState.toLowerCase());

  const displayedListings = selectedState === 'ALL'
    ? listings
    : listings.filter((l) => l.state && l.state.toLowerCase() === selectedState.toLowerCase());

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, poolsRes, listingsRes, pricesRes] = await Promise.all([
        fetch('/api/me').then((res) => (res.ok ? res.json() : null)),
        fetch('/api/pools').then((res) => (res.ok ? res.json() : null)),
        fetch('/api/listings').then((res) => (res.ok ? res.json() : null)),
        fetch('/api/prices?crops=tomato,onion,potato,paddy,wheat,ragi,banana,maize').then((res) => (res.ok ? res.json() : null)),
      ]);

      if (meRes?.data) setProfile(meRes.data);
      if (poolsRes?.data && Array.isArray(poolsRes.data)) setPools(poolsRes.data);
      if (listingsRes?.data && Array.isArray(listingsRes.data)) setListings(listingsRes.data);
      if (pricesRes?.data?.crops) setLiveRates(pricesRes.data.crops);
    } catch (err) {
      console.error('Error loading wholesaler data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCropEmoji = (crop: string) => {
    const c = crop.toLowerCase();
    if (c.includes('tomato')) return '🍅';
    if (c.includes('onion')) return '🧅';
    if (c.includes('potato')) return '🥔';
    if (c.includes('banana')) return '🍌';
    if (c.includes('wheat')) return '🌾';
    if (c.includes('paddy') || c.includes('rice')) return '🌾';
    if (c.includes('maize')) return '🌽';
    return '📦';
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Wholesaler Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-earth/10 text-earth text-[11px] font-bold tracking-wide uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-earth" />
                {t('wholesaler.dashboard.title')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                Verified Buyer
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-ink mt-1.5 capitalize tracking-tight">
              {profile?.name || 'Wholesale Buyer'} {profile?.district ? `· ${profile.district}` : ''}
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Direct Farmer Sourcing · Zero Middlemen {profile?.gstin ? `· GSTIN: ${profile.gstin}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Cart badge */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-3.5 py-2.5 bg-earth/10 text-earth rounded-xl hover:bg-earth/20 transition-all font-bold text-xs flex items-center gap-1.5 min-h-[44px]"
              aria-label={`Cart (${count} items)`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {count > 0 && (
                <span className="w-5 h-5 bg-earth text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {count}
                </span>
              )}
            </button>
            <Link
              href="/wholesaler/storage"
              className="px-3.5 py-2.5 bg-white text-ink border border-border rounded-xl text-xs font-bold hover:bg-paper-well transition-all flex items-center gap-1.5 min-h-[44px]"
            >
              <Warehouse className="w-3.5 h-3.5 text-earth" />
              <span>Cold Storage</span>
            </Link>
            <Link
              href="/wholesaler/negotiations"
              className="px-3.5 py-2.5 bg-white text-earth border border-earth/40 rounded-xl text-xs font-bold hover:bg-earth/5 transition-all min-h-[44px] flex items-center"
            >
              <span>{t('farmer.dashboard.negotiationInbox')}</span>
            </Link>
            <Link
              href="/wholesaler/orders"
              className="px-4 py-2.5 bg-earth text-white rounded-xl text-xs font-bold hover:bg-earth-light transition-all flex items-center gap-1 shadow-xs min-h-[44px]"
            >
              <span>{t('wholesaler.orders')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Mandi Benchmark Strip */}
        {Object.keys(liveRates).length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-earth animate-pulse" />
                <span className="text-xs font-extrabold text-ink uppercase tracking-wider">
                  Live Agmarknet Mandi Benchmark (National &amp; State APMCs)
                </span>
              </div>
              <span className="text-[11px] text-ink-muted font-medium">Reference modal rates</span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
              {Object.entries(liveRates).map(([cropKey, info]: [string, any]) => (
                <Link
                  key={cropKey}
                  href={`/wholesaler/produce/${cropKey}`}
                  className="bg-paper-well hover:bg-earth/5 hover:border-earth/60 hover:shadow-xs px-4 py-3 rounded-2xl border border-border/80 shrink-0 min-w-[140px] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="capitalize font-bold text-ink group-hover:text-earth flex items-center gap-1 transition-colors">
                      <span className="text-base">{getCropEmoji(cropKey)}</span>
                      <span>{cropKey}</span>
                    </span>
                    <span className="text-[9px] font-bold text-earth bg-earth/10 px-1.5 py-0.5 rounded-md">
                      {info.dataSource || 'LIVE'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <div>
                      <span className="font-extrabold text-base text-ink font-mono group-hover:text-earth transition-colors">
                        ₹{((info.mandiModalPerKg || 0) / 100).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-ink-muted">/kg</span>
                    </div>
                    <span className="text-[9px] font-bold text-earth opacity-0 group-hover:opacity-100 transition-opacity">
                      View Lots →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tab & State Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Toggle */}
          <div className="flex bg-white p-1 rounded-2xl border border-border w-full sm:w-fit text-xs font-bold shadow-xs">
            <button
              onClick={() => setActiveTab('pools')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 min-h-[44px] ${
                activeTab === 'pools'
                  ? 'bg-earth text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{t('wholesaler.fullLots')} ({displayedPools.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 min-h-[44px] ${
                activeTab === 'individual'
                  ? 'bg-earth text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('wholesaler.individual')} ({displayedListings.length})</span>
            </button>
          </div>

          {/* State Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
            {['ALL', 'Karnataka', 'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Gujarat', 'Madhya Pradesh', 'Andhra Pradesh', 'Rajasthan'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`px-3 py-2 rounded-xl transition-all shrink-0 min-h-[40px] flex items-center ${
                  selectedState === st
                    ? 'bg-earth text-white shadow-xs'
                    : 'bg-white border border-border text-ink-muted hover:bg-paper hover:text-ink'
                }`}
              >
                {st === 'ALL' ? 'All India' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Value Proposition Callout */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4.5 flex items-start gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-900 text-sm">
              {t('wholesaler.dashboard.direct')} - {t('wholesaler.dashboard.bulkDiscount')}
            </p>
            <p className="text-amber-800 leading-relaxed">
              {t('wholesaler.dashboard.directDesc')}
            </p>
          </div>
        </div>

        {/* Lots Grid */}
        {activeTab === 'pools' && (
          loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-pulse bg-white rounded-2xl h-64 border border-border" />
              <div className="animate-pulse bg-white rounded-2xl h-64 border border-border" />
            </div>
          ) : displayedPools.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-border mt-2 space-y-2">
              <div className="w-12 h-12 rounded-full bg-earth/10 text-earth flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-ink">No active pooled lots at this moment</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                As farmers across India list their harvest, truckload lots are dynamically formed here with automated 2% bulk discounts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedPools.map((pool) => {
                const isReady = pool.status === 'ready' || pool.currentKg >= pool.targetKg;
                const totalAmount = pool.currentKg * pool.poolPricePerKg;

                return (
                  <div
                    key={pool.poolId}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-border hover:border-earth/70 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-2xl block mb-1">
                            {getCropEmoji(pool.crop)}
                          </span>
                          <h2 className="text-lg font-extrabold text-ink capitalize tracking-tight">
                            {pool.crop} Full Lot
                          </h2>
                          <p className="text-xs text-ink-muted capitalize mt-0.5">
                            Grade {pool.qualityGrade} · {pool.district}, {pool.state || 'India'} Hub
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                            isReady
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isReady ? t('wholesaler.lot.truckReady') : t('wholesaler.lot.collecting')}
                        </span>
                      </div>

                      <div className="bg-paper-well p-3.5 rounded-2xl space-y-2 text-xs border border-border/60">
                        <div className="flex justify-between text-ink-muted">
                          <span className="font-medium">{t('wholesaler.lot.totalWeight')}:</span>
                          <span className="font-extrabold text-ink font-mono">
                            {formatWeight(pool.currentKg)}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-muted">
                          <span className="font-medium">{t('wholesaler.lot.farmerCollective')}:</span>
                          <span className="font-bold text-field-green">
                            {pool.farmerCount} {t('wholesaler.lot.farmersPooled')}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline text-ink-muted pt-2 border-t border-border">
                          <span className="font-medium">{t('wholesaler.lot.pooledPrice')}:</span>
                          <span className="font-extrabold text-earth text-base font-mono">
                            {formatCurrency(pool.poolPricePerKg)} <span className="text-xs font-normal text-ink-muted">/ {t('common.kg')}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-ink-muted block uppercase font-bold tracking-wider">
                          {t('wholesaler.lot.lotTotal')}
                        </span>
                        <span className="text-lg font-extrabold text-ink font-mono">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            addItem({
                              sourceType: 'pool',
                              sourceId: pool.poolId,
                              crop: pool.crop,
                              qualityGrade: pool.qualityGrade,
                              district: pool.district,
                              quantityKg: pool.currentKg,
                              pricePerKgPaise: pool.poolPricePerKg,
                              farmerCount: pool.farmerCount,
                            });
                            setCartOpen(true);
                          }}
                          disabled={hasItem(pool.poolId)}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[44px] ${
                            hasItem(pool.poolId)
                              ? 'bg-field-green/10 text-field-green border border-field-green/30 cursor-default'
                              : 'bg-paper-well text-ink border border-border hover:bg-earth/10 hover:border-earth/40 active:scale-[0.98]'
                          }`}
                        >
                          {hasItem(pool.poolId) ? (
                            <><Check className="w-4 h-4" /> In Cart</>
                          ) : (
                            <><Plus className="w-4 h-4" /> Add to Cart</>
                          )}
                        </button>
                        <Link
                          href={`/wholesaler/lot/${pool.poolId}`}
                          className="px-4 py-2.5 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all flex items-center gap-1.5 shadow-xs min-h-[44px] active:scale-[0.98]"
                        >
                          <span>{t('wholesaler.lot.viewBreakdown')}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Individual Listings Tab */}
        {activeTab === 'individual' && (
          loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-pulse bg-white rounded-3xl h-52 border border-border" />
              <div className="animate-pulse bg-white rounded-3xl h-52 border border-border" />
            </div>
          ) : displayedListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-border space-y-2">
              <div className="w-12 h-12 rounded-full bg-earth/10 text-earth flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-ink">No individual listings available</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                All individual farmer harvests listed on the marketplace appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedListings.map((l) => {
                const totalPaise = (l.quantityKg || 0) * (l.askPricePerKg || 0);
                return (
                  <div
                    key={l.listingId}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-border hover:border-earth/70 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-2xl block mb-1">
                            {getCropEmoji(l.crop)}
                          </span>
                          <h2 className="text-lg font-extrabold text-ink capitalize tracking-tight">
                            {l.crop} {l.variety ? `· ${l.variety}` : ''}
                          </h2>
                          <p className="text-xs text-ink-muted capitalize mt-0.5">
                            Grown by <span className="font-semibold text-ink">{l.farmerName}</span>
                          </p>
                        </div>

                        <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-field-green/10 text-field-green border border-field-green/20">
                          Grade {l.qualityGrade}
                        </span>
                      </div>

                      <div className="bg-paper-well p-3.5 rounded-2xl space-y-2 text-xs border border-border/60">
                        <div className="flex justify-between text-ink-muted">
                          <span className="font-medium">Quantity:</span>
                          <span className="font-extrabold text-ink font-mono">{formatWeight(l.quantityKg)}</span>
                        </div>
                        <div className="flex justify-between text-ink-muted">
                          <span className="font-medium">Location:</span>
                          <span className="font-semibold text-ink capitalize flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                            {l.district}, {l.state}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline text-ink-muted pt-2 border-t border-border">
                          <span className="font-medium">Ask Price:</span>
                          <span className="font-extrabold text-earth text-base font-mono">
                            {formatCurrency(l.askPricePerKg)} <span className="text-xs font-normal text-ink-muted">/ kg</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-ink-muted block uppercase font-bold tracking-wider">
                          Total Value
                        </span>
                        <span className="text-lg font-extrabold text-ink font-mono">
                          {formatCurrency(totalPaise)}
                        </span>
                      </div>

                      {l.poolId ? (
                        <Link
                          href={`/wholesaler/lot/${l.poolId}`}
                          className="px-4 py-2.5 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all flex items-center gap-1.5 shadow-xs min-h-[44px] active:scale-[0.98]"
                        >
                          <span>View in Pool Lot</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            addItem({
                              sourceType: 'listing',
                              sourceId: l.listingId,
                              crop: l.crop,
                              qualityGrade: l.qualityGrade,
                              district: l.district,
                              quantityKg: l.quantityKg,
                              pricePerKgPaise: l.askPricePerKg,
                            });
                            setCartOpen(true);
                          }}
                          disabled={hasItem(l.listingId)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[44px] active:scale-[0.98] ${
                            hasItem(l.listingId)
                              ? 'bg-field-green/10 text-field-green border border-field-green/30 cursor-default'
                              : 'bg-earth text-white hover:bg-earth-light shadow-xs'
                          }`}
                        >
                          {hasItem(l.listingId) ? (
                            <><Check className="w-4 h-4" /> In Cart</>
                          ) : (
                            <><Plus className="w-4 h-4" /> Add to Cart</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
      <KisanBot userRole="wholesaler" />
    </div>
  );
}
