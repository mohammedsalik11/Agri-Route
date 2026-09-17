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
  const [userDistrict, setUserDistrict] = useState<string>('Karnataka');
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
        setUserDistrict(meRes.data.district || 'Karnataka');
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

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">{t('pool.title')}</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Village-level aggregation into wholesale truck-scale lots ({userDistrict})
            </p>
          </div>
          <button
            onClick={fetchPools}
            className="p-2 bg-white rounded-xl border border-border text-ink hover:bg-paper"
            title="Refresh pools"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Core Innovation Explainer */}
        <div className="bg-gradient-to-r from-field-green/10 via-earth/10 to-field-green/10 border border-field-green/30 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-field-green shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-field-green text-sm">
              Why Pooled Lots Matter
            </p>
            <p className="text-ink">
              Individual small quantities (2-5 quintals) cannot justify a wholesale truck. By auto-pooling your produce with neighbouring farms into a standard lot, you unlock direct wholesale demand without middleman cuts.
            </p>
          </div>
        </div>

        {/* Pools List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-white rounded-2xl h-44 border border-border" />
              <div className="animate-pulse bg-white rounded-2xl h-44 border border-border" />
            </div>
          ) : pools.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-border space-y-3">
              <div className="w-12 h-12 rounded-full bg-field-green/10 text-field-green flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-ink text-base">{t('pool.noPools')}</h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                No active pools currently in your area. List your harvest to automatically create a new pooled lot for your district!
              </p>
              <div className="pt-2">
                <Link
                  href="/farmer/list"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-field-green text-white rounded-xl text-xs font-bold hover:bg-field-green-light transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('farmer.dashboard.listProduce')}</span>
                </Link>
              </div>
            </div>
          ) : (
            pools.map((pool) => {
              // Real contribution from this farmer's database listings
              const myPoolListings = myListings.filter((l) => l.poolId === pool.poolId);
              const userContributionKg = myPoolListings.reduce(
                (sum, l) => sum + (Number(l.quantityKg) || 0),
                0
              );

              return (
                <div key={pool.poolId} className="space-y-3">
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
                  <div className="bg-white rounded-xl p-3.5 border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-earth/10 text-earth flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-ink block capitalize">
                          {pool.district} Rural Logistics Route
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          Pickup at {pool.district} APMC Centroid Hub · Direct Wholesale Transit
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-earth bg-earth/10 px-2 py-0.5 rounded-full">
                      OPTIMIZED
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

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
