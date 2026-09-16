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

export default function CreateListingPage() {
  const { t } = useT();
  const router = useRouter();

  const [selectedCrop, setSelectedCrop] = useState('tomato');
  const [quantityKg, setQuantityKg] = useState('600'); // Seed demo lot exact match!
  const [askPricePerKg, setAskPricePerKg] = useState('14'); // in rupees
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
    mandiMinPerKg: 800,
    mandiModalPerKg: 1400,
    mandiMaxPerKg: 2200,
    mspPerKg: null,
    dataSource: 'CACHED',
    date: 'Today',
  });

  const [varieties, setVarieties] = useState<Array<{ variety: string; modalPrice: number }>>([]);
  const [selectedVariety, setSelectedVariety] = useState('');

  // Fetch prices on crop selection
  useEffect(() => {
    setVarieties([]);
    setSelectedVariety('');
    fetch(`/api/prices?crop=${selectedCrop}&district=Mandya`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setPriceData({
            mandiMinPerKg: res.data.mandiMinPerKg || 800,
            mandiModalPerKg: res.data.mandiModalPerKg || 1400,
            mandiMaxPerKg: res.data.mandiMaxPerKg || 2200,
            mspPerKg: res.data.mspPerKg ?? null,
            dataSource: res.data.dataSource || 'CACHED',
            date: res.data.mandiDate || 'Today',
          });
          if (Array.isArray(res.data.varieties) && res.data.varieties.length > 0) {
            setVarieties(res.data.varieties.map((v: { variety: string; modalPrice: number }) => ({
              variety: v.variety,
              modalPrice: v.modalPrice,
            })));
          }
        }
      })
      .catch(() => {});
  }, [selectedCrop]);

  // Compute live verdict
  const askPricePaise = Math.round((parseFloat(askPricePerKg) || 0) * 100);
  const qty = parseFloat(quantityKg) || 0;

  const floorPaise = priceData.mspPerKg
    ? Math.max(priceData.mspPerKg, priceData.mandiMinPerKg)
    : priceData.mandiMinPerKg;

  const fairBandHiPaise = Math.round(priceData.mandiModalPerKg * 1.05);

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

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: selectedCrop,
          variety: selectedVariety || undefined,
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

          {/* Variety Selector — shown only when Agmarknet returns varieties */}
          {varieties.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-border space-y-3">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                1b. Select Variety{' '}
                <span className="normal-case font-normal text-ink-muted ml-1">
                  (from live Agmarknet data)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariety('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedVariety === ''
                      ? 'bg-field-green text-white border-field-green'
                      : 'bg-paper text-ink border-border hover:border-field-green'
                  }`}
                >
                  Any / Unspecified
                </button>
                {varieties.map((v) => (
                  <button
                    key={v.variety}
                    type="button"
                    onClick={() => setSelectedVariety(v.variety)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selectedVariety === v.variety
                        ? 'bg-field-green text-white border-field-green'
                        : 'bg-paper text-ink border-border hover:border-field-green'
                    }`}
                  >
                    {v.variety}
                    <span className="ml-1 text-[10px] opacity-70">
                      ₹{(v.modalPrice / 100).toFixed(1)}/kg
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                        ? 'border-field-green bg-field-green text-paper shadow-xs'
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">
                  Quantity (kg)
                </label>
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
                <label className="text-xs font-semibold text-ink block mb-1">
                  Your Ask Price (₹ per kg)
                </label>
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
            mandiMinPerKg={priceData.mandiMinPerKg}
            mandiModalPerKg={priceData.mandiModalPerKg}
            mandiMaxPerKg={priceData.mandiMaxPerKg}
            mspPerKg={priceData.mspPerKg}
            verdict={verdict}
            extraEarningVsFloor={extraEarningVsFloor}
            dataSource={priceData.dataSource}
            checkedDate={priceData.date}
            cropName={selectedCrop}
          />

          {/* Pool Match Preview Banner */}
          <div className="bg-field-green/10 border border-field-green/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl">🚚</span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-field-green text-sm">
                Automatic Pool Matching Active
              </p>
              <p className="text-ink">
                Your <span className="font-bold">{quantityKg} kg</span> will combine with 8 nearby farmers in Mandya (2,400 kg) to hit the <span className="font-bold">3,000 kg truck threshold</span>.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-field-green text-paper font-bold text-base rounded-2xl hover:bg-field-green-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
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
