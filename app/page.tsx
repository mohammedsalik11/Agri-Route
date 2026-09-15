'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
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
  const router = useRouter();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    router.push('/role');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-paper">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-field-green mb-4">
          <span className="text-3xl">🌾</span>
        </div>
        <h1 className="text-3xl font-bold text-field-green">Agri Route</h1>
        <p className="text-ink-muted mt-1 text-sm">Fair prices, together</p>
      </div>

      {/* Language selector */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center gap-2 text-ink-muted mb-4">
          <Languages className="w-5 h-5" />
          <span className="text-sm font-medium">Choose your language</span>
        </div>

        {languages.map(({ code, label, script }) => (
          <button
            key={code}
            onClick={() => handleSelect(code)}
            className="w-full flex items-center justify-between px-6 py-5 bg-white rounded-xl border border-border
                       hover:border-field-green hover:bg-field-green/5 transition-all
                       active:scale-[0.98] touch-manipulation"
          >
            <span className="text-xl font-semibold text-ink">{label}</span>
            <span className="text-sm text-ink-muted">{script}</span>
          </button>
        ))}
      </div>

      {/* Demo credentials footer */}
      <div className="mt-12 p-4 bg-amber/10 rounded-xl border border-amber/30 max-w-sm w-full">
        <p className="text-xs font-medium text-amber mb-2">🔑 Demo Credentials</p>
        <div className="space-y-1 text-xs text-ink-muted">
          <p>Farmer ID: <code className="bg-white px-1 rounded">KA-MAN-2026-004417</code></p>
          <p>Wholesaler ID: <code className="bg-white px-1 rounded">WS-KA-2026-1183</code></p>
          <p>Test Phone: <code className="bg-white px-1 rounded">+91 9999999999</code> OTP: <code className="bg-white px-1 rounded">424242</code></p>
        </div>
      </div>
    </main>
  );
}
