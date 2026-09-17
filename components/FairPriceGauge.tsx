'use client';

import React from 'react';
import { useT } from '@/lib/i18n/LanguageProvider';
import { DataSourceBadge } from './DataSourceBadge';
import { ReadAloud } from './ReadAloud';

interface FairPriceGaugeProps {
  askPricePerKg: number; // in paise (e.g. 1400 paise = Rs 14)
  mandiMinPerKg: number; // paise
  mandiModalPerKg: number; // paise
  mandiMaxPerKg: number; // paise
  mspPerKg: number | null; // paise or null
  verdict: 'BELOW_FLOOR' | 'FAIR' | 'ABOVE_MARKET';
  extraEarningVsFloor?: number; // paise
  dataSource: 'LIVE' | 'CACHED';
  checkedDate?: string;
  cropName?: string;
}

export const FairPriceGauge: React.FC<FairPriceGaugeProps> = ({
  askPricePerKg,
  mandiMinPerKg,
  mandiModalPerKg,
  mandiMaxPerKg,
  mspPerKg,
  verdict,
  extraEarningVsFloor = 0,
  dataSource,
  checkedDate,
  cropName,
}) => {
  const { t, formatCurrency } = useT();

  const floor = mspPerKg ? Math.max(mspPerKg, mandiMinPerKg) : mandiMinPerKg;
  const modal = mandiModalPerKg || floor || 1000;
  const maxRange = Math.max(mandiMaxPerKg, modal * 1.4, askPricePerKg * 1.15, 100);
  const minRange = Math.max(0, Math.min(mandiMinPerKg * 0.7, floor * 0.7));

  const totalRange = maxRange - minRange || 1;

  // Percentage positions for gauge
  const floorPct = Math.min(100, Math.max(0, ((floor - minRange) / totalRange) * 100));
  const modalPct = Math.min(100, Math.max(0, ((modal - minRange) / totalRange) * 100));
  const askPct = Math.min(100, Math.max(0, ((askPricePerKg - minRange) / totalRange) * 100));

  const fairBandLoPct = Math.max(0, modalPct - 8);
  const fairBandHiPct = Math.min(100, modalPct + 8);

  const speechText =
    verdict === 'BELOW_FLOOR'
      ? `${cropName || 'Produce'}. ${t('fairPrice.belowFloor')}. ${t('fairPrice.moreAvailable', {
          amount: (extraEarningVsFloor / 100).toFixed(0),
        })}`
      : verdict === 'FAIR'
      ? `${cropName || 'Produce'}. ${t('fairPrice.fair')}. ${formatCurrency(askPricePerKg)} ${t('common.perKg')}.`
      : `${cropName || 'Produce'}. ${t('fairPrice.aboveMarket')}.`;

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-ink text-base">{t('fairPrice.title')}</h3>
          <DataSourceBadge source={dataSource} date={checkedDate} />
        </div>
        <ReadAloud text={speechText} label={t('fairPrice.title')} />
      </div>

      {/* Rupee Callout Banner */}
      {verdict === 'BELOW_FLOOR' && extraEarningVsFloor > 0 && (
        <div className="mb-4 bg-alert-red/10 border border-alert-red/30 rounded-xl p-3 flex items-start gap-2.5">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-alert-red font-bold text-sm">
              {t('fairPrice.belowFloor')}
            </p>
            <p className="text-ink text-xs mt-0.5 font-medium">
              {t('fairPrice.moreAvailable', {
                amount: (extraEarningVsFloor / 100).toFixed(0),
              })}
            </p>
          </div>
        </div>
      )}

      {verdict === 'FAIR' && (
        <div className="mb-4 bg-fair-green/10 border border-fair-green/30 rounded-xl p-3 flex items-center gap-2">
          <span className="text-xl">✅</span>
          <p className="text-fair-green font-bold text-sm">
            {t('fairPrice.fair')} — {formatCurrency(askPricePerKg)} / kg
          </p>
        </div>
      )}

      {verdict === 'ABOVE_MARKET' && (
        <div className="mb-4 bg-amber/15 border border-amber/40 rounded-xl p-3 flex items-start gap-2.5">
          <span className="text-xl">ℹ️</span>
          <div>
            <p className="text-amber-800 font-bold text-sm">
              {t('fairPrice.aboveMarket')}
            </p>
            <p className="text-ink text-xs mt-0.5">
              Above today&apos;s mandi rate. Consider cold storage or joining a pool.
            </p>
          </div>
        </div>
      )}

      {/* Non-MSP crop indicator */}
      {mspPerKg === null && (
        <p className="text-[11px] text-ink-muted mb-3 italic">
          {t('fairPrice.noMspForCrop')}
        </p>
      )}

      {/* Visual 3-Zone Gauge */}
      <div className="relative pt-6 pb-4">
        {/* Pointer for Farmer's Ask Price */}
        <div
          className="absolute -top-1 transition-all duration-300 transform -translate-x-1/2 z-10 flex flex-col items-center"
          style={{ left: `${askPct}%` }}
        >
          <span className="bg-ink text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
            ₹{(askPricePerKg / 100).toFixed(1)}
          </span>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-ink mt-0.5" />
        </div>

        {/* 3 Zones Bar */}
        <div className="h-4 w-full bg-border-light rounded-full overflow-hidden flex relative">
          {/* Below floor zone */}
          <div
            className="bg-alert-red/70 h-full border-r border-white/50"
            style={{ width: `${fairBandLoPct}%` }}
            title="Below Support Floor"
          />
          {/* Fair zone */}
          <div
            className="bg-fair-green h-full border-r border-white/50"
            style={{ width: `${fairBandHiPct - fairBandLoPct}%` }}
            title="Fair Market Band"
          />
          {/* Above market zone */}
          <div
            className="bg-amber h-full"
            style={{ width: `${100 - fairBandHiPct}%` }}
            title="Above Market"
          />
        </div>

        {/* Legend / Floor markers */}
        <div className="flex justify-between items-center text-[11px] font-medium text-ink-muted mt-2">
          <span>₹{(minRange / 100).toFixed(0)}</span>
          <span className="text-alert-red font-semibold">
            Floor: ₹{(floor / 100).toFixed(0)}
          </span>
          <span className="text-fair-green font-semibold">
            Mandi: ₹{(modal / 100).toFixed(0)}
          </span>
          <span>₹{(maxRange / 100).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};
