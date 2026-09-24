'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { PoolProgressBar } from '@/components/PoolProgressBar';
import { useT } from '@/lib/i18n/LanguageProvider';
import { Truck, MapPin, Plus, Sparkles, RefreshCw, Users } from 'lucide-react';

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
  windowEnd: string;
  centroid?: { lat: number; lng: number };
}

export default function FarmerPoolsPage() {
  const { t, formatCurrency, formatWeight } = useT();
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [userDistrict, setUserDistrict] = useState<string>('All India');
  const [loading, setLoading] = useState(true);

  const fetchPools = async () => {
    setLoading(true);
    try {
      const [meRes, poolsRes, listingsRes] = await Promise.all([
        fetch('/api/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/pools').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/listings').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (meRes?.data) {
        setUserDistrict(
          meRes.data.district
            ? `${meRes.data.district}, ${meRes.data.state || 'India'}`
            : (meRes.data.state || 'All India')
        );
      }

      if (listingsRes?.data && Array.isArray(listingsRes.data)) {
        setMyListings(listingsRes.data);
      }

      if (poolsRes?.data && Array.isArray(poolsRes.data)) {
        setPools(poolsRes.data);
      }
    } catch (err) {
      console.error('Error loading pools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-field-green/10 text-field-green text-[11px] font-bold tracking-wide uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-field-green" />
                Village Aggregation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1">
              {t('pool.title')}
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Village-level aggregation into wholesale truck-scale lots ({userDistrict})
            </p>
          </div>
          <button
            onClick={fetchPools}
            className="p-2.5 bg-paper-well rounded-xl border border-border text-ink hover:bg-paper transition-all self-start sm:self-auto"
            title="Refresh pools"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Core Innovation Explainer */}
        <div className="bg-gradient-to-r from-field-green/10 via-emerald-500/5 to-earth/10 border border-field-green/30 rounded-3xl p-5 sm:p-6 flex items-start gap-3.5 shadow-xs">
          <Sparkles className="w-6 h-6 text-field-green shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-field-green text-sm sm:text-base">
              Why Pooled Lots Matter
            </p>
            <p className="text-ink leading-relaxed">
              Individual small quantities (2-5 quintals) cannot justify a wholesale truck. By auto-pooling your produce with neighbouring farms into a standard lot, you unlock direct wholesale demand without middleman cuts.
            </p>
          </div>
        </div>

        {/* Pools Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="animate-pulse bg-white rounded-3xl h-48 border border-border" />
            <div className="animate-pulse bg-white rounded-3xl h-48 border border-border" />
          </div>
        ) : pools.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-border space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-field-green/10 text-field-green flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-ink text-lg">{t('pool.noPools')}</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              No active pools currently in your area. List your harvest to automatically create a new pooled lot for your district!
            </p>
            <div className="pt-2">
              <Link
                href="/farmer/list"
                className="inline-flex items-center gap-1.5 px-5 py-3 bg-field-green text-white rounded-xl text-xs font-bold hover:bg-field-green-light transition-all shadow-xs min-h-[48px]"
              >
                <Plus className="w-4 h-4" />
                <span>{t('farmer.dashboard.listProduce')}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pools.map((pool) => {
              // Real contribution from this farmer's database listings
              const myPoolListings = myListings.filter((l) => l.poolId === pool.poolId);
              const userContributionKg = myPoolListings.reduce(
                (sum, l) => sum + (Number(l.quantityKg) || 0),
                0
              );

              return (
                <div key={pool.poolId} className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-xs space-y-3.5 flex flex-col justify-between">
                  <PoolProgressBar
                    crop={pool.crop}
                    qualityGrade={pool.qualityGrade}
                    district={pool.district}
                    currentKg={pool.currentKg}
                    targetKg={pool.targetKg}
                    farmerCount={pool.farmerCount}
                    poolPricePerKg={pool.poolPricePerKg}
                    windowEnd={pool.windowEnd}
                    status={pool.status}
                    userContributionKg={userContributionKg > 0 ? userContributionKg : undefined}
                    showActionButton={false}
                  />

                  {/* Dynamic Transport Info */}
                  <div className="bg-paper-well rounded-2xl p-3.5 border border-border/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-earth/10 text-earth flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-ink block capitalize">
                          {pool.district} Rural Logistics Route
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          Pickup at {pool.district} Centroid Hub · Direct Wholesale
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-earth bg-earth/10 px-2 py-0.5 rounded-full">
                      OPTIMIZED
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Centroid Aggregation Card */}
        {pools.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <MapPin className="w-4 h-4 text-field-green" />
                <span className="capitalize">{pools[0]?.district || userDistrict} Centroid Aggregation Hub</span>
              </h3>
              <span className="text-[11px] text-field-green font-semibold">
                Active Cluster
              </span>
            </div>

            <div className="h-36 w-full bg-slate-50 rounded-xl border border-border flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1B4332_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-field-green text-white flex items-center justify-center shadow-md">
                  📍
                </div>
                <p className="text-xs font-bold text-ink mt-2 capitalize">
                  {pools[0]?.district || userDistrict} APMC Hub Centroid
                </p>
                <p className="text-[11px] text-ink-muted max-w-sm mt-0.5">
                  Optimal cluster point computed across {pools.reduce((s, p) => s + p.farmerCount, 0)} member farms for minimal collective freight cost.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
