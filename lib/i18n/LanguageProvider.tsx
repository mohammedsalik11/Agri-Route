'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'kn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (paise: number) => string;
  formatWeight: (kg: number) => string;
  formatNumber: (n: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Lazy-load messages
const messageCache: Record<Language, Record<string, string> | null> = {
  en: null,
  hi: null,
  kn: null,
};

async function loadMessages(lang: Language): Promise<Record<string, string>> {
  if (messageCache[lang]) return messageCache[lang]!;
  const mod = await import(`./messages/${lang}.json`);
  messageCache[lang] = mod.default;
  return mod.default;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agri-route-lang') as Language | null;
    if (saved && ['en', 'hi', 'kn'].includes(saved)) {
      setLanguageState(saved);
    }
    // Also check cookie
    const cookieLang = document.cookie
      .split('; ')
      .find(c => c.startsWith('lang='))
      ?.split('=')[1] as Language | undefined;
    if (cookieLang && ['en', 'hi', 'kn'].includes(cookieLang)) {
      setLanguageState(cookieLang);
    }
  }, []);

  // Load messages whenever language changes
  useEffect(() => {
    setLoaded(false);
    loadMessages(language).then(msgs => {
      setMessages(msgs);
      setLoaded(true);
    });
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agri-route-lang', lang);
    // Set cookie for middleware/server access
    document.cookie = `lang=${lang};path=/;max-age=${60 * 60 * 24 * 365}`;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = messages[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return value;
    },
    [messages]
  );

  const formatCurrency = useCallback((paise: number): string => {
    return currencyFormatter.format(paise / 100);
  }, []);

  const formatWeight = useCallback((kg: number): string => {
    return `${numberFormatter.format(kg)} kg`;
  }, []);

  const formatNumber = useCallback((n: number): string => {
    return numberFormatter.format(n);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-pulse text-field-green text-xl font-semibold">
          Agri Route
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, formatCurrency, formatWeight, formatNumber }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useT must be used inside LanguageProvider');
  return ctx;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return { language: ctx.language, setLanguage: ctx.setLanguage };
}
