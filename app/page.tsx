'use client';

import React, { useEffect } from 'react';
import { useLanguage, useT } from '@/lib/i18n/LanguageProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Languages, ChevronRight, CheckCircle2, ShieldCheck, Sprout } from 'lucide-react';
import type { Language } from '@/lib/i18n/LanguageProvider';

const languages: { code: Language; label: string; script: string; greeting: string }[] = [
  { code: 'kn', label: 'ಕನ್ನಡ', script: 'Kannada', greeting: 'ಸ್ವಾಗತ' },
  { code: 'hi', label: 'हिंदी', script: 'Hindi', greeting: 'नमस्ते' },
  { code: 'en', label: 'English', script: 'English', greeting: 'Welcome' },
];

export default function LanguageSelectPage() {
  const { language, setLanguage } = useLanguage();
  const { t } = useT();
  const router = useRouter();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    router.push('/sign-in');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-4 py-8 bg-paper relative overflow-hidden">
      {/* Ambient background glow matching the brand visual identity */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-to-b from-field-green/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Branding Section */}
      <div className="w-full max-w-md pt-6 flex flex-col items-center text-center relative z-10">
        <div className="relative mb-5 group">
          <div className="w-20 h-20 rounded-3xl bg-white p-3.5 border border-border shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <img
              src="/logo.png"
              alt="Agri Route"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-field-green text-white text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-xs border border-white">
            <Sprout className="w-2.5 h-2.5 text-luminous-lime" />
            DIRECT
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-field-green tracking-tight">
          {t('app.name')}
        </h1>
        <p className="text-ink font-semibold mt-1 text-sm tracking-wide">
          {t('app.tagline')}
        </p>
        <p className="text-ink-muted mt-1 text-xs max-w-xs leading-relaxed">
          {t('app.subtagline')}
        </p>
      </div>

      {/* Main Selection Card */}
      <div className="w-full max-w-md my-auto relative z-10">
        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/80">
            <div className="flex items-center gap-2 text-ink">
              <div className="w-7 h-7 rounded-lg bg-field-green/10 text-field-green flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-light">
                {t('language.title')}
              </span>
            </div>
            <span className="text-[11px] font-medium text-ink-muted">
              3 Languages
            </span>
          </div>

          <div className="space-y-3">
            {languages.map(({ code, label, script, greeting }) => {
              const isCurrent = language === code;
              return (
                <button
                  key={code}
                  onClick={() => handleSelect(code)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.99] touch-manipulation min-h-[64px] text-left group ${
                    isCurrent
                      ? 'border-field-green bg-emerald-50/60 shadow-xs'
                      : 'border-border bg-white hover:border-field-green/40 hover:bg-paper-well'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                        isCurrent
                          ? 'bg-field-green text-white'
                          : 'bg-paper-well text-ink-muted group-hover:bg-field-green/10 group-hover:text-field-green'
                      }`}
                    >
                      {code.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-ink leading-tight">
                          {label}
                        </span>
                        <span className="text-xs text-ink-muted font-medium">
                          ({script})
                        </span>
                      </div>
                      <span className="text-[11px] text-field-green font-medium block">
                        {greeting} · {t('language.continue')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {isCurrent ? (
                      <CheckCircle2 className="w-5 h-5 text-field-green" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-ink-muted group-hover:text-field-green group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-field-green" />
              <span>AgriStack &amp; MSP Protected</span>
            </span>
            <Link
              href="/sign-in"
              className="text-field-green font-bold hover:underline"
            >
              Sign In →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <footer className="w-full max-w-md pt-4 text-center relative z-10">
        <p className="text-xs text-ink-muted leading-relaxed">
          {t('app.footerNote')}
        </p>
      </footer>
    </main>
  );
}
