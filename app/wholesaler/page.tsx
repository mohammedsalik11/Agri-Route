'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  Store,
  Truck,
  Users,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
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

export default function WholesalerBrowsePage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [activeTab, setActiveTab] = useState<'pools' | 'individual'>('pools');
  const [pools, setPools] = useState<PoolLot[]>([
    {
      poolId: 'demo_pool_tomato',
      crop: 'tomato',
      qualityGrade: 'A',
      district: 'Mandya',
      currentKg: 3000,
      targetKg: 3000,
      farmerCount: 9,
      poolPricePerKg: 1460, // ₹14.60
      status: 'ready',
    },
    {
      poolId: 'demo_pool_onion',
      crop: 'onion',
      qualityGrade: 'A',
      district: 'Hassan',
      currentKg: 4200,
      targetKg: 5000,
      farmerCount: 6,
      poolPricePerKg: 2400,
      status: 'open',
    },
  ]);

  useEffect(() => {
    fetch('/api/pools')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data && res.data.length > 0) {
          setPools(res.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Wholesaler Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-5 border border-border">
          <div>
            <span className="text-xs font-semibold text-earth uppercase tracking-wide">
              {t('role.wholesaler')} Portal
            </span>
            <h1 className="text-xl font-bold text-ink mt-0.5">
              Suresh Traders · Bengaluru
            </h1>
            <p className="text-xs text-ink-muted">
              Verified Wholesale Buyer · GSTIN: 29AAAAA0000A1Z5
            </p>
          </div>
          <Link
            href="/wholesaler/orders"
            className="px-4 py-2 bg-earth text-white rounded-xl text-xs font-bold hover:bg-earth-light transition-all flex items-center gap-1.5"
          >
            <span>{t('wholesaler.orders')}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Toggle: Steers demand toward pooled lots (§15) */}
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
            <span>{t('wholesaler.fullLots')} (Truck Scale)</span>
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'individual'
                ? 'bg-earth text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span>{t('wholesaler.individual')}</span>
          </button>
        </div>

        {/* Value Proposition Callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-900 text-sm">
              Direct Farmer Sourcing with 2% Bulk Volume Discount
            </p>
            <p className="text-amber-800">
              Buy full truckloads aggregated straight from farm gates. 100% farm traceability with escrow protection and zero middleman fee inflation.
            </p>
          </div>
        </div>

        {/* Lots Grid */}
        {activeTab === 'pools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pools.map((pool) => {
              const isReady = pool.status === 'ready' || pool.currentKg >= pool.targetKg;
              const totalAmount = (pool.currentKg * pool.poolPricePerKg);

              return (
                <div
                  key={pool.poolId}
                  className="bg-white rounded-2xl p-5 border-2 border-border hover:border-earth hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-2xl block mb-1">
                          {pool.crop === 'tomato' ? '🍅' : pool.crop === 'onion' ? '🧅' : '📦'}
                        </span>
                        <h2 className="text-lg font-bold text-ink capitalize">
                          {pool.crop} Full Lot
                        </h2>
                        <p className="text-xs text-ink-muted">
                          Grade {pool.qualityGrade} · {pool.district} Aggregation Centroid
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isReady
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isReady ? 'Truckload Ready' : 'Collecting'}
                      </span>
                    </div>

                    <div className="bg-paper p-3 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between text-ink-muted">
                        <span>Total Weight:</span>
                        <span className="font-bold text-ink">
                          {formatWeight(pool.currentKg)}
                        </span>
                      </div>
                      <div className="flex justify-between text-ink-muted">
                        <span>Farmer Collective:</span>
                        <span className="font-bold text-field-green">
                          {pool.farmerCount} Farmers Pooled
                        </span>
                      </div>
                      <div className="flex justify-between text-ink-muted pt-1 border-t border-border-light">
                        <span>Pooled Price:</span>
                        <span className="font-bold text-earth text-sm">
                          {formatCurrency(pool.poolPricePerKg)} / kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border-light flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-ink-muted block uppercase font-bold">
                        Lot Total
                      </span>
                      <span className="text-base font-extrabold text-ink">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>

                    <Link
                      href={`/wholesaler/lot/${pool.poolId}`}
                      className="px-4 py-2.5 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <span>View Farmer Breakdown</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Individual Listings Tab */}
        {activeTab === 'individual' && (
          <div className="bg-white rounded-2xl p-8 text-center border border-border space-y-2">
            <p className="text-sm font-semibold text-ink">
              Individual listings are automatically guided into pooled truck lots for volume discount and freight viability.
            </p>
            <p className="text-xs text-ink-muted">
              Check out our available truck lots above to buy directly from verified farmer clusters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
