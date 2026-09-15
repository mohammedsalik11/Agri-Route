'use client';

import React from 'react';
import { useT } from '@/lib/i18n/LanguageProvider';

interface RupeeSplitBarProps {
  farmerPercent?: number; // default 92
  logisticsPercent?: number; // default 5
  platformPercent?: number; // default 3
  totalAmountPaise?: number;
}

export const RupeeSplitBar: React.FC<RupeeSplitBarProps> = ({
  farmerPercent = 92,
  logisticsPercent = 5,
  platformPercent = 3,
  totalAmountPaise,
}) => {
  const { t, formatCurrency } = useT();

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-xs space-y-5">
      <div>
        <h3 className="font-bold text-ink text-base">
          {t('earnings.title')} — Where your rupee went
        </h3>
        <p className="text-xs text-ink-muted mt-0.5">
          Direct breakdown per ₹100 paid by the buyer
        </p>
      </div>

      {/* Agri Route Split */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-field-green">
          <span>Agri Route Marketplace</span>
          <span>{farmerPercent}% directly to farmer</span>
        </div>

        {/* Multi-segment bar */}
        <div className="h-6 w-full rounded-xl overflow-hidden flex text-[10px] font-bold text-white shadow-inner">
          <div
            style={{ width: `${farmerPercent}%` }}
            className="bg-field-green flex items-center justify-center transition-all duration-500"
            title={`Farmer receives ${farmerPercent}%`}
          >
            {farmerPercent}%
          </div>
          <div
            style={{ width: `${logisticsPercent}%` }}
            className="bg-earth flex items-center justify-center transition-all duration-500"
            title={`Logistics ${logisticsPercent}%`}
          >
            {logisticsPercent}%
          </div>
          <div
            style={{ width: `${platformPercent}%` }}
            className="bg-slate-700 flex items-center justify-center transition-all duration-500"
            title={`Platform fee ${platformPercent}%`}
          >
            {platformPercent}%
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-field-green shrink-0" />
            <div>
              <span className="font-semibold text-ink block">{t('earnings.farmerReceives')}</span>
              <span className="text-ink-muted text-[11px]">{farmerPercent}%</span>
              {totalAmountPaise && (
                <span className="text-[11px] text-field-green font-bold block">
                  {formatCurrency((totalAmountPaise * farmerPercent) / 100)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-earth shrink-0" />
            <div>
              <span className="font-semibold text-ink block">{t('earnings.logistics')}</span>
              <span className="text-ink-muted text-[11px]">{logisticsPercent}%</span>
              {totalAmountPaise && (
                <span className="text-[11px] text-ink-muted block">
                  {formatCurrency((totalAmountPaise * logisticsPercent) / 100)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 shrink-0" />
            <div>
              <span className="font-semibold text-ink block">{t('earnings.platformFee')}</span>
              <span className="text-ink-muted text-[11px]">{platformPercent}%</span>
              {totalAmountPaise && (
                <span className="text-[11px] text-ink-muted block">
                  {formatCurrency((totalAmountPaise * platformPercent) / 100)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Traditional comparison */}
      <div className="pt-4 border-t border-border-light space-y-2">
        <div className="flex justify-between items-center text-xs text-ink-muted">
          <span>{t('earnings.traditional')}</span>
          <span className="text-[10px] italic">Illustrative estimate</span>
        </div>

        <div className="h-4 w-full rounded-lg overflow-hidden flex text-[9px] font-bold text-white bg-slate-200">
          <div
            style={{ width: '33%' }}
            className="bg-amber-700 flex items-center justify-center"
            title="Farmer receives ~30-35%"
          >
            ~33%
          </div>
          <div
            style={{ width: '67%' }}
            className="bg-red-800 flex items-center justify-center"
            title="Intermediaries & leakages take ~67%"
          >
            4-6 Intermediaries ~67%
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-ink-muted">
          <span className="text-amber-800 font-medium">{t('earnings.traditionalFarmer')}</span>
          <span className="text-red-700 font-medium">{t('earnings.traditionalIntermediary')}</span>
        </div>
      </div>
    </div>
  );
};
