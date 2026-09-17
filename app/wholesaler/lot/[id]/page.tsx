'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import { useCart } from '@/lib/context/CartContext';
import {
  Users,
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Plus,
  Check,
} from 'lucide-react';

interface MemberFarmer {
  listingId?: string;
  farmerName: string;
  quantityKg: number;
  askPricePerKg: number;
  qualityGrade: string;
}

export default function LotDetailPage() {
  const { t, formatCurrency, formatWeight } = useT();
  const { addItem, hasItem } = useCart();
  const router = useRouter();
  const params = useParams();
  const rawPoolId = (params?.id as string) || '';
  const poolId = rawPoolId ? decodeURIComponent(rawPoolId) : '';

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [crop, setCrop] = useState('tomato');
  const [district, setDistrict] = useState('Mandya');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [poolStatus, setPoolStatus] = useState<string>('open');
  const [members, setMembers] = useState<MemberFarmer[]>([]);
  const [poolPricePaise, setPoolPricePaise] = useState(1460);
  const [offerPrice, setOfferPrice] = useState('14.00');
  const [message, setMessage] = useState('');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [offerStatusMsg, setOfferStatusMsg] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [buyErrorMsg, setBuyErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!poolId) return;

    fetch(`/api/pools/${poolId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          const p = res.data;
          setCrop(p.crop || 'produce');
          setDistrict(p.district || 'Karnataka');
          setQualityGrade(p.qualityGrade || 'A');
          setPoolStatus(p.status || 'open');
          setPoolPricePaise(p.poolPricePerKg || 1400);
          setOfferPrice(((p.poolPricePerKg || 1400) / 100).toFixed(2));

          if (Array.isArray(p.members) && p.members.length > 0) {
            setMembers(p.members);
          } else {
            // Default breakdown if single farmer
            setMembers([
              {
                farmerName: p.crop ? `${p.crop} Farmer Collective` : 'Farmer Collective',
                quantityKg: p.currentKg || 3000,
                askPricePerKg: p.poolPricePerKg || 1400,
                qualityGrade: p.qualityGrade || 'A',
              },
            ]);
          }
        }
      })
      .catch((err) => console.error('Error fetching pool lot detail:', err))
      .finally(() => setDataLoading(false));
  }, [poolId]);

  const totalKg = members.reduce((s, m) => s + m.quantityKg, 0);
  const subtotalPaise = totalKg * poolPricePaise;
  const platformFeePaise = Math.round(subtotalPaise * 0.03);
  const logisticsFeePaise = Math.round(subtotalPaise * 0.05);
  const totalOrderPaise = subtotalPaise + platformFeePaise + logisticsFeePaise;

  const handleCreateOrder = async () => {
    setLoading(true);
    setBuyErrorMsg(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'pool',
          sourceId: poolId,
        }),
      });
      const data = await res.json();
      const targetOrderId = data.data?.order?.orderId || data.data?.orders?.[0]?.orderId;
      if (data.ok && targetOrderId) {
        router.push(`/wholesaler/checkout/${targetOrderId}`);
      } else {
        setBuyErrorMsg(data.message || 'Failed to initialize order. Please try again.');
        setLoading(false);
      }
    } catch {
      setBuyErrorMsg('Network error. Failed to initialize order.');
      setLoading(false);
    }
  };

  const handleMakeOffer = async () => {
    setIsNegotiating(true);
    setOfferStatusMsg(null);
    try {
      const paise = Math.round(parseFloat(offerPrice) * 100);
      if (isNaN(paise) || paise <= 0) {
        setOfferStatusMsg({ msg: 'Please enter a valid offer price.', type: 'error' });
        setIsNegotiating(false);
        return;
      }

      const res = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          offerPricePerKgPaise: paise,
          message,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setOfferStatusMsg({ msg: t('negotiate.offerSent'), type: 'success' });
        setMessage('');
      } else {
        setOfferStatusMsg({ msg: data.message || 'Error making offer', type: 'error' });
      }
    } catch {
      setOfferStatusMsg({ msg: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsNegotiating(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-paper pb-24">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="animate-pulse bg-white rounded-2xl h-24 border border-border" />
          <div className="animate-pulse bg-white rounded-2xl h-64 border border-border" />
          <div className="animate-pulse bg-white rounded-2xl h-48 border border-border" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-earth uppercase tracking-wide">
            Pooled Wholesale Lot
          </span>
          <h1 className="text-2xl font-bold text-ink mt-0.5 capitalize">
            {crop} Grade {qualityGrade} · {district} Truckload
          </h1>
          <p className="text-xs text-ink-muted">
            {formatWeight(totalKg)} lot aggregated across {members.length} verified farmer{members.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Pitch Highlight Banner */}
        <div className="bg-gradient-to-r from-earth/15 via-field-green/15 to-earth/15 border border-earth/30 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-earth shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-ink text-sm">Complete Farm Traceability</p>
            <p className="text-ink-light">
              See every individual smallholder who grew your lot and their verified contribution with escrow release protection.
            </p>
          </div>
        </div>

        {/* Pickup Centroid & Google Maps Card */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-earth/10 text-earth flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-ink text-sm block">Farm Gate Collection Centroid</span>
              <span className="text-ink-muted">{district} Agri-Aggregation Center, Karnataka</span>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(district + ' APMC Yard, Karnataka')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-paper border border-border text-ink hover:border-earth hover:text-earth rounded-xl font-bold transition-all shrink-0 shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-earth" />
            <span>View on Google Maps ↗</span>
          </a>
        </div>

        {/* Members Breakdown Table */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Users className="w-4 h-4 text-earth" />
              Member Farmer Breakdown ({members.length} {members.length > 1 ? 'Farmers' : 'Farmer'})
            </h3>
            <span className="text-xs font-bold text-field-green">
              {formatWeight(totalKg)} Total
            </span>
          </div>

          <div className="divide-y divide-border-light text-xs">
            {members.map((farmer, idx) => {
              const sharePct = totalKg > 0 ? ((farmer.quantityKg / totalKg) * 100).toFixed(1) : '100';

              return (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-paper border border-border flex items-center justify-center font-bold text-[10px] text-ink-muted">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-ink font-semibold block capitalize">
                        {farmer.farmerName}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        {district} · Grade {farmer.qualityGrade}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-ink block">
                      {formatWeight(farmer.quantityKg)}
                    </span>
                    <span className="text-[11px] text-field-green font-semibold">
                      {sharePct}% of lot
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Make an Offer Section */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">{t('negotiate.title')}</h3>
            <span className="text-xs text-ink-muted">
              Listed at: <span className="font-bold text-ink">{formatCurrency(poolPricePaise)}/kg</span>
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-muted block mb-1">{t('negotiate.yourOffer')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted font-bold">₹</span>
                <input
                  type="number"
                  step="0.10"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full bg-paper border border-border rounded-xl py-2.5 pl-8 pr-4 text-sm font-bold text-ink focus:outline-none focus:border-earth"
                  placeholder="14.00"
                />
              </div>
              <p className="text-[10px] text-ink-muted mt-1 flex justify-between">
                <span>{t('negotiate.floorNote')}</span>
                <span>{t('negotiate.ceilingNote')}</span>
              </p>
            </div>

            <div>
              <label className="text-xs text-ink-muted block mb-1">{t('negotiate.message')}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-paper border border-border rounded-xl p-3 text-sm text-ink focus:outline-none focus:border-earth resize-none"
                rows={2}
                placeholder="E.g. Ready to purchase immediately if price is matched."
              />
            </div>

            {offerStatusMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                offerStatusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {offerStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{offerStatusMsg.msg}</span>
              </div>
            )}

            <button
              onClick={handleMakeOffer}
              disabled={isNegotiating}
              className="w-full py-2.5 bg-paper border-2 border-earth text-earth font-bold text-xs rounded-xl hover:bg-earth hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isNegotiating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{t('negotiate.submitOffer')}</span>
            </button>
          </div>
        </div>

        {/* Commercial Summary & Buy */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-ink">Commercial Summary</h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Lot Subtotal ({formatWeight(totalKg)} @ {formatCurrency(poolPricePaise)}/kg):</span>
              <span className="font-bold text-ink">{formatCurrency(subtotalPaise)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Logistics (Karnataka Freight Partner 5%):</span>
              <span className="font-bold text-ink">{formatCurrency(logisticsFeePaise)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Platform Escrow Fee (3%):</span>
              <span className="font-bold text-ink">{formatCurrency(platformFeePaise)}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between text-sm font-extrabold text-ink">
              <span>Total Payable to Escrow:</span>
              <span className="text-earth text-base">{formatCurrency(totalOrderPaise)}</span>
            </div>
          </div>

          {buyErrorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{buyErrorMsg}</span>
            </div>
          )}

          <div className="pt-3 flex gap-2">
            <button
              onClick={() => {
                addItem({
                  sourceType: 'pool',
                  sourceId: poolId,
                  crop,
                  qualityGrade,
                  district,
                  quantityKg: totalKg,
                  pricePerKgPaise: poolPricePaise,
                  farmerCount: members.length,
                });
              }}
              disabled={hasItem(poolId) || totalKg === 0}
              className={`flex-1 py-3.5 px-4 font-bold text-sm rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                hasItem(poolId)
                  ? 'bg-field-green/10 text-field-green border-field-green/30'
                  : 'bg-paper text-ink border-border hover:bg-earth/5 hover:border-earth'
              }`}
            >
              {hasItem(poolId) ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>In Cart</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              onClick={handleCreateOrder}
              disabled={loading || totalKg === 0}
              className="flex-[2] py-3.5 px-6 bg-earth text-white font-bold text-sm rounded-xl hover:bg-earth-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating Escrow Checkout...</span>
                </>
              ) : (
                <>
                  <span>Purchase Full Lot</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
