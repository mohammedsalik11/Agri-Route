'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import { Sprout, Store, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { t } = useT();
  const { language } = useLanguage();
  const router = useRouter();

  const [role, setRole] = useState<'farmer' | 'wholesaler'>('farmer');
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [district, setDistrict] = useState('Mandya');
  const [state, setState] = useState('Karnataka');
  const [village, setVillage] = useState('Dudda');
  const [landSizeAcres, setLandSizeAcres] = useState('1.5');
  const [category, setCategory] = useState<'general' | 'sc' | 'st' | 'obc'>('general');
  const [crops, setCrops] = useState('tomato, ragi');
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read intended role from cookie
    const cookies = document.cookie.split('; ');
    const roleCookie = cookies.find((c) => c.startsWith('intendedRole='));
    if (roleCookie) {
      const val = roleCookie.split('=')[1];
      if (val === 'wholesaler' || val === 'farmer') {
        setRole(val);
        if (val === 'wholesaler') {
          setIdNumber('WS-KA-2026-1183');
          setName('Suresh Kumar');
          setBusinessName('Suresh Traders');
          setDistrict('Bengaluru Urban');
        } else {
          setIdNumber('KA-MAN-2026-004417');
          setName('Lakshmamma');
        }
      }
    } else {
      setIdNumber('KA-MAN-2026-004417');
      setName('Lakshmamma');
    }
  }, []);

  const handleApplyDemoId = (demoId: string, demoName: string, demoRole: 'farmer' | 'wholesaler') => {
    setRole(demoRole);
    setIdNumber(demoId);
    setName(demoName);
    setError(null);
    if (demoRole === 'farmer') {
      setDistrict('Mandya');
      setVillage('Dudda');
      setLandSizeAcres('1.5');
      setCrops('tomato, ragi');
    } else {
      setDistrict('Bengaluru Urban');
      setBusinessName('Suresh Traders');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name,
          idNumber,
          district,
          state,
          village: role === 'farmer' ? village : undefined,
          landSizeAcres: role === 'farmer' ? parseFloat(landSizeAcres) : undefined,
          category: role === 'farmer' ? category : undefined,
          primaryCrops: role === 'farmer' ? crops.split(',').map((c) => c.trim().toLowerCase()) : undefined,
          businessName: role === 'wholesaler' ? businessName : undefined,
          gstin: role === 'wholesaler' ? gstin : undefined,
          language,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.message || 'Verification failed');
        setLoading(false);
        return;
      }

      // Success -> Redirect to respective dashboard
      if (role === 'farmer') {
        router.push('/farmer');
      } else {
        router.push('/wholesaler');
      }
    } catch {
      setError('Network error during verification');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-field-green text-white text-2xl mb-3">
            🌾
          </div>
          <h1 className="text-2xl font-bold text-ink">{t('onboarding.title')}</h1>
          <p className="text-xs text-ink-muted mt-1">
            Government Registry Verification &amp; Profile Setup
          </p>
        </div>

        {/* Demo IDs Quick Fill */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
            <span>🔑</span> {t('onboarding.demoIds')} (Tap to populate):
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyDemoId('KA-MAN-2026-004417', 'Lakshmamma', 'farmer')}
              className="px-3 py-1.5 bg-white rounded-lg border border-amber-300 text-xs font-semibold text-field-green hover:bg-field-green/5 flex items-center gap-1"
            >
              <Sprout className="w-3.5 h-3.5" />
              Lakshmamma (Farmer, Mandya)
            </button>
            <button
              type="button"
              onClick={() => handleApplyDemoId('WS-KA-2026-1183', 'Suresh Kumar', 'wholesaler')}
              className="px-3 py-1.5 bg-white rounded-lg border border-amber-300 text-xs font-semibold text-earth hover:bg-earth/5 flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              Suresh Traders (Wholesaler, BLR)
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role switch */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-paper rounded-xl border border-border mb-4">
              <button
                type="button"
                onClick={() => {
                  setRole('farmer');
                  setIdNumber('KA-MAN-2026-004417');
                  setName('Lakshmamma');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'farmer'
                    ? 'bg-field-green text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Sprout className="w-4 h-4" />
                {t('role.farmer')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('wholesaler');
                  setIdNumber('WS-KA-2026-1183');
                  setName('Suresh Kumar');
                  setBusinessName('Suresh Traders');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'wholesaler'
                    ? 'bg-earth text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Store className="w-4 h-4" />
                {t('role.wholesaler')}
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-alert-red/10 border border-alert-red/30 rounded-xl flex items-center gap-2 text-alert-red text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Common fields */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t('onboarding.name')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green outline-none"
              />
            </div>

            {/* ID verification field */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {role === 'farmer' ? t('onboarding.farmerId') : t('onboarding.wholesalerId')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={role === 'farmer' ? 'KA-MAN-2026-004417' : 'WS-KA-2026-1183'}
                  className="w-full px-3.5 py-2.5 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-field-green outline-none"
                />
                <span className="absolute right-3 top-2.5 text-field-green">
                  <CheckCircle className="w-5 h-5 opacity-80" />
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1.5 italic leading-snug">
                {t('onboarding.verifyNote')}
              </p>
            </div>

            {/* Farmer Specific Fields */}
            {role === 'farmer' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {t('onboarding.district')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {t('onboarding.village')}
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {t('onboarding.landSize')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={landSizeAcres}
                      onChange={(e) => setLandSizeAcres(e.target.value)}
                      className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {t('onboarding.category')}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as 'general' | 'sc' | 'st' | 'obc')}
                      className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-xs"
                    >
                      <option value="general">General</option>
                      <option value="obc">OBC</option>
                      <option value="sc">SC</option>
                      <option value="st">ST</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {t('onboarding.crops')} (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={crops}
                    onChange={(e) => setCrops(e.target.value)}
                    placeholder="tomato, onion, ragi"
                    className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-xs"
                  />
                </div>
              </>
            )}

            {/* Wholesaler Specific Fields */}
            {role === 'wholesaler' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {t('onboarding.businessName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {t('onboarding.gstin')}
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {t('onboarding.district')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-xs"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-field-green text-white font-bold text-sm rounded-xl hover:bg-field-green-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('onboarding.verifying')}</span>
                </>
              ) : (
                <span>{t('onboarding.verify')}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
