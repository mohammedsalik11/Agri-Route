'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import { Sprout, Store, Truck, Warehouse, AlertCircle, Loader2, CheckCircle, Info, ArrowLeft } from 'lucide-react';

import { INDIAN_STATES, getDistrictsForState } from '@/lib/constants/indianStates';

const CROP_OPTIONS = [
  'Tomato', 'Onion', 'Potato', 'Ragi', 'Paddy', 'Maize', 'Wheat',
  'Banana', 'Brinjal', 'Cabbage', 'Cauliflower', 'Groundnut',
  'Soybean', 'Sugarcane', 'Cotton',
];




export default function OnboardingPage() {
  const { t } = useT();
  const { language } = useLanguage();
  const router = useRouter();

  const [role, setRole] = useState<'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner'>('farmer');
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
  // Cold Storage Owner fields
  const [facilityName, setFacilityName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [storageCapacityKg, setStorageCapacityKg] = useState('500000');
  const [pricePerKgPerDay, setPricePerKgPerDay] = useState('15');
  const [facilityAddress, setFacilityAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: role select, Step 2: details
  const availableDistricts = getDistrictsForState(state);

  // Pre-load existing profile data so the user can review/update inputs, but NEVER auto-redirect away
  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.data) {
          const profile = data.data;
          if (profile.role) setRole(profile.role);
          if (profile.name) setName(profile.name);
          if (profile.district) setDistrict(profile.district);
          if (profile.state) setState(profile.state || 'Karnataka');
          if (profile.farmerId) setIdNumber(profile.farmerId);
          if (profile.wholesalerId) setIdNumber(profile.wholesalerId);
          if (profile.driverId) setIdNumber(profile.driverId);
          if (profile.ownerId) setIdNumber(profile.ownerId);
          if (profile.village) setVillage(profile.village);
          if (profile.landSizeAcres) setLandSizeAcres(String(profile.landSizeAcres));
          if (profile.primaryCrops && Array.isArray(profile.primaryCrops)) {
            setSelectedCrops(profile.primaryCrops.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1)));
          }
          if (profile.businessName) setBusinessName(profile.businessName);
          if (profile.gstin) setGstin(profile.gstin);
          if (profile.vehicleType) setVehicleType(profile.vehicleType);
          if (profile.vehicleNumber) setVehicleNumber(profile.vehicleNumber);
          if (profile.vehicleCapacityKg) setVehicleCapacityKg(String(profile.vehicleCapacityKg));
          if (profile.isRefrigerated !== undefined) setIsRefrigerated(profile.isRefrigerated);
          if (profile.facilityName) setFacilityName(profile.facilityName);
          if (profile.licenseNumber) setLicenseNumber(profile.licenseNumber);
          if (profile.storageCapacityKg) setStorageCapacityKg(String(profile.storageCapacityKg));
          if (profile.pricePerKgPerDay) setPricePerKgPerDay(String(profile.pricePerKgPerDay));
          if (profile.facilityAddress) setFacilityAddress(profile.facilityAddress);
        }
      })
      .catch(() => {});

    const cookies = document.cookie.split('; ');
    const roleCookie = cookies.find((c) => c.startsWith('intendedRole='));
    if (roleCookie) {
      const val = roleCookie.split('=')[1];
      if (val === 'wholesaler' || val === 'farmer' || val === 'logistics_driver' || val === 'storage_owner') {
        setRole(val as any);
      }
    }
  }, []);

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleRoleSelect = (r: 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner') => {
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
    if (role === 'storage_owner' && !facilityName.trim()) {
      setError('Please enter your cold-storage facility name.');
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
          businessName: role === 'wholesaler' || role === 'storage_owner' ? businessName.trim() : undefined,
          gstin: role === 'wholesaler' ? gstin.trim() : undefined,
          vehicleType: role === 'logistics_driver' ? vehicleType : undefined,
          vehicleNumber: role === 'logistics_driver' ? vehicleNumber.trim().toUpperCase() : undefined,
          vehicleCapacityKg: role === 'logistics_driver' ? Number(vehicleCapacityKg) || 3000 : undefined,
          isRefrigerated: role === 'logistics_driver' ? isRefrigerated : undefined,
          facilityName: role === 'storage_owner' ? facilityName.trim() : undefined,
          licenseNumber: role === 'storage_owner' ? licenseNumber.trim() : undefined,
          storageCapacityKg: role === 'storage_owner' ? Number(storageCapacityKg) || 500000 : undefined,
          pricePerKgPerDay: role === 'storage_owner' ? Number(pricePerKgPerDay) || 15 : undefined,
          facilityAddress: role === 'storage_owner' ? facilityAddress.trim() : undefined,
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
      if (role === 'storage_owner') destination = '/storage-owner';

      const isAndroidSource = typeof window !== 'undefined' && (
        window.location.search.includes('source=android') ||
        window.navigator.userAgent.includes('Android')
      );

      if (isAndroidSource) {
        const appLink = `agriroute://auth-callback?role=${encodeURIComponent(role)}&name=${encodeURIComponent(name)}&district=${encodeURIComponent(district)}&idNumber=${encodeURIComponent(idNumber)}`;
        window.location.href = appLink;
        setTimeout(() => {
          window.location.href = destination;
        }, 1000);
        return;
      }

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
      <main className="min-h-screen bg-paper flex flex-col items-center justify-between px-4 py-8 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-72 bg-gradient-to-b from-field-green/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="text-center pt-4 mb-6 flex flex-col items-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 border border-border shadow-md mb-3 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Agri Route Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[11px] font-bold text-field-green uppercase tracking-wider bg-field-green/10 px-3 py-1 rounded-full mb-1.5">
            Step 1 of 2 · {t('role.title')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {t('role.title')}
          </h1>
          <p className="text-xs text-ink-muted mt-1 max-w-xs">{t('app.tagline')}</p>
        </div>

        <div className="w-full max-w-md space-y-3.5 my-auto relative z-10">
          {/* Farmer Card */}
          <button
            onClick={() => handleRoleSelect('farmer')}
            className={`w-full flex items-center gap-4 p-4.5 bg-white rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] text-left shadow-xs group min-h-[76px] ${
              role === 'farmer' ? 'border-field-green bg-emerald-50/50 ring-2 ring-field-green/20' : 'border-border hover:border-field-green/60 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-field-green/10 text-field-green flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink text-base">{t('role.farmer')}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-field-green bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {t('onboarding.producer')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{t('role.farmerDesc')}</p>
            </div>
          </button>

          {/* Wholesaler Card */}
          <button
            onClick={() => handleRoleSelect('wholesaler')}
            className={`w-full flex items-center gap-4 p-4.5 bg-white rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] text-left shadow-xs group min-h-[76px] ${
              role === 'wholesaler' ? 'border-earth bg-amber-50/50 ring-2 ring-earth/20' : 'border-border hover:border-earth/60 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-earth/10 text-earth flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink text-base">{t('role.wholesaler')}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-earth bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {t('onboarding.buyer')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{t('role.wholesalerDesc')}</p>
            </div>
          </button>

          {/* Logistics Driver Card */}
          <button
            onClick={() => handleRoleSelect('logistics_driver')}
            className={`w-full flex items-center gap-4 p-4.5 bg-white rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] text-left shadow-xs group min-h-[76px] ${
              role === 'logistics_driver' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-border hover:border-blue-600/60 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink text-base">{t('role.driver') || 'Logistics Driver'}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {t('onboarding.transporter')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{t('role.driverDesc') || 'Deliver produce and earn per trip'}</p>
            </div>
          </button>

          {/* Cold Storage Owner Card */}
          <button
            onClick={() => handleRoleSelect('storage_owner')}
            className={`w-full flex items-center gap-4 p-4.5 bg-white rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] text-left shadow-xs group min-h-[76px] ${
              role === 'storage_owner' ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20' : 'border-border hover:border-teal-600/60 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Warehouse className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink text-base">{t('onboarding.storageOwnerCardTitle')}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {t('onboarding.storageOwnerCardTag')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{t('onboarding.storageOwnerCardDesc')}</p>
            </div>
          </button>
        </div>

        <div className="w-full max-w-md pt-4 text-center relative z-10">
          <p className="text-[11px] text-ink-muted">
            {t('app.footerNote')}
          </p>
        </div>
      </main>
    );
  }

  // Step 2: Profile form
  return (
    <main className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStep(1); setError(null); }}
              className="p-2.5 rounded-xl bg-white border border-border text-ink hover:bg-paper shadow-xs flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('onboarding.changeRole')}</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                {role === 'farmer' && <Sprout className="w-4 h-4 text-field-green" />}
                {role === 'wholesaler' && <Store className="w-4 h-4 text-earth" />}
                {role === 'logistics_driver' && <Truck className="w-4 h-4 text-blue-600" />}
                {role === 'storage_owner' && <Warehouse className="w-4 h-4 text-cyan-700" />}
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  {role === 'storage_owner'
                    ? t('role.storageOwner')
                    : role === 'logistics_driver'
                    ? (t('role.driver') || 'Logistics Driver')
                    : t(`role.${role}`)}
                </span>
              </div>
              <h1 className="text-xl font-bold text-ink">{t('onboarding.title')}</h1>
            </div>
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
                ? 'Format: SS-XXX-YYYY-NNNNNN (e.g. MH-NAS-2026-008129 or KA-MAN-2026-004417)'
                : role === 'wholesaler'
                ? 'Format: WS-SS-YYYY-NNNN (e.g. WS-MH-2026-2041 or WS-KA-2026-1183)'
                : role === 'storage_owner'
                ? 'Format: STO-SS-YYYY-NNNN (e.g. STO-MH-2026-1021 or STO-KA-2026-1001)'
                : 'Format: DRV-SS-YYYY-NNNN (e.g. DRV-MH-2026-3011 or DRV-KA-2026-1042)'}
            </p>
          </div>

          {/* State & District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                {t('onboarding.state')} *
              </label>
              <select
                required
                value={state}
                onChange={(e) => {
                  const newState = e.target.value;
                  setState(newState);
                  const newDists = getDistrictsForState(newState);
                  if (!newDists.includes(district)) {
                    setDistrict('');
                  }
                }}
                className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                {t('onboarding.district')} *
              </label>
              <select
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
              >
                <option value="">{t('onboarding.selectDistrict')}</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Driver-specific fields */}
          {role === 'logistics_driver' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.vehicleType')} *
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
                    {t('onboarding.vehicleNumber')} *
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
                    {t('onboarding.vehicleMaxLoad')} *
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
                    <span className="text-xs font-semibold text-ink">{t('onboarding.refrigeratedColdChain')}</span>
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
                  placeholder="e.g. Suresh Traders"
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

          {/* Cold-Storage Provider specific fields */}
          {role === 'storage_owner' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t('onboarding.facilityName')} *
                </label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g. Mandya Agri Cold Store / KRS Fresh Storage"
                  className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-cyan-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.licenseNumber')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="WDRA-KA-MAN-2024-0891"
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-cyan-600 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.totalCapacity')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="10000"
                    step="5000"
                    value={storageCapacityKg}
                    onChange={(e) => setStorageCapacityKg(e.target.value)}
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-cyan-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.rentalPrice')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="100"
                    value={pricePerKgPerDay}
                    onChange={(e) => setPricePerKgPerDay(e.target.value)}
                    placeholder="15 (= ₹0.15/kg/day)"
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-cyan-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-ink-muted mt-1">{t('onboarding.paiseNote')}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.facilityAddress')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={facilityAddress}
                    onChange={(e) => setFacilityAddress(e.target.value)}
                    placeholder="e.g. KIADB Industrial Area, Tubinakere"
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-cyan-600 focus:outline-none"
                  />
                </div>
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
