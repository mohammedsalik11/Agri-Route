'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import { CheckCircle2, XCircle, Clock, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

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

export default function FarmerNegotiationsPage() {
  const { t, formatCurrency } = useT();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);

  const fetchNegotiations = () => {
    setLoading(true);
    fetch('/api/negotiate?role=farmer')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.data)) {
          setNegotiations(data.data);
        }
      })
      .catch((err) => console.error('Error fetching negotiations:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const handleResponse = async (id: string, response: 'accepted' | 'declined') => {
    setRespondingId(id);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/negotiate/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const data = await res.json();
      if (data.ok) {
        setNegotiations((prev) =>
          prev.map((n) => (n.negotiationId === id ? { ...n, status: response } : n))
        );
        setFeedbackMsg({
          id,
          msg: response === 'accepted' ? 'Offer accepted! Order ready.' : 'Offer declined.',
          type: 'success',
        });
      } else {
        setFeedbackMsg({ id, msg: data.message || 'Failed to update negotiation', type: 'error' });
      }
    } catch {
      setFeedbackMsg({ id, msg: 'Network error. Please try again.', type: 'error' });
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('negotiate.inbox')}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Review incoming counter-offers from verified wholesale buyers within the fair price range.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse bg-white rounded-2xl h-40 border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-40 border border-border" />
          </div>
        ) : negotiations.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-field-green/10 text-field-green flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-ink text-base">{t('negotiate.noNegotiations')}</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              When wholesalers browse your produce lots and submit fair price offers, they will appear here for your review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {negotiations.map((n) => {
              const diffPaise = n.offerPricePerKgPaise - n.listingPricePerKgPaise;
              const isPending = n.status === 'pending';

              return (
                <div key={n.negotiationId} className="bg-white rounded-2xl p-5 border border-border shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-ink-muted block uppercase">
                        Lot #{n.poolId}
                      </span>
                      <h3 className="font-bold text-lg text-ink capitalize mt-0.5">
                        {n.crop}
                      </h3>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {t('negotiate.offeredBy')}: <span className="font-semibold text-ink">{n.wholesalerBusinessName}</span>
                      </p>
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
                      <span className="font-bold text-field-green text-sm">
                        {formatCurrency(n.offerPricePerKgPaise)} / kg
                      </span>
                      {diffPaise !== 0 && (
                        <span className={`text-[10px] ml-1.5 font-semibold ${diffPaise > 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
                          ({diffPaise > 0 ? '+' : ''}{(diffPaise / 100).toFixed(2)}/kg)
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border/50 text-[11px] text-ink-muted">
                      <span>{t('negotiate.fairRange')}: </span>
                      <span className="font-medium text-ink">
                        {formatCurrency(n.floorPricePerKgPaise)} - {formatCurrency(n.ceilingPricePerKgPaise)} / kg
                      </span>
                    </div>
                  </div>

                  {/* Wholesaler Note */}
                  {n.message && (
                    <div className="text-xs text-ink-muted bg-paper/60 p-3 rounded-xl border border-border/50 italic">
                      "{n.message}"
                    </div>
                  )}

                  {feedbackMsg && feedbackMsg.id === n.negotiationId && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                      feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {feedbackMsg.msg}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isPending && (
                    <div className="flex gap-2.5 pt-1">
                      <button
                        onClick={() => handleResponse(n.negotiationId, 'accepted')}
                        disabled={respondingId === n.negotiationId}
                        className="flex-1 py-2.5 bg-field-green text-white font-bold text-xs rounded-xl hover:bg-field-green-light transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {respondingId === n.negotiationId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{t('negotiate.accept')}</span>
                      </button>
                      <button
                        onClick={() => handleResponse(n.negotiationId, 'declined')}
                        disabled={respondingId === n.negotiationId}
                        className="flex-1 py-2.5 bg-white border border-border text-ink font-bold text-xs rounded-xl hover:bg-paper transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>{t('negotiate.decline')}</span>
                      </button>
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
