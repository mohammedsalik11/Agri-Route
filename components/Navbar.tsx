'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage, useT } from '@/lib/i18n/LanguageProvider';
import { Sprout, Store, Globe, Activity } from 'lucide-react';
import type { Language } from '@/lib/i18n/LanguageProvider';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const { t } = useT();

  const isFarmer = pathname.startsWith('/farmer');
  const isWholesaler = pathname.startsWith('/wholesaler');
  const isDemo = pathname === '/demo';

  const nextLang: Record<Language, Language> = {
    en: 'kn',
    kn: 'hi',
    hi: 'en',
  };

  const langLabels: Record<Language, string> = {
    en: 'EN',
    kn: 'ಕನ್ನಡ',
    hi: 'हिंदी',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-field-green flex items-center justify-center text-white text-lg">
            🌾
          </div>
          <div>
            <span className="font-bold text-field-green text-lg tracking-tight block leading-tight">
              Agri Route
            </span>
            <span className="text-[10px] text-ink-muted leading-none block">
              SIH-26033
            </span>
          </div>
        </Link>

        {/* Center navigation links */}
        <nav className="hidden sm:flex items-center gap-1 text-xs font-semibold">
          <Link
            href="/farmer"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              isFarmer
                ? 'bg-field-green text-white'
                : 'text-ink-muted hover:text-ink hover:bg-paper'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            {t('role.farmer')}
          </Link>

          <Link
            href="/wholesaler"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              isWholesaler
                ? 'bg-earth text-white'
                : 'text-ink-muted hover:text-ink hover:bg-paper'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            {t('role.wholesaler')}
          </Link>

          <Link
            href="/demo"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              isDemo
                ? 'bg-slate-900 text-white'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Demo Panel
          </Link>
        </nav>

        {/* Right tools: Language switch & Role indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(nextLang[language])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper border border-border text-xs font-semibold text-ink hover:border-field-green transition-all"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-field-green" />
            <span>{langLabels[language]}</span>
          </button>
        </div>
      </div>

      {/* Subnav for Mobile */}
      <div className="sm:hidden flex items-center justify-around border-t border-border-light bg-paper/50 px-2 py-1.5 text-xs font-medium">
        <Link
          href="/farmer"
          className={`flex items-center gap-1 px-3 py-1 rounded-md ${
            isFarmer ? 'bg-field-green text-white font-bold' : 'text-ink-muted'
          }`}
        >
          <Sprout className="w-3.5 h-3.5" />
          Farmer
        </Link>
        <Link
          href="/wholesaler"
          className={`flex items-center gap-1 px-3 py-1 rounded-md ${
            isWholesaler ? 'bg-earth text-white font-bold' : 'text-ink-muted'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Wholesaler
        </Link>
        <Link
          href="/demo"
          className={`flex items-center gap-1 px-3 py-1 rounded-md ${
            isDemo ? 'bg-slate-900 text-white font-bold' : 'text-amber-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Demo
        </Link>
      </div>
    </header>
  );
};
