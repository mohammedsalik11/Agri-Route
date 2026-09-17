'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { FairPriceGauge } from '@/components/FairPriceGauge';
import { CameraCapture } from '@/components/CameraCapture';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  CROP_CATALOG,
  CROP_CATEGORIES,
  searchCropCatalog,
  type CropCatalogItem,
} from '@/lib/constants/cropCatalog';
import {
  Sparkles,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  CheckCircle,
  Search,
  Truck,
  Plus,
  Package,
} from 'lucide-react';

export interface VehicleOption {
  id: string;
  name: string;
  icon: string;
  capacityKg: number;
  description: string;
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'auto_tempo',
    name: '3-Wheeler / Auto Tempo',
    icon: '🛺',
    capacityKg: 800,
    description: 'Local market delivery (Up to 800 kg)',
  },
  {
    id: 'mini_truck',
    name: 'Mini Truck / Tata Ace',
    icon: '🛻',
    capacityKg: 1500,
    description: 'Small commercial load (Up to 1,500 kg)',
  },
  {
    id: 'pickup',
    name: 'Pickup / Bolero Maxx',
    icon: '🚚',
    capacityKg: 2500,
    description: 'Standard farm pickup (Up to 2,500 kg)',
  },
  {
    id: 'medium_truck',
    name: 'Medium Truck (14–17 ft)',
    icon: '🚛',
    capacityKg: 5000,
    description: 'Inter-district lot (Up to 5,000 kg)',
  },
  {
    id: 'heavy_truck',
    name: 'Heavy Truck (6–10 Wheeler)',
    icon: '🚛',
    capacityKg: 10000,
    description: 'State highway transport (Up to 10,000 kg)',
  },
  {
    id: 'multi_axle',
    name: 'Multi-Axle Heavy Truck',
    icon: '🚛',
    capacityKg: 25000,
    description: 'Max commercial aggregate capacity (Up to 25,000 kg)',
  },
];

export default function CreateListingPage() {
  const { t } = useT();
  const router = useRouter();

  // Search & Catalog state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCropItem, setSelectedCropItem] = useState<CropCatalogItem>(CROP_CATALOG[0]);
  const [isCustomCrop, setIsCustomCrop] = useState(false);
  const [customCropName, setCustomCropName] = useState('');

  // Listing fields
  const [quantityKg, setQuantityKg] = useState('');
  const [askPricePerKg, setAskPricePerKg] = useState('');
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [gradeSource, setGradeSource] = useState<'ai' | 'self-declared'>('self-declared');
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);

  // Vehicle limit selection
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption>(VEHICLE_OPTIONS[2]); // Default Pickup

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Mandi rate & MSP state for gauge
  const [priceData, setPriceData] = useState<{
    mandiMinPerKg: number;
    mandiModalPerKg: number;
    mandiMaxPerKg: number;
    mspPerKg: number | null;
    dataSource: 'LIVE' | 'CACHED';
    date: string;
  }>({
    mandiMinPerKg: 900,
    mandiModalPerKg: 1600,
    mandiMaxPerKg: 2300,
    mspPerKg: null,
    dataSource: 'LIVE',
    date: 'Today',
  });

  const [varieties, setVarieties] = useState<Array<{ variety: string; modalPrice: number }>>([]);
  const [selectedVariety, setSelectedVariety] = useState('');
  const [customVariety, setCustomVariety] = useState('');
  const [isCustomVariety, setIsCustomVariety] = useState(false);
  const [userDistrict, setUserDistrict] = useState('Mandya');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.district) {
          setUserDistrict(data.data.district);
        }
      })
      .catch(() => {});
  }, []);

  // Filtered crops catalog based on search query and category
  const filteredCrops = useMemo(() => {
    return searchCropCatalog(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const activeCropKey = isCustomCrop
    ? customCropName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'custom_produce'
    : selectedCropItem.id;

  const activeCropDisplayName = isCustomCrop
    ? customCropName.trim() || 'Custom Crop'
    : selectedCropItem.name;

  // Build variety list with dynamic modal prices
  const buildVarietyListWithPrices = (
    cropItem: CropCatalogItem,
    baseModal: number,
    apiVarieties: Array<{ variety: string; modalPrice: number }> = []
  ) => {
    const defaultList = cropItem.varieties.length > 0
      ? cropItem.varieties
      : ['Standard / Market Grade', 'Hybrid Quality', 'Desi / Local'];
    const map = new Map<string, { variety: string; modalPrice: number }>();

    // Apply API varieties
    apiVarieties.forEach((v) => {
      if (v.variety) map.set(v.variety.toLowerCase(), { variety: v.variety, modalPrice: v.modalPrice });
    });

    // Fill in presets
    defaultList.forEach((v) => {
      if (!map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), {
          variety: v,
          modalPrice: baseModal,
        });
      }
    });

    return Array.from(map.values());
  };

  // Fetch prices on crop or district change
  useEffect(() => {
    const baseModal = selectedCropItem.baseModalPricePaise;
    const initialList = buildVarietyListWithPrices(selectedCropItem, baseModal);
    setVarieties(initialList);
    setSelectedVariety(initialList[0]?.variety || '');
    setIsCustomVariety(false);
    setCustomVariety('');

    fetch(`/api/prices?crop=${encodeURIComponent(activeCropKey)}&district=${encodeURIComponent(userDistrict)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.data) {
          const liveModal = res.data.mandiModalPerKg || baseModal;
          setPriceData({
            mandiMinPerKg: res.data.mandiMinPerKg || selectedCropItem.baseMinPricePaise,
            mandiModalPerKg: liveModal,
            mandiMaxPerKg: res.data.mandiMaxPerKg || selectedCropItem.baseMaxPricePaise,
            mspPerKg: res.data.mspPerKg ?? selectedCropItem.mspPaise,
            dataSource: res.data.dataSource || 'LIVE',
            date: res.data.mandiDate || 'Today',
          });

          const apiVars = Array.isArray(res.data.varieties) ? res.data.varieties : [];
          const updatedList = buildVarietyListWithPrices(selectedCropItem, liveModal, apiVars);
          setVarieties(updatedList);
        } else {
          setPriceData({
            mandiMinPerKg: selectedCropItem.baseMinPricePaise,
            mandiModalPerKg: selectedCropItem.baseModalPricePaise,
            mandiMaxPerKg: selectedCropItem.baseMaxPricePaise,
            mspPerKg: selectedCropItem.mspPaise,
            dataSource: 'LIVE',
            date: 'Today',
          });
        }
      })
      .catch(() => {});
  }, [selectedCropItem, isCustomCrop, customCropName, userDistrict]);

  // Determine active modal price
  const activeVarietyPrice = useMemo(() => {
    if (isCustomVariety && customVariety.trim()) {
      return priceData.mandiModalPerKg;
    }
    const found = varieties.find(
      (v) => v.variety.toLowerCase() === selectedVariety.toLowerCase()
    );
    return found?.modalPrice || priceData.mandiModalPerKg;
  }, [varieties, selectedVariety, isCustomVariety, customVariety, priceData.mandiModalPerKg]);

  // Pricing calculations
  const askPricePaise = Math.round((parseFloat(askPricePerKg) || 0) * 100);
  const qty = parseFloat(quantityKg) || 0;

  const floorPaise = priceData.mspPerKg
    ? Math.max(priceData.mspPerKg, Math.round(activeVarietyPrice * 0.75))
    : Math.round(activeVarietyPrice * 0.75);

  const fairBandHiPaise = Math.round(activeVarietyPrice * 1.05);

  const verdict = useMemo(() => {
    if (askPricePaise < floorPaise) return 'BELOW_FLOOR';
    if (askPricePaise > fairBandHiPaise) return 'ABOVE_MARKET';
    return 'FAIR';
  }, [askPricePaise, floorPaise, fairBandHiPaise]);

  const extraEarningVsFloor =
    askPricePaise < floorPaise ? (floorPaise - askPricePaise) * qty : 0;

  // Vehicle capacity validation
  const isOverVehicleCapacity = qty > selectedVehicle.capacityKg;
  const capacityPercent = Math.min(100, Math.round((qty / selectedVehicle.capacityKg) * 100));

  // Handle camera capture & AI grading
  const handleCameraCapture = async (base64: string, mimeType: string) => {
    setAnalyzingPhoto(true);
    setAiNotes(null);
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (data.ok && data.data) {
        setQualityGrade(data.data.grade);
        setGradeSource('ai');
        setAiNotes(
          `${data.data.notes} (Confidence: ${(data.data.confidence * 100).toFixed(0)}%)`
        );
      }
    } catch {
      setQualityGrade('A');
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverVehicleCapacity) {
      setError(
        `Quantity (${qty} kg) exceeds selected ${selectedVehicle.name} capacity (${selectedVehicle.capacityKg} kg). Please reduce quantity or choose a larger transport vehicle.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    const finalVariety = isCustomVariety ? customVariety.trim() : selectedVariety;

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: activeCropKey,
          variety: finalVariety || undefined,
          quantityKg: qty,
          askPricePerKg: askPricePaise,
          qualityGrade,
          gradeSource,
          lat: 12.52,
          lng: 76.89,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.message || 'Failed to list produce');
        setLoading(false);
        return;
      }

      router.push('/farmer/pools');
    } catch {
      setError('Network error creating listing');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-20">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{t('listing.create')}</h1>
          <p className="text-xs text-ink-muted mt-1">
            Search 1,000+ agricultural categories, enforce transport vehicle capacity limits, and pool harvest at fair prices.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Crop Selection with 1000 Categories Search */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                1. Select Crop / Produce (1,000+ Categories)
              </label>
              <span className="text-[11px] font-semibold text-field-green">
                Selected: {activeCropDisplayName}
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CROP_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    selectedCategory === cat
                      ? 'bg-field-green text-white shadow-xs'
                      : 'bg-paper text-ink hover:bg-stone-100 border border-border/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search crops by English, Kannada (ಟೊಮ್ಯಾಟೊ, ಈರುಳ್ಳಿ), Hindi (टमाटर, प्याज), or variety..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-24 py-2.5 bg-paper/60 border border-border focus:border-field-green focus:bg-white rounded-xl text-xs text-ink outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomCrop(true);
                  if (searchQuery.trim()) {
                    setCustomCropName(searchQuery.trim());
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-field-green/10 text-field-green font-bold text-[11px] rounded-lg hover:bg-field-green/20"
              >
                + Custom
              </button>
            </div>

            {/* Custom Crop Input Box */}
            {isCustomCrop && (
              <div className="p-3 bg-field-green/5 border border-field-green/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-field-green">
                    Custom Crop / Variety Entry:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomCrop(false)}
                    className="text-[11px] text-ink-muted hover:underline"
                  >
                    Select from catalog
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter custom crop name (e.g. Ooty Fresh Garlic, Coorg Robusta Cherry)..."
                  value={customCropName}
                  onChange={(e) => setCustomCropName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border rounded-xl text-xs text-ink focus:border-field-green outline-hidden"
                  autoFocus
                />
              </div>
            )}

            {/* Grid of Filtered Crops */}
            {!isCustomCrop && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredCrops.map((c) => {
                  const isSelected = selectedCropItem.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCropItem(c);
                        setIsCustomCrop(false);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-field-green bg-field-green/10 text-field-green font-bold shadow-xs'
                          : 'border-border bg-paper/40 hover:bg-white text-ink'
                      }`}
                    >
                      <span className="text-xl shrink-0">{c.emoji}</span>
                      <div className="min-w-0">
                        <span className="text-xs block font-bold truncate">{c.name}</span>
                        <span className="text-[10px] text-ink-muted block truncate">
                          {c.kannadaName || c.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 1b: Variety / Cultivar Selection */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                1b. Variety &amp; Mandi Benchmarks
              </label>
              <span className="text-[11px] text-ink-muted font-semibold">
                {activeCropDisplayName}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {varieties.map((v) => {
                const isChosen =
                  !isCustomVariety && selectedVariety.toLowerCase() === v.variety.toLowerCase();
                return (
                  <button
                    key={v.variety}
                    type="button"
                    onClick={() => {
                      setSelectedVariety(v.variety);
                      setIsCustomVariety(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isChosen
                        ? 'bg-field-green text-white border-field-green shadow-xs'
                        : 'bg-paper/70 text-ink border-border hover:border-field-green/50 hover:bg-white'
                    }`}
                  >
                    {isChosen && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    <span>{v.variety}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isChosen
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      ₹{(v.modalPrice / 100).toFixed(1)}/kg
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsCustomVariety(true);
                  setSelectedVariety('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isCustomVariety
                    ? 'bg-field-green text-white border-field-green shadow-xs'
                    : 'bg-paper/70 text-ink border-border hover:border-field-green/50 hover:bg-white'
                }`}
              >
                + Custom Variety
              </button>
            </div>

            {isCustomVariety && (
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Enter specific variety name..."
                  value={customVariety}
                  onChange={(e) => setCustomVariety(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border focus:border-field-green text-xs bg-paper/40 outline-hidden"
                  autoFocus
                />
              </div>
            )}

            {/* Benchmark highlight banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mt-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-950">
                    Live APMC Reference: ₹{(activeVarietyPrice / 100).toFixed(1)} / kg
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    {userDistrict} APMC Yard ({priceData.date})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAskPricePerKg((activeVarietyPrice / 100).toFixed(1))}
                className="px-3 py-1.5 bg-field-green text-white text-xs font-bold rounded-lg hover:bg-field-green-dark transition-all shadow-xs shrink-0"
              >
                Apply ₹{(activeVarietyPrice / 100).toFixed(1)}/kg
              </button>
            </div>
          </div>

          {/* Section 2: Vehicle Capacity & Transport Limit */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                2. Transport Vehicle &amp; Capacity Limit
              </label>
              <span className="text-xs font-bold text-field-green flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                Max Limit: {selectedVehicle.capacityKg.toLocaleString()} kg
              </span>
            </div>

            {/* Vehicle Selection Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VEHICLE_OPTIONS.map((v) => {
                const isSelected = selectedVehicle.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVehicle(v)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-field-green bg-field-green/10 text-ink shadow-xs'
                        : 'border-border bg-paper/40 hover:bg-white text-ink-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{v.icon}</span>
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-field-green border border-border/80">
                        {v.capacityKg.toLocaleString()} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-ink block truncate">{v.name}</span>
                      <span className="text-[10px] text-ink-muted block truncate mt-0.5">
                        {v.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Capacity Meter */}
            {qty > 0 && (
              <div className="p-3 bg-stone-50 rounded-xl border border-border space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink">
                    Vehicle Load: {qty.toLocaleString()} / {selectedVehicle.capacityKg.toLocaleString()} kg
                  </span>
                  <span
                    className={`font-bold ${
                      isOverVehicleCapacity ? 'text-red-600' : 'text-field-green'
                    }`}
                  >
                    {capacityPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverVehicleCapacity
                        ? 'bg-red-500'
                        : capacityPercent > 80
                        ? 'bg-amber-500'
                        : 'bg-field-green'
                    }`}
                    style={{ width: `${Math.min(100, capacityPercent)}%` }}
                  />
                </div>
                {isOverVehicleCapacity && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Cannot list more than vehicle capacity limit ({selectedVehicle.capacityKg.toLocaleString()} kg). Please adjust quantity or select a larger transport vehicle.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section 3: AI Quality Assay */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">
                3. Produce Photo &amp; AI Quality Assay
              </label>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Gemini Vision Assay
              </span>
            </div>

            {analyzingPhoto ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-field-green" />
                <p className="text-xs font-semibold text-field-green">
                  Analyzing produce with Gemini Vision…
                </p>
              </div>
            ) : gradeSource === 'ai' && aiNotes ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-800">AI Grade: {qualityGrade} verified</p>
                  <p className="text-emerald-700 mt-0.5">{aiNotes}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGradeSource('self-declared');
                    setAiNotes(null);
                  }}
                  className="ml-auto text-[10px] text-ink-muted hover:text-ink underline"
                >
                  Retake
                </button>
              </div>
            ) : (
              <CameraCapture onCapture={handleCameraCapture} disabled={analyzingPhoto} />
            )}

            {/* Quality Grade Selector */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-ink">Assayed Grade:</span>
                <span className="text-[11px] font-bold text-field-green">
                  {gradeSource === 'ai' ? '🤖 AI Verified' : '✏️ Self Declared'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['A', 'B', 'C'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setQualityGrade(g);
                      setGradeSource('self-declared');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      qualityGrade === g
                        ? 'border-field-green bg-field-green text-white shadow-xs'
                        : 'border-border bg-paper/60 text-ink hover:bg-white'
                    }`}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Quantity & Ask Price */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-4">
            <label className="text-xs font-bold text-ink uppercase tracking-wider block">
              4. Quantity &amp; Price
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <div className="flex items-center justify-between h-5 mb-1.5">
                  <label className="text-xs font-semibold text-ink">Quantity (kg)</label>
                  <span className="text-[10px] text-ink-muted">
                    Max: {selectedVehicle.capacityKg.toLocaleString()} kg
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedVehicle.capacityKg}
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-paper/50 border rounded-xl text-base font-bold font-mono outline-hidden ${
                      isOverVehicleCapacity
                        ? 'border-red-500 text-red-700 focus:border-red-600'
                        : 'border-border focus:border-field-green text-ink'
                    }`}
                    placeholder="e.g. 600"
                  />
                  <span className="absolute right-3 top-3 text-xs text-ink-muted font-bold">
                    KG
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between h-5 mb-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Your Ask Price (₹ per kg)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAskPricePerKg((activeVarietyPrice / 100).toFixed(1))}
                    className="text-[11px] font-bold text-field-green hover:underline leading-none"
                  >
                    Use Mandi (₹{(activeVarietyPrice / 100).toFixed(1)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-ink">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    required
                    min="1"
                    value={askPricePerKg}
                    onChange={(e) => setAskPricePerKg(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-paper/50 border border-border rounded-xl text-base font-bold font-mono focus:border-field-green outline-hidden"
                    placeholder="e.g. 14"
                  />
                  <span className="absolute right-3 top-3 text-xs text-ink-muted font-bold">
                    / KG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Fair Price Gauge */}
          <FairPriceGauge
            askPricePerKg={askPricePaise}
            mandiMinPerKg={Math.round(activeVarietyPrice * 0.75)}
            mandiModalPerKg={activeVarietyPrice}
            mandiMaxPerKg={Math.round(activeVarietyPrice * 1.25)}
            mspPerKg={priceData.mspPerKg}
            verdict={verdict}
            extraEarningVsFloor={extraEarningVsFloor}
            dataSource={priceData.dataSource}
            checkedDate={priceData.date}
            cropName={`${selectedVariety || activeCropDisplayName}`}
          />

          {/* Pool Match Preview */}
          <div className="bg-field-green/10 border border-field-green/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl">🚚</span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-field-green text-sm">
                Automatic Pool Matching Active
              </p>
              <p className="text-ink">
                Your <span className="font-bold">{quantityKg || '0'} kg</span> of{' '}
                <span className="capitalize font-bold">{activeCropDisplayName}</span> will automatically aggregate with nearby farmers in{' '}
                <span className="font-bold">{userDistrict}</span> to build complete {selectedVehicle.name} lots.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isOverVehicleCapacity || qty <= 0}
            className="w-full py-4 px-6 bg-field-green text-white font-bold text-base rounded-2xl hover:bg-field-green-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Publishing listing &amp; joining pool...</span>
              </>
            ) : (
              <>
                <span>Publish Listing ({selectedVehicle.name})</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
