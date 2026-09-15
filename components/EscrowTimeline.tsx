'use client';

import React from 'react';
import { useT } from '@/lib/i18n/LanguageProvider';
import { CheckCircle2, Clock, ShieldCheck, Truck, Key, AlertCircle } from 'lucide-react';
import { SimulatedBadge } from './SimulatedBadge';

export type EscrowStep =
  | 'CREATED'
  | 'PAYMENT_HELD'
  | 'AWAITING_PICKUP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RELEASED'
  | 'DISPUTED';

interface EscrowTimelineProps {
  currentStatus: EscrowStep;
  handoverOtp?: string;
  isFarmer?: boolean;
  onGenerateOtp?: () => void;
  onConfirmDelivery?: (otp: string) => void;
  onRaiseDispute?: (reason: string) => void;
}

export const EscrowTimeline: React.FC<EscrowTimelineProps> = ({
  currentStatus,
  handoverOtp,
  isFarmer = false,
  onGenerateOtp,
  onConfirmDelivery,
  onRaiseDispute,
}) => {
  const { t } = useT();
  const [inputOtp, setInputOtp] = React.useState('');
  const [disputeReason, setDisputeReason] = React.useState('');
  const [showDispute, setShowDispute] = React.useState(false);

  const steps: { key: EscrowStep; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'PAYMENT_HELD',
      label: t('escrow.paymentHeld'),
      icon: <ShieldCheck className="w-5 h-5" />,
      desc: 'Buyer deposited full funds into secure escrow hold.',
    },
    {
      key: 'AWAITING_PICKUP',
      label: t('escrow.awaitingPickup'),
      icon: <Key className="w-5 h-5" />,
      desc: 'Produce packed at farm centroid. 6-digit OTP generated.',
    },
    {
      key: 'IN_TRANSIT',
      label: t('escrow.inTransit'),
      icon: <Truck className="w-5 h-5" />,
      desc: 'Truck dispatched with pooled harvest.',
    },
    {
      key: 'RELEASED',
      label: t('escrow.released'),
      icon: <CheckCircle2 className="w-5 h-5" />,
      desc: 'OTP verified on arrival; payout settled to farmers.',
    },
  ];

  const orderOfSteps: EscrowStep[] = [
    'CREATED',
    'PAYMENT_HELD',
    'AWAITING_PICKUP',
    'IN_TRANSIT',
    'DELIVERED',
    'RELEASED',
  ];

  const currentIndex = orderOfSteps.indexOf(currentStatus);

  return (
    <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">
            Escrow Trust Stack & Settlement
          </h3>
          <p className="text-xs text-ink-muted">
            Zero counterparty risk — funds release only on verified physical handover
          </p>
        </div>
        <SimulatedBadge label="SIMULATED RAILS" />
      </div>

      {/* Vertical Step Timeline */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-border before:-z-0">
        {steps.map((step) => {
          const stepIndex = orderOfSteps.indexOf(step.key);
          const isDone = currentIndex >= stepIndex && currentStatus !== 'DISPUTED';
          const isCurrent = currentStatus === step.key;

          return (
            <div key={step.key} className="flex items-start gap-3 relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? 'bg-field-green text-paper'
                    : isCurrent
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-paper text-ink-muted border border-border'
                }`}
              >
                {step.icon}
              </div>

              <div className="flex-1 bg-paper/60 rounded-xl p-3 border border-border/60">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-semibold ${isDone ? 'text-field-green' : 'text-ink'}`}>
                    {step.label}
                  </span>
                  {isDone && <span className="text-[11px] text-field-green font-medium">Completed</span>}
                  {isCurrent && <span className="text-[11px] text-amber-700 font-bold">In Progress</span>}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disputed State */}
      {currentStatus === 'DISPUTED' && (
        <div className="bg-alert-red/10 border border-alert-red/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-alert-red shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-alert-red text-sm">{t('escrow.disputed')}</p>
            <p className="text-xs text-ink mt-0.5">
              Order holds in dispute until resolved by arbitration.
            </p>
          </div>
        </div>
      )}

      {/* OTP Generation for Farmer */}
      {isFarmer && currentStatus === 'PAYMENT_HELD' && onGenerateOtp && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-emerald-900">
            Payment is secured in escrow. Ready to hand over to transporter?
          </p>
          <button
            onClick={onGenerateOtp}
            className="w-full py-2.5 px-4 bg-field-green text-paper rounded-xl text-sm font-semibold hover:bg-field-green-light"
          >
            {t('escrow.generateOtp')}
          </button>
        </div>
      )}

      {/* OTP Display for Farmer */}
      {isFarmer && handoverOtp && currentStatus === 'AWAITING_PICKUP' && (
        <div className="bg-paper border-2 border-dashed border-field-green rounded-xl p-4 text-center space-y-1">
          <p className="text-xs text-ink-muted uppercase font-bold">Your Handover OTP</p>
          <p className="text-3xl font-mono font-extrabold tracking-widest text-field-green">
            {handoverOtp}
          </p>
          <p className="text-[11px] text-ink-muted">
            Share this 6-digit OTP with the buyer/driver ONLY after produce is inspected and loaded.
          </p>
        </div>
      )}

      {/* OTP Confirmation for Buyer / Wholesaler */}
      {!isFarmer && (currentStatus === 'IN_TRANSIT' || currentStatus === 'AWAITING_PICKUP') && onConfirmDelivery && (
        <div className="bg-paper border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-ink">
            Inspect produce and enter farmer&apos;s 6-digit Handover OTP to release funds:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={inputOtp}
              onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              className="flex-1 px-3 py-2 border border-border rounded-xl text-center font-mono text-lg font-bold tracking-widest bg-white"
            />
            <button
              onClick={() => inputOtp.length === 6 && onConfirmDelivery(inputOtp)}
              disabled={inputOtp.length !== 6}
              className="px-5 py-2 bg-field-green text-paper font-semibold text-sm rounded-xl disabled:opacity-50 hover:bg-field-green-light"
            >
              Verify & Release
            </button>
          </div>

          {/* Dispute trigger */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowDispute(!showDispute)}
              className="text-xs text-alert-red font-medium underline"
            >
              Issue with produce quality or delivery?
            </button>
          </div>

          {showDispute && onRaiseDispute && (
            <div className="space-y-2 pt-2 border-t border-border-light">
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe mismatch or damage..."
                className="w-full text-xs p-2 border border-border rounded-lg bg-white"
                rows={2}
              />
              <button
                onClick={() => disputeReason && onRaiseDispute(disputeReason)}
                className="w-full py-1.5 bg-alert-red text-white text-xs font-semibold rounded-lg"
              >
                Raise Dispute & Freeze Funds
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
