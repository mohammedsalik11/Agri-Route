'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
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
  const [pools, setPools] = useState<PoolLot[]>([]);
  const [listings, setListings] = useState<IndividualListing[]>([]);
  const [liveRates, setLiveRates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; district: string; gstin?: string } | null>(null);

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

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Wholesaler Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-5 border border-border">
          <div>
            <span className="text-xs font-semibold text-earth uppercase tracking-wide">
              {t('wholesaler.dashboard.title')}
            </span>
            <h1 className="text-xl font-bold text-ink mt-0.5 capitalize">
              {profile?.name || 'Wholesale Buyer'} {profile?.district ? `· ${profile.district}` : ''}
            </h1>
            <p className="text-xs text-ink-muted">
              {t('wholesaler.dashboard.verified')} {profile?.gstin ? `· GSTIN: ${profile.gstin}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Cart badge */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 bg-earth/10 text-earth rounded-xl hover:bg-earth/20 transition-colors"
              aria-label={`Cart (${count} items)`}
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] bg-earth text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {count}
                </span>
              )}
            </button>
            <Link
              href="/wholesaler/storage"
              className="px-3.5 py-2 bg-white text-ink border border-border rounded-xl text-xs font-bold hover:bg-paper transition-all flex items-center gap-1.5"
            >
              <Warehouse className="w-3.5 h-3.5 text-earth" />
              <span>Cold Storage</span>
            </Link>
            <Link
              href="/wholesaler/negotiations"
              className="px-3.5 py-2 bg-white text-earth border border-earth/40 rounded-xl text-xs font-bold hover:bg-earth/5 transition-all"
            >
              <span>{t('farmer.dashboard.negotiationInbox')}</span>
            </Link>
            <Link
              href="/wholesaler/orders"
              className="px-3.5 py-2 bg-earth text-white rounded-xl text-xs font-bold hover:bg-earth-light transition-all flex items-center gap-1"
            >
              <span>{t('wholesaler.orders')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Mandi Benchmark Strip */}
        {Object.keys(liveRates).length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-earth animate-pulse" />
                <span className="text-xs font-bold text-ink uppercase tracking-wider">
                  Live Agmarknet Mandi Benchmark (Karnataka APMCs)
                </span>
              </div>
              <span className="text-[10px] text-ink-muted">Reference modal rates</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {Object.entries(liveRates).map(([cropKey, info]: [string, any]) => (
                <Link
                  key={cropKey}
                  href={`/wholesaler/produce/${cropKey}`}
                  className="bg-paper hover:bg-earth/5 hover:border-earth/60 hover:shadow-xs px-3.5 py-2.5 rounded-xl border border-border/80 shrink-0 min-w-[130px] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="capitalize font-bold text-ink group-hover:text-earth flex items-center gap-1 transition-colors">
                      <span>{getCropEmoji(cropKey)}</span>
                      <span>{cropKey}</span>
                    </span>
                    <span className="text-[9px] font-bold text-earth bg-earth/10 px-1.5 py-0.5 rounded-md">
                      {info.dataSource || 'LIVE'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-ink font-mono group-hover:text-earth transition-colors">
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

        {/* Tab Toggle */}
        <div className="flex bg-white p-1 rounded-xl border border-border w-full sm:w-fit text-xs font-bold">
          <button
            onClick={() => setActiveTab('pools')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pools'
                ? 'bg-earth text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{t('wholesaler.fullLots')} ({pools.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'individual'
                ? 'bg-earth text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('wholesaler.individual')} ({listings.length})</span>
          </button>
        </div>

        {/* Value Proposition Callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-900 text-sm">
              {t('wholesaler.dashboard.direct')} - {t('wholesaler.dashboard.bulkDiscount')}
            </p>
            <p className="text-amber-800">
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
          ) : pools.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-border mt-2 space-y-2">
              <div className="w-12 h-12 rounded-full bg-earth/10 text-earth flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-ink">No active pooled lots at this moment</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                As farmers in Karnataka list their harvest, truckload lots are dynamically formed here with automated 2% bulk discounts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pools.map((pool) => {
                const isReady = pool.status === 'ready' || pool.currentKg >= pool.targetKg;
                const totalAmount = pool.currentKg * pool.poolPricePerKg;

                return (
                  <div
                    key={pool.poolId}
                    className="bg-white rounded-2xl p-5 border-2 border-border hover:border-earth hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-2xl block mb-1">
                            {getCropEmoji(pool.crop)}
                          </span>
                          <h2 className="text-lg font-bold text-ink capitalize">
                            {pool.crop} Lot
                          </h2>
                          <p className="text-xs text-ink-muted capitalize">
                            Grade {pool.qualityGrade} · {pool.district} Aggregation Hub
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isReady
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isReady ? t('wholesaler.lot.truckReady') : t('wholesaler.lot.collecting')}
                        </span>
                      </div>

                      <div className="bg-paper p-3 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between text-ink-muted">
                          <span>{t('wholesaler.lot.totalWeight')}:</span>
                          <span className="font-bold text-ink">
                            {formatWeight(pool.currentKg)}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-muted">
                          <span>{t('wholesaler.lot.farmerCollective')}:</span>
                          <span className="font-bold text-field-green">
                            {pool.farmerCount} {t('wholesaler.lot.farmersPooled')}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-muted pt-1 border-t border-border-light">
                          <span>{t('wholesaler.lot.pooledPrice')}:</span>
                          <span className="font-bold text-earth text-sm">
                            {formatCurrency(pool.poolPricePerKg)} / {t('common.kg')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border-light flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-ink-muted block uppercase font-bold">
                          {t('wholesaler.lot.lotTotal')}
                        </span>
                        <span className="text-base font-extrabold text-ink">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
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
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            hasItem(pool.poolId)
                              ? 'bg-field-green/10 text-field-green border border-field-green/30 cursor-default'
                              : 'bg-paper text-ink border border-border hover:bg-earth/5 hover:border-earth/30'
                          }`}
                        >
                          {hasItem(pool.poolId) ? (
                            <><Check className="w-3.5 h-3.5" /> In Cart</>
                          ) : (
                            <><Plus className="w-3.5 h-3.5" /> Add to Cart</>
                          )}
                        </button>
                        <Link
                          href={`/wholesaler/lot/${pool.poolId}`}
                          className="px-4 py-2.5 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <span>{t('wholesaler.lot.viewBreakdown')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
              <div className="animate-pulse bg-white rounded-2xl h-52 border border-border" />
              <div className="animate-pulse bg-white rounded-2xl h-52 border border-border" />
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-border space-y-2">
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
              {listings.map((l) => {
                const totalPaise = (l.quantityKg || 0) * (l.askPricePerKg || 0);
                return (
                  <div
                    key={l.listingId}
                    className="bg-white rounded-2xl p-5 border-2 border-border hover:border-earth hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-2xl block mb-1">
                            {getCropEmoji(l.crop)}
                          </span>
                          <h2 className="text-lg font-bold text-ink capitalize">
                            {l.crop} {l.variety ? `· ${l.variety}` : ''}
                          </h2>
                          <p className="text-xs text-ink-muted capitalize">
                            Grown by <span className="font-semibold text-ink">{l.farmerName}</span>
                          </p>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-field-green/10 text-field-green border border-field-green/20">
                          Grade {l.qualityGrade}
                        </span>
                      </div>

                      <div className="bg-paper p-3 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between text-ink-muted">
                          <span>Quantity:</span>
                          <span className="font-bold text-ink">{formatWeight(l.quantityKg)}</span>
                        </div>
                        <div className="flex justify-between text-ink-muted">
                          <span>Location:</span>
                          <span className="font-semibold text-ink capitalize flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-ink-muted" />
                            {l.district}, {l.state}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-muted pt-1 border-t border-border-light">
                          <span>Ask Price:</span>
                          <span className="font-bold text-earth text-sm">
                            {formatCurrency(l.askPricePerKg)} / kg
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-ink-muted block uppercase font-bold">
                          Total Value
                        </span>
                        <span className="text-base font-extrabold text-ink">
                          {formatCurrency(totalPaise)}
                        </span>
                      </div>

                      {l.poolId ? (
                        <Link
                          href={`/wholesaler/lot/${l.poolId}`}
                          className="px-4 py-2 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all flex items-center gap-1 shadow-xs"
                        >
                          <span>View in Pool Lot</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            hasItem(l.listingId)
                              ? 'bg-field-green/10 text-field-green border border-field-green/30 cursor-default'
                              : 'bg-earth text-white hover:bg-earth-light shadow-xs'
                          }`}
                        >
                          {hasItem(l.listingId) ? (
                            <><Check className="w-3.5 h-3.5" /> In Cart</>
                          ) : (
                            <><Plus className="w-3.5 h-3.5" /> Add to Cart</>
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
    </div>
  );
}
