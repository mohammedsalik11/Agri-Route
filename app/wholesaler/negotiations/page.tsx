'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import { MessageSquare, Clock, ArrowRight, ArrowUpRight } from 'lucide-react';

interface Negotiation {
  negotiationId: string;
  crop: string;
  poolId: string;
  wholesalerBusinessName: string;
  offerPricePerKgPaise: number;
  listingPricePerKgPaise: number;
  floorPricePerKgPaise: number;
  ceilingPricePerKgPaise: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  createdAt: string;
}

export default function WholesalerNegotiationsPage() {
  const { t, formatCurrency } = useT();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/negotiate?role=wholesaler')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.data)) {
          setNegotiations(data.data);
        }
      })
      .catch((err) => console.error('Error fetching wholesaler negotiations:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('farmer.dashboard.negotiationInbox')}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Track all counter-offers you have submitted to farmer collectives.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse bg-white rounded-2xl h-36 border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-36 border border-border" />
          </div>
        ) : negotiations.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-earth/10 text-earth flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-ink text-base">{t('negotiate.noNegotiations')}</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Browse lots on the marketplace and submit fair price counter-offers to farmer groups. Your submitted offers will appear here.
            </p>
            <Link
              href="/wholesaler"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all shadow-xs"
            >
              <span>{t('wholesaler.browse')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {negotiations.map((n) => {
              return (
                <div key={n.negotiationId} className="bg-white rounded-2xl p-5 border border-border shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-ink-muted block uppercase">
                        Lot #{n.poolId}
                      </span>
                      <h3 className="font-bold text-lg text-ink capitalize mt-0.5">
                        {n.crop} Lot
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                        n.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : n.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {t(`negotiate.${n.status}`)}
                    </span>
                  </div>

                  {/* Price Comparison */}
                  <div className="grid grid-cols-2 gap-3 bg-paper p-3.5 rounded-xl text-xs">
                    <div>
                      <span className="text-ink-muted block">{t('negotiate.listingPrice')}</span>
                      <span className="font-bold text-ink text-sm">
                        {formatCurrency(n.listingPricePerKgPaise)} / kg
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-muted block">{t('negotiate.offeredPrice')}</span>
                      <span className="font-bold text-earth text-sm">
                        {formatCurrency(n.offerPricePerKgPaise)} / kg
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border/50 text-[11px] text-ink-muted">
                      <span>{t('negotiate.fairRange')}: </span>
                      <span className="font-medium text-ink">
                        {formatCurrency(n.floorPricePerKgPaise)} - {formatCurrency(n.ceilingPricePerKgPaise)} / kg
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  {n.message && (
                    <p className="text-xs text-ink-muted italic bg-paper/60 p-2.5 rounded-lg">
                      "{n.message}"
                    </p>
                  )}

                  {/* If accepted, prompt to check out or view */}
                  {n.status === 'accepted' && (
                    <div className="pt-1 flex justify-end">
                      <Link
                        href={`/wholesaler/lot/${n.poolId}`}
                        className="px-4 py-2 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <span>View Lot &amp; Purchase</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
