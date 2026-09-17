'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { FairPriceGauge } from '@/components/FairPriceGauge';
import { CameraCapture } from '@/components/CameraCapture';
import { useT } from '@/lib/i18n/LanguageProvider';
import { Sparkles, AlertCircle, ArrowRight, Loader2, CheckCircle2, CheckCircle, Image as ImageIcon } from 'lucide-react';

const CROPS = [
  { key: 'tomato', emoji: '🍅', name: 'Tomato' },
  { key: 'onion', emoji: '🧅', name: 'Onion' },
  { key: 'potato', emoji: '🥔', name: 'Potato' },
  { key: 'ragi', emoji: '🌾', name: 'Ragi' },
  { key: 'paddy', emoji: '🌾', name: 'Paddy' },
  { key: 'maize', emoji: '🌽', name: 'Maize' },
  { key: 'wheat', emoji: '🌾', name: 'Wheat' },
  { key: 'banana', emoji: '🍌', name: 'Banana' },
];

const POPULAR_VARIETIES: Record<string, string[]> = {
  onion: ['Red Onion', 'White Onion', 'Sambhar / Shallots', 'Garlic Onion / Bellary', 'Hybrid Red', 'Yellow Onion'],
  tomato: ['Hybrid / Shivam', 'Desi / Nati Tomato', 'Roma / Plum Tomato', 'Cherry Tomato', 'Green Tomato'],
  potato: ['Kufri Jyoti', 'Lauvkar', 'Pukhraj', 'Chipsona', 'Baby Potato', 'Red Potato'],
  ragi: ['GPU-28', 'Indaf-8', 'ML-365', 'Brown Finger Millet', 'MR-1'],
  paddy: ['Sona Masuri', 'Basmati', 'BPT 5204', 'Jyothi', 'IR 64', 'Jaya', 'Ponni'],
  maize: ['Yellow Corn', 'Sweet Corn', 'White Corn', 'Baby Corn', 'Silage Corn'],
  wheat: ['Sharbati', 'Lokwan', 'Durum', 'HD-2967', 'Desi Common', 'Kalyansona'],
  banana: ['Robusta / Cavendish', 'Yellaki / Ney Poovan', 'Nendran / Plantain', 'Grand Naine', 'Red Banana'],
};

const VARIETY_MULTIPLIERS: Record<string, Record<string, number>> = {
  onion: {
    'Red Onion': 1.0,
    'White Onion': 0.95,
    'Sambhar / Shallots': 1.35,
    'Garlic Onion / Bellary': 1.08,
    'Hybrid Red': 1.02,
    'Yellow Onion': 0.92,
  },
  tomato: {
    'Hybrid / Shivam': 1.0,
    'Desi / Nati Tomato': 1.15,
    'Roma / Plum Tomato': 0.94,
    'Cherry Tomato': 2.1,
    'Green Tomato': 0.75,
  },
  potato: {
    'Kufri Jyoti': 1.0,
    'Lauvkar': 1.08,
    'Pukhraj': 0.92,
    'Chipsona': 1.15,
    'Baby Potato': 0.85,
    'Red Potato': 1.1,
  },
  paddy: {
    'Sona Masuri': 1.25,
    'Basmati': 1.75,
    'BPT 5204': 1.15,
    'Jyothi': 1.0,
    'IR 64': 0.92,
    'Jaya': 0.95,
    'Ponni': 1.3,
  },
  wheat: {
    'Sharbati': 1.28,
    'Lokwan': 1.1,
    'Durum': 1.18,
    'HD-2967': 1.0,
    'Desi Common': 0.95,
    'Kalyansona': 1.05,
  },
  maize: {
    'Yellow Corn': 1.0,
    'Sweet Corn': 1.45,
    'White Corn': 0.95,
    'Baby Corn': 1.8,
    'Silage Corn': 0.75,
  },
  ragi: {
    'GPU-28': 1.0,
    'Indaf-8': 1.05,
    'ML-365': 1.1,
    'Brown Finger Millet': 0.98,
    'MR-1': 1.02,
  },
  banana: {
    'Robusta / Cavendish': 1.0,
    'Yellaki / Ney Poovan': 1.6,
    'Nendran / Plantain': 1.35,
    'Grand Naine': 1.1,
    'Red Banana': 1.85,
  },
};

const BASE_CROP_PRICES: Record<string, { modal: number; min: number; max: number; msp: number | null }> = {
  onion: { modal: 2800, min: 2200, max: 3500, msp: null },
  tomato: { modal: 1600, min: 900, max: 2300, msp: null },
  potato: { modal: 2100, min: 1800, max: 2400, msp: null },
  ragi: { modal: 4250, min: 4100, max: 4400, msp: 4290 },
  paddy: { modal: 2450, min: 2300, max: 2600, msp: 2441 },
  maize: { modal: 2250, min: 2100, max: 2400, msp: 2225 },
  wheat: { modal: 2900, min: 2600, max: 3200, msp: 2585 },
  banana: { modal: 2200, min: 1600, max: 2800, msp: null },
};

export default function CreateListingPage() {
  const { t } = useT();
  const router = useRouter();

  const [selectedCrop, setSelectedCrop] = useState('tomato');
  const [quantityKg, setQuantityKg] = useState('');
  const [askPricePerKg, setAskPricePerKg] = useState('');
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [gradeSource, setGradeSource] = useState<'ai' | 'self-declared'>('self-declared');
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Mandi rate & MSP state for the gauge
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

  // Compute helper for building full variety lists with prices
  const buildVarietyListWithPrices = (crop: string, baseModal: number, apiVarieties: Array<{ variety: string; modalPrice: number }> = []) => {
    const defaultList = POPULAR_VARIETIES[crop] || ['Common / Standard', 'Hybrid', 'Local Desi'];
    const map = new Map<string, { variety: string; modalPrice: number }>();
    
    // First apply API varieties
    apiVarieties.forEach((v) => {
      if (v.variety) map.set(v.variety.toLowerCase(), { variety: v.variety, modalPrice: v.modalPrice });
    });

    // Then fill in presets with realistic multipliers based on live/snapshot base modal
    const multipliers = VARIETY_MULTIPLIERS[crop] || {};
    defaultList.forEach((v) => {
      if (!map.has(v.toLowerCase())) {
        const mult = multipliers[v] ?? 1.0;
        map.set(v.toLowerCase(), {
          variety: v,
          modalPrice: Math.round(baseModal * mult),
        });
      }
    });

    return Array.from(map.values());
  };

  // Fetch prices on crop or district selection
  useEffect(() => {
    const baseInfo = BASE_CROP_PRICES[selectedCrop] || { modal: 1600, min: 900, max: 2300, msp: null };
    const initialList = buildVarietyListWithPrices(selectedCrop, baseInfo.modal);
    setVarieties(initialList);
    setSelectedVariety(initialList[0]?.variety || '');
    setIsCustomVariety(false);
    setCustomVariety('');

    fetch(`/api/prices?crop=${selectedCrop}&district=${encodeURIComponent(userDistrict)}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          const liveModal = res.data.mandiModalPerKg || baseInfo.modal;
          setPriceData({
            mandiMinPerKg: res.data.mandiMinPerKg || baseInfo.min,
            mandiModalPerKg: liveModal,
            mandiMaxPerKg: res.data.mandiMaxPerKg || baseInfo.max,
            mspPerKg: res.data.mspPerKg ?? baseInfo.msp,
            dataSource: res.data.dataSource || 'LIVE',
            date: res.data.mandiDate || 'Today',
          });

          const apiVars = Array.isArray(res.data.varieties) ? res.data.varieties : [];
          const updatedList = buildVarietyListWithPrices(selectedCrop, liveModal, apiVars);
          setVarieties(updatedList);
        }
      })
      .catch(() => {});
  }, [selectedCrop, userDistrict]);

  // Determine active modal price for the selected variety
  const activeVarietyPrice = useMemo(() => {
    if (isCustomVariety && customVariety.trim()) {
      return priceData.mandiModalPerKg;
    }
    const found = varieties.find(
      (v) => v.variety.toLowerCase() === selectedVariety.toLowerCase()
    );
    return found?.modalPrice || priceData.mandiModalPerKg;
  }, [varieties, selectedVariety, isCustomVariety, customVariety, priceData.mandiModalPerKg]);

  // Compute live verdict
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
    setLoading(true);
    setError(null);

    const finalVariety = isCustomVariety ? customVariety.trim() : selectedVariety;

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: selectedCrop,
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

      // Route to pools to witness the pool fill up!
      router.push('/farmer/pools');
    } catch {
      setError('Network error creating listing');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{t('listing.create')}</h1>
          <p className="text-xs text-ink-muted mt-1">
            Set your ask price, check live mandi benchmarks, and join nearby truck-scale lots.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-alert-red/10 border border-alert-red/30 rounded-xl flex items-center gap-2 text-alert-red text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Crop Selector (Icon Grid) */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
            <label className="text-xs font-bold text-ink uppercase tracking-wider block">
              1. Choose Crop
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CROPS.map((c) => {
                const isSelected = selectedCrop === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedCrop(c.key)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-field-green bg-field-green/10 text-field-green font-bold shadow-xs'
                        : 'border-border bg-paper/50 hover:bg-white text-ink'
                    }`}
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-xs capitalize">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variety / Type Selector */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                1b. Select Variety / Type &amp; Live Mandi Rates
              </label>
              <span className="text-[11px] text-ink-muted">
                {selectedCrop.toUpperCase()} Varieties
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {varieties.map((v) => {
                const isChosen = !isCustomVariety && selectedVariety.toLowerCase() === v.variety.toLowerCase();
                return (
                  <button
                    key={v.variety}
                    type="button"
                    onClick={() => {
                      setSelectedVariety(v.variety);
                      setIsCustomVariety(false);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                      isChosen
                        ? 'bg-field-green text-white border-field-green shadow-xs'
                        : 'bg-paper/70 text-ink border-border hover:border-field-green/50 hover:bg-white'
                    }`}
                  >
                    {isChosen && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    <span>{v.variety}</span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${isChosen ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}`}>
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isCustomVariety
                    ? 'bg-field-green text-white border-field-green shadow-xs'
                    : 'bg-paper/70 text-ink border-border hover:border-field-green/50 hover:bg-white'
                }`}
              >
                + Custom / Other
              </button>
            </div>

            {isCustomVariety && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Enter specific variety or cultivar name (e.g. White Onion, Bangalore Blue)..."
                  value={customVariety}
                  onChange={(e) => setCustomVariety(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:border-field-green focus:outline-hidden text-xs bg-paper/40"
                  autoFocus
                />
              </div>
            )}

            {/* Live Variety Benchmark Highlight Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mt-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">
                      Live Benchmark ({selectedVariety || selectedCrop}):
                    </span>
                    <span className="text-xs font-extrabold text-emerald-800 font-mono">
                      ₹{(activeVarietyPrice / 100).toFixed(1)} / kg
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Today&apos;s APMC mandi rate in {userDistrict}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAskPricePerKg((activeVarietyPrice / 100).toFixed(1))}
                className="px-3 py-1.5 bg-field-green text-white text-xs font-bold rounded-lg hover:bg-field-green/90 transition-all shadow-xs shrink-0 self-start sm:self-auto"
              >
                Apply ₹{(activeVarietyPrice / 100).toFixed(1)}/kg
              </button>
            </div>
          </div>

          {/* AI Quality Grading & Camera */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">
                2. Produce Photo &amp; AI Quality Assay
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
                  onClick={() => { setGradeSource('self-declared'); setAiNotes(null); }}
                  className="ml-auto text-[10px] text-ink-muted hover:text-ink underline"
                >
                  Retake
                </button>
              </div>
            ) : (
              <CameraCapture
                onCapture={handleCameraCapture}
                disabled={analyzingPhoto}
              />
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
              {aiNotes && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-2 font-medium">
                  {aiNotes}
                </p>
              )}
            </div>
          </div>

          {/* Quantity & Ask Price */}
          <div className="bg-white rounded-2xl p-5 border border-border space-y-4">
            <label className="text-xs font-bold text-ink uppercase tracking-wider block">
              3. Quantity &amp; Price
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <div className="flex items-center justify-between h-5 mb-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Quantity (kg)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper/50 border border-border rounded-xl text-base font-bold font-mono focus:border-field-green outline-none"
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
                    className="w-full pl-8 pr-3 py-2.5 bg-paper/50 border border-border rounded-xl text-base font-bold font-mono focus:border-field-green outline-none"
                    placeholder="e.g. 14"
                  />
                  <span className="absolute right-3 top-3 text-xs text-ink-muted font-bold">
                    / KG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Fair Price Gauge Component */}
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
            cropName={`${selectedVariety || selectedCrop}`}
          />

          {/* Pool Match Preview Banner */}
          <div className="bg-field-green/10 border border-field-green/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl">🚚</span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-field-green text-sm">
                Automatic Pool Matching Active
              </p>
              <p className="text-ink">
                Your <span className="font-bold">{quantityKg || '0'} kg</span> of <span className="capitalize font-bold">{selectedCrop}</span> will automatically combine with nearby farmers in <span className="font-bold">{userDistrict}</span> to build full truckload buyer lots.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-field-green text-white font-bold text-base rounded-2xl hover:bg-field-green-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Pooling your harvest...</span>
              </>
            ) : (
              <>
                <span>Publish Listing &amp; Complete Truck Lot</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
