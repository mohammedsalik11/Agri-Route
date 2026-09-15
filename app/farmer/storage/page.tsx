'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  Warehouse,
  TrendingUp,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface StorageFacility {
  facilityId: string;
  name: string;
  operator: string;
  district: string;
  totalCapacityKg: number;
  availableCapacityKg: number;
  suitableCrops: string[];
  tempRangeC: [number, number];
  pricePerKgPerDay: number; // in paise
  contactPhone: string;
  subsidySchemeTag?: string;
}

export default function ColdStoragePage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<StorageFacility | null>(null);
  const [bookingDays, setBookingDays] = useState('4');
  const [quantityKg, setQuantityKg] = useState('600');
  const [booked, setBooked] = useState(false);

  // 7-day trend data for Tomato (Mandya APMC)
  const trendData = [
    { day: '09 Sep', price: 11.5 },
    { day: '10 Sep', price: 12.0 },
    { day: '11 Sep', price: 12.8 },
    { day: '12 Sep', price: 13.0 },
    { day: '13 Sep', price: 13.5 },
    { day: '14 Sep', price: 14.0 },
    { day: '15 Sep', price: 14.6 },
  ];

  useEffect(() => {
    fetch('/api/storage?district=Mandya&crop=tomato')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setFacilities(res.data);
          if (res.data.length > 0) setSelectedFacility(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const days = parseInt(bookingDays) || 4;
  const qty = parseInt(quantityKg) || 600;
  const ratePerKgDayPaise = selectedFacility?.pricePerKgPerDay || 15;
  const storageCostPaise = qty * ratePerKgDayPaise * days;

  // Projected gain from trend: ~₹2.5/kg rise over 4 days
  const projectedRisePaise = 250; // ₹2.50
  const totalGainPaise = qty * projectedRisePaise - storageCostPaise;

  const handleBook = () => {
    setBooked(true);
    if (selectedFacility) {
      setFacilities((prev) =>
        prev.map((f) =>
          f.facilityId === selectedFacility.facilityId
            ? { ...f, availableCapacityKg: Math.max(0, f.availableCapacityKg - qty) }
            : f
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('storage.title')}</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Hold produce during price dips, bypass distress selling, and preserve quality
          </p>
        </div>

        {/* Hold-vs-Sell Advisor Card (High Impact) */}
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-paper rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              {t('storage.holdAdvice')} · Tomato
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-xs font-extrabold uppercase">
              Recommendation: HOLD 4 DAYS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <p className="text-2xl font-black font-mono text-white">
                +₹{(totalGainPaise / 100).toFixed(0)} Net Gain
              </p>
              <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                Mandya tomato mandi prices have risen 26% over the last 7 days. At ₹0.15/kg/day storage cost, holding for 4 days yields a projected extra earning of <span className="font-bold underline text-white">₹{(totalGainPaise / 100).toFixed(0)}</span> after deducting storage fees.
              </p>
            </div>

            {/* Sparkline Chart */}
            <div className="h-32 bg-white/10 rounded-xl p-2 border border-white/20">
              <p className="text-[10px] text-white/70 font-semibold mb-1 text-center">
                7-Day Agmarknet Modal Rate (₹/kg)
              </p>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={trendData}>
                  <XAxis dataKey="day" hide />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{
                      background: '#1A1A1A',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [`₹${val}`, 'Mandi Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#52B788"
                    strokeWidth={3}
                    dot={{ fill: '#FFF', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Booking Form Card */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-field-green" />
            Book Subsidised Cold Storage
          </h2>

          {booked ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-emerald-900 font-bold text-sm">
                Storage Confirmed at {selectedFacility?.name}!
              </p>
              <p className="text-xs text-emerald-800">
                Reserved {quantityKg} kg for {bookingDays} days. Total fee: {formatCurrency(storageCostPaise)}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink block mb-1">
                    Quantity to store (kg)
                  </label>
                  <input
                    type="number"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink block mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={bookingDays}
                    onChange={(e) => setBookingDays(e.target.value)}
                    className="w-full px-3 py-2 bg-paper/50 border border-border rounded-xl text-sm font-mono font-bold"
                  />
                </div>
              </div>

              {/* Cost Preview */}
              <div className="bg-paper p-3 rounded-xl border border-border flex items-center justify-between text-xs">
                <span className="text-ink-muted">Total Storage Fee ({bookingDays} days):</span>
                <span className="text-sm font-bold text-field-green">
                  {formatCurrency(storageCostPaise)}
                </span>
              </div>

              <button
                onClick={handleBook}
                className="w-full py-3 bg-field-green text-paper font-bold text-sm rounded-xl hover:bg-field-green-light transition-all"
              >
                Confirm Cold Storage Booking
              </button>
            </div>
          )}
        </div>

        {/* Facilities List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
            Verified Karnataka Cold Stores
          </h3>

          {facilities.map((fac) => {
            const isSelected = selectedFacility?.facilityId === fac.facilityId;
            return (
              <div
                key={fac.facilityId}
                onClick={() => setSelectedFacility(fac)}
                className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-field-green ring-2 ring-field-green/20'
                    : 'border-border hover:border-field-green/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-ink text-sm">{fac.name}</h4>
                      {fac.subsidySchemeTag && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                          Subsidised Rate (AIF)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {fac.operator} · {fac.district} District
                    </p>
                  </div>
                  <span className="font-bold text-field-green text-sm">
                    ₹{(fac.pricePerKgPerDay / 100).toFixed(2)}/kg/day
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between text-xs text-ink-muted">
                  <span>Available: {formatWeight(fac.availableCapacityKg)}</span>
                  <span>Temp: {fac.tempRangeC[0]}°C - {fac.tempRangeC[1]}°C</span>
                  <span className="flex items-center gap-1 text-ink">
                    <Phone className="w-3 h-3 text-field-green" /> {fac.contactPhone}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
