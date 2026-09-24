'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  MessageSquare,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';

interface OfferHistoryItem {
  by: 'wholesaler' | 'farmer';
  byName?: string;
  pricePerKgPaise: number;
  message?: string;
  timestamp: string;
  round: number;
}

interface Negotiation {
  negotiationId: string;
  crop: string;
  poolId: string;
  wholesalerBusinessName: string;
  offerPricePerKgPaise: number;
  listingPricePerKgPaise: number;
  floorPricePerKgPaise: number;
  ceilingPricePerKgPaise: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
  round?: number;
  maxRounds?: number;
  lastActionBy?: 'wholesaler' | 'farmer';
  expiresAt?: string;
  message?: string;
  offerHistory?: OfferHistoryItem[];
  createdAt: string;
}

export default function WholesalerNegotiationsPage() {
  const { t, formatCurrency } = useT();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);

  // Counter offer state
  const [counterActiveId, setCounterActiveId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterMessage, setCounterMessage] = useState<string>('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const fetchNegotiations = () => {
    setLoading(true);
    fetch('/api/negotiate?role=wholesaler')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.data)) {
          setNegotiations(data.data);
        }
      })
      .catch((err) => console.error('Error fetching wholesaler negotiations:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const handleResponse = async (
    id: string,
    response: 'accepted' | 'declined' | 'countered',
    extra?: { counterPricePerKgPaise?: number; message?: string }
  ) => {
    setRespondingId(id);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/negotiate/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response,
          counterPricePerKgPaise: extra?.counterPricePerKgPaise,
          message: extra?.message,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({
          id,
          msg:
            response === 'accepted'
              ? 'Counter-offer accepted! You can now checkout the lot.'
              : response === 'declined'
              ? 'Offer declined.'
              : 'Counter-offer sent to farmer collective!',
          type: 'success',
        });
        setCounterActiveId(null);
        setCounterPrice('');
        setCounterMessage('');
        fetchNegotiations();
      } else {
        setFeedbackMsg({ id, msg: data.message || 'Failed to update negotiation', type: 'error' });
      }
    } catch {
      setFeedbackMsg({ id, msg: 'Network error. Please try again.', type: 'error' });
    } finally {
      setRespondingId(null);
    }
  };

  const submitCounter = (n: Negotiation) => {
    const val = parseFloat(counterPrice);
    if (isNaN(val) || val <= 0) {
      setFeedbackMsg({ id: n.negotiationId, msg: 'Please enter a valid price.', type: 'error' });
      return;
    }
    const paise = Math.round(val * 100);
    handleResponse(n.negotiationId, 'countered', {
      counterPricePerKgPaise: paise,
      message: counterMessage,
    });
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('farmer.dashboard.negotiationInbox')}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Track and counter-negotiate fair price offers submitted to farmer collectives.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {negotiations.map((n) => {
              const round = n.round || 1;
              const maxRounds = n.maxRounds || 3;
              const isExpired = n.status === 'expired';
              const isActionable =
                (n.status === 'pending' || n.status === 'countered') &&
                n.lastActionBy === 'farmer' &&
                !isExpired;

              return (
                <div key={n.negotiationId} className="bg-white rounded-2xl p-5 border border-border shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-ink-muted uppercase">
                          Lot #{n.poolId}
                        </span>
                        <span className="text-[10px] bg-paper px-2 py-0.5 rounded-full font-bold text-ink-muted border border-border">
                          Round {round}/{maxRounds}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-ink capitalize mt-0.5">
                        {n.crop} Lot
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                        isExpired
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : n.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : n.status === 'declined'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : n.status === 'countered'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isExpired ? 'Expired' : n.status === 'countered' ? 'Countered by Farmer' : t(`negotiate.${n.status}`)}
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
                      <span className="text-ink-muted block">Current Offer</span>
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

                  {/* Negotiation History Thread */}
                  {Array.isArray(n.offerHistory) && n.offerHistory.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryId(
                            expandedHistoryId === n.negotiationId ? null : n.negotiationId
                          )
                        }
                        className="text-xs font-semibold text-earth flex items-center gap-1 hover:underline"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Negotiation History ({n.offerHistory.length} turns)</span>
                        {expandedHistoryId === n.negotiationId ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {expandedHistoryId === n.negotiationId && (
                        <div className="space-y-2 bg-paper/70 p-3 rounded-xl border border-border text-xs">
                          {n.offerHistory.map((h, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-lg border ${
                                h.by === 'wholesaler'
                                  ? 'bg-amber-50/70 border-amber-200 text-amber-900 ml-4'
                                  : 'bg-white border-border text-ink mr-4'
                              }`}
                            >
                              <div className="flex justify-between font-bold text-[11px]">
                                <span>{h.by === 'wholesaler' ? '🏪 Wholesaler (You)' : '🌾 Farmer Collective'} (Round {h.round})</span>
                                <span>{formatCurrency(h.pricePerKgPaise)}/kg</span>
                              </div>
                              {h.message && <p className="text-[11px] mt-1 italic opacity-90">"{h.message}"</p>}
                            </div>
                          ))}
                        </div>
                      )}
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

                  {/* Counter Form */}
                  {counterActiveId === n.negotiationId && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5 text-xs">
                      <h4 className="font-bold text-ink flex items-center gap-1">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-earth" />
                        Submit Counter-Offer (Round {round + 1}/{maxRounds})
                      </h4>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-ink-muted">₹</span>
                          <input
                            type="number"
                            step="0.10"
                            placeholder="Counter price / kg"
                            value={counterPrice}
                            onChange={(e) => setCounterPrice(e.target.value)}
                            className="w-full bg-white border border-border rounded-lg py-2 pl-7 pr-3 text-xs font-bold text-ink focus:outline-none focus:border-earth"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Note (optional)"
                          value={counterMessage}
                          onChange={(e) => setCounterMessage(e.target.value)}
                          className="flex-[2] bg-white border border-border rounded-lg py-2 px-3 text-xs text-ink focus:outline-none focus:border-earth"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setCounterActiveId(null)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink-muted text-xs font-semibold hover:bg-paper"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={respondingId === n.negotiationId}
                          onClick={() => submitCounter(n)}
                          className="px-4 py-1.5 rounded-lg bg-earth text-white text-xs font-bold hover:bg-earth-light flex items-center gap-1 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          Send Counter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions when farmer has countered */}
                  {isActionable && counterActiveId !== n.negotiationId && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleResponse(n.negotiationId, 'accepted')}
                        disabled={respondingId === n.negotiationId}
                        className="flex-1 py-2.5 bg-earth text-white font-bold text-xs rounded-xl hover:bg-earth-light transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {respondingId === n.negotiationId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Accept Farmer's Offer</span>
                      </button>

                      {round < maxRounds && (
                        <button
                          onClick={() => {
                            setCounterActiveId(n.negotiationId);
                            setCounterPrice(((n.offerPricePerKgPaise - 50) / 100).toFixed(2));
                          }}
                          disabled={respondingId === n.negotiationId}
                          className="flex-1 py-2.5 bg-paper border border-earth/40 text-earth font-bold text-xs rounded-xl hover:bg-earth/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Counter</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleResponse(n.negotiationId, 'declined')}
                        disabled={respondingId === n.negotiationId}
                        className="flex-1 py-2.5 bg-white border border-border text-ink font-bold text-xs rounded-xl hover:bg-paper transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                  {/* If accepted, prompt to check out */}
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
