'use client';

import React from 'react';
import { useT } from '@/lib/i18n/LanguageProvider';
import { Users, Truck, CheckCircle2, Clock } from 'lucide-react';

interface PoolProgressBarProps {
  crop: string;
  qualityGrade: 'A' | 'B' | 'C';
  district: string;
  currentKg: number;
  targetKg: number;
  farmerCount: number;
  poolPricePerKg: number; // in paise
  windowEnd?: string;
  status: 'open' | 'ready' | 'locked' | 'sold' | 'expired';
  onJoinClick?: () => void;
  joinButtonText?: string;
  userContributionKg?: number;
  showActionButton?: boolean;
}

export const PoolProgressBar: React.FC<PoolProgressBarProps> = ({
  crop,
  qualityGrade,
  district,
  currentKg,
  targetKg,
  farmerCount,
  poolPricePerKg,
  windowEnd,
  status,
  onJoinClick,
  joinButtonText,
  userContributionKg,
  showActionButton = true,
}) => {
  const { t, formatCurrency, formatWeight } = useT();

  const percentage = Math.min(100, Math.round((currentKg / (targetKg || 1)) * 100));
  const isComplete = currentKg >= targetKg || status === 'ready';

  // Calculate days left
  let daysLeft = 0;
  if (windowEnd) {
    const diff = new Date(windowEnd).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const cropEmojis: Record<string, string> = {
    tomato: '🍅',
    onion: '🧅',
    potato: '🥔',
    paddy: '🌾',
    wheat: '🌾',
    ragi: '🌾',
    maize: '🌽',
    banana: '🍌',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-xs space-y-4 hover:border-field-green/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cropEmojis[crop.toLowerCase()] || '📦'}</span>
            <div>
              <h3 className="font-bold text-ink capitalize text-lg">
                {crop}
              </h3>
              <p className="text-xs text-ink-muted">
                Grade {qualityGrade} · {district}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              status === 'ready' || isComplete
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : status === 'locked'
                ? 'bg-blue-100 text-blue-800'
                : status === 'sold'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {status === 'ready' || isComplete
              ? t('pool.ready')
              : status === 'locked'
              ? t('pool.locked')
              : status === 'sold'
              ? t('pool.sold')
              : t('pool.open')}
          </span>

          {daysLeft > 0 && status === 'open' && (
            <span className="text-[11px] text-ink-muted flex items-center gap-1">
              <Clock className="w-3 h-3 text-ink-muted" />
              {t('pool.closesIn', { days: daysLeft })}
            </span>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs font-medium text-ink-light flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-field-green" />
            {formatWeight(currentKg)} / {formatWeight(targetKg)}
          </span>
          <span className="text-xs font-bold text-field-green">
            {percentage}%
          </span>
        </div>

        <div className="w-full h-3.5 bg-border-light rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isComplete
                ? 'bg-emerald-500'
                : 'bg-field-green'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between pt-1 border-t border-border-light text-xs">
        <div className="flex items-center gap-1.5 text-ink-light font-medium">
          <Users className="w-4 h-4 text-earth" />
          <span>
            {farmerCount} {farmerCount === 1 ? 'farmer' : 'farmers'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-ink-muted text-[11px] block">{t('pool.pooledPrice')}</span>
          <span className="font-bold text-field-green text-sm">
            {formatCurrency(poolPricePerKg)} / kg
          </span>
        </div>
      </div>

      {/* User contribution badge if already participating */}
      {userContributionKg && userContributionKg > 0 && (
        <div className="bg-field-green/5 border border-field-green/20 rounded-lg p-2 text-xs flex items-center justify-between text-field-green">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Your contribution:
          </span>
          <span className="font-bold">{formatWeight(userContributionKg)}</span>
        </div>
      )}

      {/* Action CTA */}
      {showActionButton && onJoinClick && status === 'open' && (
        <button
          onClick={onJoinClick}
          className="w-full py-2.5 px-4 bg-field-green text-white rounded-xl font-semibold text-sm hover:bg-field-green-light active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {joinButtonText || 'Join this pool'}
        </button>
      )}
    </div>
  );
};
