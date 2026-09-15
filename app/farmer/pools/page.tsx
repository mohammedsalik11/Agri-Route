'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { PoolProgressBar } from '@/components/PoolProgressBar';
import { SimulatedBadge } from '@/components/SimulatedBadge';
import { useT } from '@/lib/i18n/LanguageProvider';
import { Truck, MapPin, Plus, Sparkles, RefreshCw } from 'lucide-react';

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
}

export default function FarmerPoolsPage() {
  const { t, formatCurrency } = useT();
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPools = () => {
    setLoading(true);
    fetch('/api/pools?district=Mandya')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setPools(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPools();
  }, []);

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">{t('pool.title')}</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Village-level aggregation into wholesale truck-scale lots
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
              Individual marginal quantities (2-5 quintals) cannot justify a wholesale truck. By auto-pooling your produce with neighbouring farms into a 3,000 kg standard lot, you unlock direct wholesale demand without middleman exploitation.
            </p>
          </div>
        </div>

        {/* Pools List */}
        <div className="space-y-4">
          {pools.map((pool) => (
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
                userContributionKg={pool.crop === 'tomato' ? 600 : undefined}
                showActionButton={false}
              />

              {/* Transport Partner Stub (§3 F19, §15) */}
              <div className="bg-white rounded-xl p-3.5 border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-earth/10 text-earth flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-ink block">
                      Karnataka Rural Freight Link (Partner Stub)
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      Est. Rate: ₹0.75 / kg · Pickup at Mandya Agri Centroid
                    </span>
                  </div>
                </div>
                <SimulatedBadge label="STUB" />
              </div>
            </div>
          ))}

          {pools.length === 0 && !loading && (
            <div className="bg-white rounded-2xl p-8 text-center border border-border space-y-3">
              <p className="text-sm font-semibold text-ink">
                {t('pool.noPools')}
              </p>
              <Link
                href="/farmer/list"
                className="inline-flex items-center gap-2 px-4 py-2 bg-field-green text-paper rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>{t('farmer.dashboard.listProduce')}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Interactive Centroid Map Card */}
        <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <MapPin className="w-4 h-4 text-field-green" />
              Mandya Centroid Aggregation Hub
            </h3>
            <span className="text-[11px] text-field-green font-semibold">
              Latitude: 12.524° N, 76.890° E
            </span>
          </div>

          <div className="h-44 w-full bg-slate-100 rounded-xl border border-border flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
            {/* Visual map representation */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1B4332_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-field-green text-white flex items-center justify-center shadow-lg animate-bounce">
                📍
              </div>
              <p className="text-xs font-bold text-ink mt-2">
                Dudda Cross / Mandya APMC Centroid Hub
              </p>
              <p className="text-[11px] text-ink-muted max-w-sm mt-0.5">
                Optimal cluster point computed from 9 member farms within a 6km radius.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
