'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ReadAloud } from '@/components/ReadAloud';
import { useT } from '@/lib/i18n/LanguageProvider';
import { Award, CheckCircle2, ExternalLink, Calendar, Filter } from 'lucide-react';

interface SchemeItem {
  schemeId: string;
  nameKey: string;
  descriptionKey: string;
  benefit: string;
  category: string;
  applyUrl: string;
  lastDate: string | null;
  matched?: boolean;
  matchReasons?: string[];
}

export default function SchemesPage() {
  const { t } = useT();
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matched' | 'all'>('matched');

  useEffect(() => {
    fetch('/api/schemes/match')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setSchemes(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayedSchemes =
    activeTab === 'matched'
      ? schemes.filter((s) => s.matched !== false)
      : schemes;

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('schemes.title')}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Personalised matching based on your farm size (1.5 acres), crops (Tomato, Ragi), and Karnataka residency.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-white p-1 rounded-xl border border-border w-fit text-xs font-bold">
          <button
            onClick={() => setActiveTab('matched')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'matched'
                ? 'bg-field-green text-paper shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t('schemes.matched')} ({schemes.filter((s) => s.matched !== false).length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-field-green text-paper shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            All Central &amp; State Schemes ({schemes.length})
          </button>
        </div>

        {/* Schemes List */}
        <div className="space-y-4">
          {displayedSchemes.map((s) => {
            const name = t(s.nameKey) !== s.nameKey ? t(s.nameKey) : s.schemeId.toUpperCase();
            const desc = t(s.descriptionKey) !== s.descriptionKey ? t(s.descriptionKey) : s.benefit;

            return (
              <div
                key={s.schemeId}
                className="bg-white rounded-2xl p-5 border border-border hover:border-field-green/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-ink text-base">{name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-paper border border-border text-ink-light">
                        {s.category}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-field-green mt-0.5">
                      {s.benefit}
                    </p>
                  </div>
                  <ReadAloud text={`${name}. ${desc}. Benefit: ${s.benefit}`} label={name} />
                </div>

                <p className="text-xs text-ink-muted leading-relaxed">
                  {desc}
                </p>

                {/* Match Reasons Pill */}
                {s.matchReasons && s.matchReasons.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-emerald-900 block text-[11px]">
                      ✓ {t('schemes.whyMatch')}:
                    </span>
                    <ul className="list-disc list-inside text-emerald-800 text-[11px] space-y-0.5">
                      {s.matchReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-border-light flex items-center justify-between">
                  <span className="text-[11px] text-ink-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {s.lastDate ? `Deadline: ${s.lastDate}` : t('schemes.noDeadline')}
                  </span>

                  <a
                    href={s.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-field-green text-paper text-xs font-semibold hover:bg-field-green-light"
                  >
                    <span>{t('schemes.apply')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
