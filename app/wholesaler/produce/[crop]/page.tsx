'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { PoolProgressBar } from '@/components/PoolProgressBar';
import { CartDrawer } from '@/components/CartDrawer';
import { useCart } from '@/lib/context/CartContext';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  ArrowLeft,
  Filter,
  ShoppingCart,
  Plus,
  Check,
  Sparkles,
  Users,
  MapPin,
  Clock,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface VarietyPrice {
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  market?: string;
}

interface PriceInfo {
  crop: string;
  mandiModalPerKg: number;
  mandiMinPerKg: number;
  mandiMaxPerKg: number;
  mspPerKg: number | null;
  mandiDate: string;
  mandiMarket: string;
  dataSource: string;
  varieties?: VarietyPrice[];
}

interface PoolItem {
  poolId: string;
  crop: string;
  qualityGrade: 'A' | 'B' | 'C';
  district: string;
  targetKg: number;
  currentKg: number;
  farmerCount: number;
  poolPricePerKg: number;
  status: 'open' | 'ready' | 'locked' | 'sold' | 'expired';
  windowEnd?: string;
  members?: Array<{ farmerName: string; quantityKg: number; qualityGrade: string }>;
}

interface ListingItem {
  listingId: string;
  farmerName: string;
  crop: string;
  variety?: string;
  quantityKg: number;
  askPricePerKg: number;
  qualityGrade: 'A' | 'B' | 'C';
  gradeSource: 'ai' | 'self-declared';
  district: string;
  status: string;
  createdAt: string;
}

const CROP_EMOJIS: Record<string, string> = {
  tomato: '🍅',
  onion: '🧅',
  potato: '🥔',
  paddy: '🌾',
  wheat: '🌾',
  ragi: '🌱',
  maize: '🌽',
  banana: '🍌',
  brinjal: '🍆',
  cabbage: '🥬',
  cauliflower: '🥦',
  groundnut: '🥜',
  soybean: '🫘',
  sugarcane: '🎋',
  cotton: '🧶',
};

export default function VegetableLotsPage() {
  const { t, formatCurrency, formatWeight } = useT();
  const router = useRouter();
  const params = useParams();
  const cropParam = (params?.crop as string)?.toLowerCase() || 'tomato';

  const { addItem, hasItem, count } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [viewTab, setViewTab] = useState<'all' | 'pools' | 'individual'>('all');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/prices?crop=${cropParam}&district=Mandya`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/pools?crop=${cropParam}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/listings?crop=${cropParam}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([priceRes, poolsRes, listRes]) => {
        if (priceRes?.ok && priceRes.data) {
          setPriceInfo(priceRes.data);
        }
        if (poolsRes?.ok && Array.isArray(poolsRes.data)) {
          setPools(poolsRes.data.filter((p: PoolItem) => p.status === 'open' || p.status === 'ready'));
        }
        if (listRes?.ok && Array.isArray(listRes.data)) {
          setListings(listRes.data.filter((l: ListingItem) => l.status === 'available'));
        }
      })
      .catch((err) => console.error('Error fetching vegetable lots data:', err))
      .finally(() => setLoading(false));
  }, [cropParam]);

  // Extract all available variety names from price info + listings
  const availableVarieties = useMemo(() => {
    const set = new Set<string>();
    if (priceInfo?.varieties && Array.isArray(priceInfo.varieties)) {
      priceInfo.varieties.forEach((v) => {
        if (v.variety) set.add(v.variety);
      });
    }
    listings.forEach((l) => {
      if (l.variety) set.add(l.variety);
    });
    return Array.from(set);
  }, [priceInfo, listings]);

  // Filtered listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (selectedGrade !== 'all' && l.qualityGrade !== selectedGrade) return false;
      if (selectedVariety !== 'all' && (l.variety || '').toLowerCase() !== selectedVariety.toLowerCase()) return false;
      return true;
    });
  }, [listings, selectedGrade, selectedVariety]);

  // Filtered pools
  const filteredPools = useMemo(() => {
    return pools.filter((p) => {
      if (selectedGrade !== 'all' && p.qualityGrade !== selectedGrade) return false;
      return true;
    });
  }, [pools, selectedGrade]);

  const emoji = CROP_EMOJIS[cropParam] || '📦';
  const agmarknetUrl = `https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=0&Tx_State=0&Tx_District=0&Tx_Market=0&DateFrom=&DateTo=&Fr_Date=&To_Date=&Tx_Comm=&Tx_State1=&Tx_District1=&Tx_Market1=&Tx_Comm1=${encodeURIComponent(cropParam)}`;

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/wholesaler"
              className="p-2 rounded-xl bg-white border border-border text-ink hover:bg-paper transition-colors"
              aria-label="Back to Marketplace"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-xs font-bold text-earth uppercase tracking-wider flex items-center gap-1">
                <span>Commodity Lots</span>
                <span>·</span>
                <span>Live Agmarknet Benchmark</span>
              </span>
              <h1 className="text-2xl font-extrabold text-ink capitalize flex items-center gap-2">
                <span>{emoji}</span>
                <span>{cropParam} Produce Lots</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-4 py-2.5 bg-earth text-white rounded-xl text-xs font-bold hover:bg-earth-light transition-all flex items-center gap-2 shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart ({count})</span>
            </button>
          </div>
        </div>

        {/* Live Mandi Benchmark & Variety Bar */}
        {priceInfo && (
          <div className="bg-gradient-to-br from-[#1e3d2f] to-[#12281e] text-white rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-200">
                    Live APMC Mandi Benchmark ({priceInfo.mandiMarket || 'Karnataka'})
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    ₹{(priceInfo.mandiModalPerKg / 100).toFixed(1)}
                  </span>
                  <span className="text-xs text-emerald-200 font-normal">/kg Modal Rate</span>
                  <span className="text-xs text-white/60 ml-2">
                    (₹{(priceInfo.mandiMinPerKg / 100).toFixed(0)} – ₹{(priceInfo.mandiMaxPerKg / 100).toFixed(0)} range)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {priceInfo.mspPerKg && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-xl font-bold">
                    MSP: ₹{(priceInfo.mspPerKg / 100).toFixed(1)}/kg
                  </span>
                )}
                <a
                  href={agmarknetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl flex items-center gap-1 border border-white/20 transition-colors"
                >
                  <span>Agmarknet Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Variety Subcategory Chips */}
            {priceInfo.varieties && priceInfo.varieties.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-semibold text-emerald-200 block uppercase tracking-wider">
                  Mandi Variety Subcategories
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedVariety('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedVariety === 'all'
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    All Varieties
                  </button>
                  {priceInfo.varieties.map((v) => (
                    <button
                      key={v.variety}
                      onClick={() => setSelectedVariety(v.variety)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        selectedVariety.toLowerCase() === v.variety.toLowerCase()
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      <span>{v.variety}</span>
                      <span className="text-[10px] opacity-80 font-mono">
                        ₹{(v.modalPrice / 100).toFixed(1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View & Grade Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center gap-1 bg-paper p-1 rounded-xl border border-border text-xs font-bold">
            <button
              onClick={() => setViewTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewTab === 'all' ? 'bg-white text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              All Produce ({filteredPools.length + filteredListings.length})
            </button>
            <button
              onClick={() => setViewTab('pools')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewTab === 'pools' ? 'bg-white text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-earth" />
              <span>Full Lots ({filteredPools.length})</span>
            </button>
            <button
              onClick={() => setViewTab('individual')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewTab === 'individual' ? 'bg-white text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Individual ({filteredListings.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-muted flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Grade:
            </span>
            <div className="flex gap-1 text-xs font-bold">
              {(['all', 'A', 'B', 'C'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    selectedGrade === g
                      ? 'bg-earth text-white border-earth'
                      : 'bg-paper text-ink border-border hover:bg-white'
                  }`}
                >
                  {g === 'all' ? 'All' : `Grade ${g}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-earth" />
            <p className="text-xs font-semibold text-ink-muted">Loading available {cropParam} lots...</p>
          </div>
        ) : filteredPools.length === 0 && filteredListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-border space-y-3">
            <span className="text-4xl block">{emoji}</span>
            <h3 className="font-bold text-base text-ink">No {cropParam} Lots Available Right Now</h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              There are currently no active pooled truckloads or individual listings matching your filters for {cropParam}. Check back soon or browse other commodities.
            </p>
            <div className="pt-2">
              <Link
                href="/wholesaler"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Browse All Commodities</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Pooled Wholesale Lots */}
            {(viewTab === 'all' || viewTab === 'pools') && filteredPools.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-earth" />
                  <span>Pooled Truckload Lots ({filteredPools.length})</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPools.map((pool) => {
                    const isFull = pool.currentKg >= pool.targetKg;
                    const inCart = hasItem(pool.poolId);

                    return (
                      <div
                        key={pool.poolId}
                        className="bg-white rounded-2xl p-5 border-2 border-border hover:border-earth/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{emoji}</span>
                              <div>
                                <span className="text-xs font-mono text-ink-muted uppercase block">
                                  Lot #{pool.poolId.slice(-6)}
                                </span>
                                <h3 className="text-base font-bold text-ink capitalize">
                                  {pool.crop} · Grade {pool.qualityGrade}
                                </h3>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isFull ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isFull ? 'Truckload Ready' : 'Aggregating'}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <PoolProgressBar
                            crop={pool.crop}
                            qualityGrade={pool.qualityGrade}
                            district={pool.district}
                            currentKg={pool.currentKg}
                            targetKg={pool.targetKg}
                            farmerCount={pool.farmerCount}
                            poolPricePerKg={pool.poolPricePerKg}
                            status={pool.status}
                            showActionButton={false}
                          />

                          <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                            <span className="text-ink-muted flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-earth" />
                              {pool.district} Collective
                            </span>
                            <div className="text-right">
                              <span className="text-[10px] text-ink-muted block">Pooled Price</span>
                              <span className="text-sm font-extrabold text-earth font-mono">
                                {formatCurrency(pool.poolPricePerKg)}/kg
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
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
                            }}
                            disabled={inCart}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                              inCart
                                ? 'bg-field-green/10 text-field-green border-field-green/30'
                                : 'bg-paper text-ink border-border hover:bg-earth/5 hover:border-earth'
                            }`}
                          >
                            {inCart ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>In Cart</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>

                          <Link
                            href={`/wholesaler/lot/${pool.poolId}`}
                            className="flex-[1.5] py-2.5 px-4 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>Inspect &amp; Buy Lot</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Individual Farmer Listings */}
            {(viewTab === 'all' || viewTab === 'individual') && filteredListings.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-field-green" />
                  <span>Individual Farmer Listings ({filteredListings.length})</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredListings.map((listing) => {
                    const inCart = hasItem(listing.listingId);

                    return (
                      <div
                        key={listing.listingId}
                        className="bg-white rounded-2xl p-5 border border-border hover:border-field-green/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{emoji}</span>
                              <div>
                                <h3 className="font-bold text-sm text-ink capitalize">
                                  {listing.farmerName} · {listing.crop}
                                </h3>
                                {listing.variety && (
                                  <span className="text-[11px] font-semibold text-field-green">
                                    Variety: {listing.variety}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] bg-paper px-2 py-0.5 rounded-full font-bold text-ink-muted border border-border">
                              Grade {listing.qualityGrade}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-paper p-2.5 rounded-xl text-xs">
                            <div>
                              <span className="text-[10px] text-ink-muted block">Available Qty</span>
                              <span className="font-bold text-ink">
                                {formatWeight(listing.quantityKg)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-ink-muted block">Ask Price</span>
                              <span className="font-extrabold text-field-green font-mono">
                                {formatCurrency(listing.askPricePerKg)}/kg
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-ink-muted">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-earth" />
                              {listing.district}
                            </span>
                            <span className="text-emerald-700 font-medium">
                              {listing.gradeSource === 'ai' ? '🤖 AI Quality Assayed' : '✏️ Self-Declared'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border flex gap-2">
                          <button
                            onClick={() => {
                              addItem({
                                sourceType: 'listing',
                                sourceId: listing.listingId,
                                crop: listing.crop,
                                qualityGrade: listing.qualityGrade,
                                district: listing.district,
                                quantityKg: listing.quantityKg,
                                pricePerKgPaise: listing.askPricePerKg,
                              });
                            }}
                            disabled={inCart}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                              inCart
                                ? 'bg-field-green/10 text-field-green border-field-green/30'
                                : 'bg-earth text-white border-earth hover:bg-earth-light'
                            }`}
                          >
                            {inCart ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>In Cart</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Cart ({formatCurrency(listing.askPricePerKg * listing.quantityKg)})</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
