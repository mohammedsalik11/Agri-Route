'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import { Sprout, Store, Truck, AlertCircle, Loader2, CheckCircle, Info } from 'lucide-react';

const DISTRICTS_KA = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagara', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davangere', 'Dharwad', 'Gadag', 'Hassan',
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir',
];

const CROP_OPTIONS = [
  'Tomato', 'Onion', 'Potato', 'Ragi', 'Paddy', 'Maize', 'Wheat',
  'Banana', 'Brinjal', 'Cabbage', 'Cauliflower', 'Groundnut',
  'Soybean', 'Sugarcane', 'Cotton',
];

export default function OnboardingPage() {
  const { t } = useT();
  const { language } = useLanguage();
  const router = useRouter();

  const [role, setRole] = useState<'farmer' | 'wholesaler' | 'logistics_driver'>('farmer');
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Karnataka');
  const [village, setVillage] = useState('');
  const [landSizeAcres, setLandSizeAcres] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  // Driver fields
  const [vehicleType, setVehicleType] = useState<'truck' | 'mini_truck' | 'pickup' | 'tractor'>('truck');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleCapacityKg, setVehicleCapacityKg] = useState('3000');
  const [isRefrigerated, setIsRefrigerated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: role select, Step 2: details

  // Check if already onboarded in DB or read intended role from cookie
  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.data?.role) {
          document.cookie = `userRole=${data.data.role};path=/;max-age=${60 * 60 * 24 * 365}`;
          let dest = '/farmer';
          if (data.data.role === 'wholesaler') dest = '/wholesaler';
          if (data.data.role === 'logistics_driver') dest = '/driver';
          router.replace(dest);
          return;
        }
      })
      .catch(() => {});

    const cookies = document.cookie.split('; ');
    const roleCookie = cookies.find((c) => c.startsWith('intendedRole='));
    if (roleCookie) {
      const val = roleCookie.split('=')[1];
      if (val === 'wholesaler' || val === 'farmer' || val === 'logistics_driver') {
        setRole(val);
        setStep(2);
      }
    }
  }, [router]);

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleRoleSelect = (r: 'farmer' | 'wholesaler' | 'logistics_driver') => {
    setRole(r);
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation before hitting the API
    if (!name.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }
    if (!district) {
      setError('Please select your district.');
      setLoading(false);
      return;
    }
    if (role === 'wholesaler' && !businessName.trim()) {
      setError('Please enter your business name.');
      setLoading(false);
      return;
    }
    if (role === 'logistics_driver' && !vehicleNumber.trim()) {
      setError('Please enter your vehicle registration number.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/onboarding/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name: name.trim(),
          idNumber: idNumber.trim().toUpperCase(),
          district,
          state,
          village: role === 'farmer' ? village.trim() : undefined,
          landSizeAcres: role === 'farmer' ? parseFloat(landSizeAcres) || undefined : undefined,
          primaryCrops: role === 'farmer' ? selectedCrops.map((c) => c.toLowerCase()) : undefined,
          businessName: role === 'wholesaler' ? businessName.trim() : undefined,
          gstin: role === 'wholesaler' ? gstin.trim() : undefined,
          vehicleType: role === 'logistics_driver' ? vehicleType : undefined,
          vehicleNumber: role === 'logistics_driver' ? vehicleNumber.trim().toUpperCase() : undefined,
          vehicleCapacityKg: role === 'logistics_driver' ? Number(vehicleCapacityKg) || 3000 : undefined,
          isRefrigerated: role === 'logistics_driver' ? isRefrigerated : undefined,
          language,
        }),
      });

      let data: { ok: boolean; message?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        setError(`Server returned an unexpected response (HTTP ${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      if (!data.ok) {
        // Show the exact server message so the user knows what went wrong
        setError(data.message || `Something went wrong (${res.status}). Please check your details and try again.`);
        setLoading(false);
        return;
      }

      // Onboarding succeeded — Clerk publicMetadata is updated on the server.
      let destination = '/farmer';
      if (role === 'wholesaler') destination = '/wholesaler';
      if (role === 'logistics_driver') destination = '/driver';
      window.location.href = destination;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error — please check your connection and try again.';
      setError(msg);
      setLoading(false);
    }
  };

  // Step 1: Role selection
  if (step === 1) {
    return (
      <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-white p-2.5 border border-border shadow-md mb-3.5 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Agri Route Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-ink">{t('role.title')}</h1>
          <p className="text-xs text-ink-muted mt-1">{t('app.tagline')}</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => handleRoleSelect('farmer')}
            className="w-full flex items-center gap-4 px-6 py-5 bg-white rounded-2xl border-2 border-border hover:border-field-green hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-field-green/10 flex items-center justify-center">
              <Sprout className="w-6 h-6 text-field-green" />
            </div>
            <div className="text-left">
              <p className="font-bold text-ink text-base">{t('role.farmer')}</p>
              <p className="text-xs text-ink-muted">{t('role.farmerDesc')}</p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('wholesaler')}
            className="w-full flex items-center gap-4 px-6 py-5 bg-white rounded-2xl border-2 border-border hover:border-earth hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-earth/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-earth" />
            </div>
            <div className="text-left">
              <p className="font-bold text-ink text-base">{t('role.wholesaler')}</p>
              <p className="text-xs text-ink-muted">{t('role.wholesalerDesc')}</p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('logistics_driver')}
            className="w-full flex items-center gap-4 px-6 py-5 bg-white rounded-2xl border-2 border-border hover:border-blue-600 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-bold text-ink text-base">{t('role.driver') || 'Logistics Driver'}</p>
              <p className="text-xs text-ink-muted">{t('role.driverDesc') || 'Deliver produce and earn per trip'}</p>
            </div>
          </button>
        </div>
      </main>
    );
  }

  // Step 2: Profile form
  return (
    <main className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setStep(1); setError(null); }}
            className="p-2 rounded-xl bg-white border border-border text-ink hover:bg-paper"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2">
              {role === 'farmer' && <Sprout className="w-4 h-4 text-field-green" />}
              {role === 'wholesaler' && <Store className="w-4 h-4 text-earth" />}
              {role === 'logistics_driver' && <Truck className="w-4 h-4 text-blue-600" />}
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                {role === 'logistics_driver' ? (t('role.driver') || 'Logistics Driver') : t(`role.${role}`)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-ink">{t('onboarding.title')}</h1>
          </div>
        </div>

        {/* Registry note */}
        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-blue-800">
            {t('onboarding.verifyNote')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              {t('onboarding.name')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none transition-colors"
              placeholder={
                role === 'farmer'
                  ? t('onboarding.namePlaceholderFarmer')
                  : role === 'wholesaler'
                  ? t('onboarding.namePlaceholderWholesaler')
                  : 'Driver / Transporter Name'
              }
            />
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              {role === 'farmer'
                ? t('onboarding.farmerId')
                : role === 'wholesaler'
                ? t('onboarding.wholesalerId')
                : 'Driver ID / Licence Number'} *
            </label>
            <input
              type="text"
              required
              value={idNumber}
              onChange={(e) => { setIdNumber(e.target.value); setError(null); }}
              placeholder={
                role === 'farmer'
                  ? 'KA-MAN-2026-004417'
                  : role === 'wholesaler'
                  ? 'WS-KA-2026-1183'
                  : 'DRV-KA-2026-1042'
              }
              className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-field-green focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-ink-muted mt-1.5">
              {role === 'farmer'
                ? 'Format: KA-XXX-YYYY-NNNNNN (e.g. KA-MAN-2026-004417)'
                : role === 'wholesaler'
                ? 'Format: WS-KA-YYYY-NNNN (e.g. WS-KA-2026-1183)'
                : 'Format: DRV-KA-YYYY-NNNN (e.g. DRV-KA-2026-1042)'}
            </p>
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              {t('onboarding.district')} *
            </label>
            <select
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none appearance-none"
            >
              <option value="">{t('onboarding.selectDistrict')}</option>
              {DISTRICTS_KA.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Driver-specific fields */}
          {role === 'logistics_driver' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Vehicle Type *
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-blue-600 focus:outline-none"
                  >
                    <option value="truck">Truck (Heavy / Multi-axle)</option>
                    <option value="mini_truck">Mini Truck (e.g. Tata Ace / Bolero)</option>
                    <option value="pickup">Pickup Van</option>
                    <option value="tractor">Tractor Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="KA-11-E-4281"
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-blue-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Vehicle Max Load (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="500"
                    max="30000"
                    step="100"
                    value={vehicleCapacityKg}
                    onChange={(e) => setVehicleCapacityKg(e.target.value)}
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 px-3 py-3 bg-paper/50 border border-border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={isRefrigerated}
                      onChange={(e) => setIsRefrigerated(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-semibold text-ink">Refrigerated (Cold Chain)</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Farmer-specific fields */}
          {role === 'farmer' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.village')}
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.landSize')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={landSizeAcres}
                      onChange={(e) => setLandSizeAcres(e.target.value)}
                      className="w-full px-3 py-3 pr-12 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-xs text-ink-muted font-medium">
                      {t('common.acres')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t('onboarding.crops')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CROP_OPTIONS.map((crop) => {
                    const selected = selectedCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selected
                            ? 'bg-field-green text-white border-field-green'
                            : 'bg-white text-ink border-border hover:border-field-green'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Wholesaler-specific fields */}
          {role === 'wholesaler' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t('onboarding.businessName')} *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t('onboarding.gstin')}
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-field-green focus:outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-field-green text-white font-bold text-sm rounded-xl hover:bg-field-green-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('onboarding.verifying')}</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> {t('onboarding.verify')}</>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
