'use client';

import React, { useEffect } from 'react';
import { useLanguage, useT } from '@/lib/i18n/LanguageProvider';
import { useRouter } from 'next/navigation';

import { Languages } from 'lucide-react';
import type { Language } from '@/lib/i18n/LanguageProvider';

const languages: { code: Language; label: string; script: string }[] = [
  { code: 'kn', label: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'hi', label: 'हिंदी', script: 'Hindi' },
  { code: 'en', label: 'English', script: 'English' },
];

export default function LanguageSelectPage() {
  const { setLanguage } = useLanguage();
  const { t } = useT();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.data?.role) {
          const role = data.data.role;
          document.cookie = `userRole=${role};path=/;max-age=${60 * 60 * 24 * 365}`;
          router.replace(role === 'farmer' ? '/farmer' : role === 'wholesaler' ? '/wholesaler' : '/driver');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    router.push('/sign-up');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-paper">
      {/* Logo + Brand */}
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl bg-white p-3 border border-border shadow-lg mb-4 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Agri Route Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-extrabold text-field-green tracking-tight">
          {t('app.name')}
        </h1>
        <p className="text-ink font-semibold mt-1.5 text-sm">
          {t('app.tagline')}
        </p>
        <p className="text-ink-muted mt-1 text-xs max-w-xs">
          {t('app.subtagline')}
        </p>
      </div>

      {/* Language selector */}
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 text-ink-muted mb-4 px-1">
          <Languages className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {t('language.title')}
          </span>
        </div>

        <div className="space-y-3">
          {languages.map(({ code, label, script }) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className="w-full flex items-center justify-between px-6 py-5 bg-white rounded-2xl border-2 border-border
                         hover:border-field-green hover:bg-field-green/5 hover:shadow-sm transition-all
                         active:scale-[0.98] touch-manipulation min-h-[64px]"
            >
              <span className="text-xl font-semibold text-ink">{label}</span>
              <span className="text-sm text-ink-muted">{script}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer tagline */}
      <p className="mt-12 text-xs text-ink-muted text-center max-w-xs leading-relaxed">
        {t('app.footerNote')}
      </p>
    </main>
  );
}
