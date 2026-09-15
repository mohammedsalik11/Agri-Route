'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  Users,
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface MemberFarmer {
  farmerName: string;
  quantityKg: number;
  askPricePerKg: number;
  qualityGrade: string;
}

export default function LotDetailPage() {
  const { t, formatCurrency, formatWeight } = useT();
  const router = useRouter();
  const params = useParams();
  const poolId = params?.id as string;

  const [loading, setLoading] = useState(false);

  // All 9 farmers composing the full 3,000 kg lot (§13.5, §15, §20)
  const [members, setMembers] = useState<MemberFarmer[]>([
    { farmerName: 'Lakshmamma', quantityKg: 600, askPricePerKg: 1400, qualityGrade: 'A' },
    { farmerName: 'Rajamma', quantityKg: 350, askPricePerKg: 1400, qualityGrade: 'A' },
    { farmerName: 'Nagaraju', quantityKg: 280, askPricePerKg: 1350, qualityGrade: 'A' },
    { farmerName: 'Manjunath', quantityKg: 320, askPricePerKg: 1450, qualityGrade: 'A' },
    { farmerName: 'Savithramma', quantityKg: 400, askPricePerKg: 1380, qualityGrade: 'A' },
    { farmerName: 'Venkatesh', quantityKg: 250, askPricePerKg: 1420, qualityGrade: 'A' },
    { farmerName: 'Shivamma', quantityKg: 300, askPricePerKg: 1390, qualityGrade: 'A' },
    { farmerName: 'Basavaraj', quantityKg: 280, askPricePerKg: 1410, qualityGrade: 'A' },
    { farmerName: 'Gangamma', quantityKg: 220, askPricePerKg: 1370, qualityGrade: 'A' },
  ]);

  const totalKg = members.reduce((s, m) => s + m.quantityKg, 0); // 3,000 kg
  const poolPricePaise = 1460; // ₹14.60
  const subtotalPaise = totalKg * poolPricePaise;
  const platformFeePaise = Math.round(subtotalPaise * 0.03);
  const logisticsFeePaise = Math.round(subtotalPaise * 0.05);
  const totalOrderPaise = subtotalPaise + platformFeePaise + logisticsFeePaise;

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'pool',
          sourceId: poolId || 'demo_pool_tomato',
        }),
      });
      const data = await res.json();
      if (data.ok && data.data?.order?.orderId) {
        router.push(`/wholesaler/checkout/${data.data.order.orderId}`);
      } else {
        // Fallback demo order routing
        router.push('/wholesaler/checkout/ord_mandya_9921');
      }
    } catch {
      router.push('/wholesaler/checkout/ord_mandya_9921');
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-earth uppercase tracking-wide">
            Pooled Wholesale Lot
          </span>
          <h1 className="text-2xl font-bold text-ink mt-0.5">
            Tomato Grade A · Mandya Centroid Truckload
          </h1>
          <p className="text-xs text-ink-muted">
            3,000 kg total lot aggregated across 9 verified marginal farmers
          </p>
        </div>

        {/* Pitch Highlight Banner (§20 Beat 2:45) */}
        <div className="bg-gradient-to-r from-earth/15 via-field-green/15 to-earth/15 border border-earth/30 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-earth shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-ink text-sm">
              Complete Farm Traceability
            </p>
            <p className="text-ink-light">
              For the first time in wholesale agricultural procurement, you can see every single smallholder who grew your lot and their individual contribution.
            </p>
          </div>
        </div>

        {/* 9 Farmers Member Breakdown Table */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Users className="w-4 h-4 text-earth" />
              Member Farmer Breakdown ({members.length} Farmers)
            </h3>
            <span className="text-xs font-bold text-field-green">
              {formatWeight(totalKg)} Total
            </span>
          </div>

          <div className="divide-y divide-border-light text-xs">
            {members.map((farmer, idx) => {
              const sharePct = ((farmer.quantityKg / totalKg) * 100).toFixed(1);
              const isLeadFarmer = farmer.farmerName === 'Lakshmamma';

              return (
                <div
                  key={idx}
                  className={`py-3 flex items-center justify-between transition-colors ${
                    isLeadFarmer ? 'bg-emerald-50/60 px-2 rounded-lg font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-paper border border-border flex items-center justify-center font-bold text-[10px] text-ink-muted">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-ink block">
                        {farmer.farmerName} {isLeadFarmer && '(Lead Contributor)'}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        Mandya APMC Hub · Grade {farmer.qualityGrade}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-ink block">
                      {formatWeight(farmer.quantityKg)}
                    </span>
                    <span className="text-[11px] text-field-green">
                      {sharePct}% of lot
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost & Fee Breakdown Card */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-ink">Commercial Summary</h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Lot Subtotal (3,000 kg @ ₹14.60/kg):</span>
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

          <div className="pt-4">
            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full py-3.5 px-6 bg-earth text-white font-bold text-sm rounded-xl hover:bg-earth-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating Escrow Checkout...</span>
                </>
              ) : (
                <>
                  <span>Purchase Full Lot via Escrow</span>
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
