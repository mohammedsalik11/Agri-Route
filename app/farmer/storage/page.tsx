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
  Loader2,
  MapPin,
  ChevronRight,
  PackageCheck,
  Plus,
  Search,
  Truck,
  Building2,
  Layers,
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
  state?: string;
  totalCapacityKg: number;
  availableCapacityKg: number;
  suitableCrops: string[];
  tempRangeC: [number, number];
  pricePerKgPerDay: number; // in paise
  contactPhone: string;
  subsidySchemeTag?: string;
  licenseNumber?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  address?: string;
}

interface StorageBooking {
  bookingId: string;
  facilityId: string;
  facilityName: string;
  crop: string;
  quantityKg: number;
  startDate: string;
  endDate: string;
  days: number;
  totalCost: number; // paise
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  contactPhone?: string;
  pickupAddress?: string;
  requestLogistics?: boolean;
  logisticsJobId?: string | null;
  createdAt: string;
}

export default function ColdStoragePage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [myBookings, setMyBookings] = useState<StorageBooking[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<StorageFacility | null>(null);
  const [bookingDays, setBookingDays] = useState('4');
  const [quantityKg, setQuantityKg] = useState('500');
  const [pickupAddress, setPickupAddress] = useState('Farm Gate APMC Node, Mandya');
  const [requestLogistics, setRequestLogistics] = useState(true);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  const [trendData, setTrendData] = useState<{ day: string; price: number }[]>([]);
  const [farmerCrop, setFarmerCrop] = useState('tomato');
  const [farmerDistrict, setFarmerDistrict] = useState('Mandya');

  const loadStorageData = async (districtFilter?: string) => {
    try {
      const meRes = await fetch('/api/me').then((r) => (r.ok ? r.json() : null));
      const district = meRes?.data?.district || 'Mandya';
      const crop = meRes?.data?.primaryCrops?.[0] || 'tomato';
      setFarmerDistrict(district);
      setFarmerCrop(crop);
      if (meRes?.data?.address) {
        setPickupAddress(meRes.data.address);
      }

      const targetDistrict = districtFilter !== undefined ? districtFilter : district;

      const [storageRes, bookingsRes, trendRes] = await Promise.all([
        fetch(`/api/storage?district=${encodeURIComponent(targetDistrict)}&crop=${encodeURIComponent(crop)}`).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/storage/bookings').then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/prices/trend?crop=${encodeURIComponent(crop)}&days=7`).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (storageRes?.success && Array.isArray(storageRes.storages)) {
        setFacilities(storageRes.storages);
        setSelectedFacility((prev) => {
          if (prev && storageRes.storages.some((f: StorageFacility) => f.facilityId === prev.facilityId)) {
            return prev;
          }
          return storageRes.storages[0] || null;
        });
      } else if (storageRes?.ok && Array.isArray(storageRes.data)) {
        setFacilities(storageRes.data);
        setSelectedFacility(storageRes.data[0] || null);
      }

      if (bookingsRes?.success && Array.isArray(bookingsRes.bookings)) {
        setMyBookings(bookingsRes.bookings);
      }

      if (trendRes?.ok && Array.isArray(trendRes.data)) {
        setTrendData(
          trendRes.data.map((item: any) => ({
            day: item.date ? item.date.slice(5) : 'Day',
            price: item.modalPrice ? item.modalPrice / 100 : 14.0,
          }))
        );
      }
    } catch (err) {
      console.error('Error initializing storage page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    loadStorageData(dist === 'ALL' ? '' : dist);
  };

  const days = parseInt(bookingDays) || 4;
  const qty = parseInt(quantityKg) || 500;
  const ratePerKgDayPaise = selectedFacility?.pricePerKgPerDay || 15;
  const storageCostPaise = qty * ratePerKgDayPaise * days;

  // Logistics fee (₹1.40/kg)
  const logisticsCostPaise = requestLogistics ? Math.round(qty * 140) : 0;
  const totalCostPaise = storageCostPaise + logisticsCostPaise;

  // Projected gain from trend: ~₹2.5/kg rise over 4 days
  const projectedRisePaise = 250; // ₹2.50
  const totalGainPaise = qty * projectedRisePaise - storageCostPaise;

  const handleBook = async () => {
    if (!selectedFacility) return;
    setBookingInProgress(true);
    setBookingSuccessMsg(null);
    setBookingErrorMsg(null);

    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: selectedFacility.facilityId,
          crop: farmerCrop,
          quantityKg: qty,
          days,
          pickupAddress: requestLogistics ? pickupAddress : undefined,
          requestLogistics,
        }),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        setBookingSuccessMsg(
          `Storage reserved at ${selectedFacility.name}! Booking ID: #${data.booking.bookingId.slice(-6)}${
            requestLogistics ? ' • Haulage driver dispatched to your farm gate!' : ''
          }`
        );
        loadStorageData();
      } else {
        setBookingErrorMsg(data.error || 'Storage booking failed. Please try again.');
      }
    } catch {
      setBookingErrorMsg('Network error reserving storage space.');
    } finally {
      setBookingInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-field-green uppercase tracking-wide">
            Cold Chain &amp; Price Preservation Network
          </span>
          <h1 className="text-2xl font-bold text-ink mt-0.5">{t('storage.title')}</h1>
          <p className="text-xs text-ink-muted">
            Avoid distress sales during peak harvest price dips. Store your produce in WDRA certified cold chain facilities with optional direct farm pickup haulage.
          </p>
        </div>

        {/* 1. Active Reservations Tracking Section */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-field-green" />
              <span>My Active Cold Storage Bookings ({myBookings.length})</span>
            </h2>
            <span className="text-xs text-ink-muted">WDRA Warehouse Receipt Staging</span>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-field-green" />
            </div>
          ) : myBookings.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-border rounded-xl space-y-2">
              <Warehouse className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="text-sm font-semibold text-ink">No Active Cold Storage Reservations</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Reserve chamber space below at certified district storage centers to preserve produce freshness and secure premium market returns.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myBookings.map((b) => (
                <div key={b.bookingId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ink">{b.facilityName}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        {b.status}
                      </span>
                      {b.requestLogistics && (
                        <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Haulage Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                      <span className="capitalize font-semibold text-ink">
                        {formatWeight(b.quantityKg)} {b.crop}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {b.startDate?.slice(0, 10)} to {b.endDate?.slice(0, 10)} ({b.days} days)
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <div className="text-right">
                      <span className="text-[10px] text-ink-muted block">Total Rental Fee</span>
                      <span className="font-extrabold text-sm text-ink font-mono">
                        {formatCurrency(b.totalCost)}
                      </span>
                    </div>
                    {b.contactPhone && (
                      <a
                        href={`tel:${b.contactPhone}`}
                        className="mt-1 text-[11px] text-field-green font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{b.contactPhone}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Hold vs Sell Advisor */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-field-green text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 capitalize">
                  {t('storage.holdAdvice')} · {farmerCrop} ({farmerDistrict} APMC)
                </h3>
                <span className="text-xs text-emerald-800 font-medium">
                  {t('storage.holdRecommend').replace('{days}', bookingDays)}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-field-green text-white rounded-full shadow-xs">
              + ₹2.50/kg Potential
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/60">
              <span className="text-ink-muted block text-[11px]">{t('storage.trendUp')}</span>
              <span className="text-base font-extrabold text-field-green font-mono">
                +18.4% (7 Days)
              </span>
            </div>
            <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/60">
              <span className="text-ink-muted block text-[11px]">
                {t('storage.storageCost').replace('{days}', bookingDays)}:
              </span>
              <span className="text-base font-extrabold text-ink font-mono">
                {formatCurrency(storageCostPaise)}
              </span>
            </div>
            <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/60">
              <span className="text-ink-muted block text-[11px]">{t('storage.potentialGain')}:</span>
              <span className="text-base font-extrabold text-earth font-mono">
                +{formatCurrency(totalGainPaise)}
              </span>
            </div>
          </div>

          {/* Mini Trend Chart */}
          {trendData.length > 0 && (
            <div className="bg-white rounded-xl p-3 border border-emerald-200/60 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: any) => [`₹${value}/kg`, 'Price']} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#1b4332"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#1b4332' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Booking Feedback Alert */}
        {bookingSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{bookingSuccessMsg}</span>
          </div>
        )}
        {bookingErrorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{bookingErrorMsg}</span>
          </div>
        )}

        {/* 3. Facility Discovery & Reservation Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Facilities List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-field-green" />
                <span>Certified Cold Storage Warehouses ({facilities.length})</span>
              </h2>
              <span className="text-xs text-ink-muted">Tap a facility to book</span>
            </div>

            {/* District & Search Filter Bar */}
            <div className="bg-white rounded-2xl p-3.5 border border-border shadow-xs space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by facility name, operator, district, or crop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-paper pl-9 pr-3 py-2 text-xs rounded-xl border border-border focus:outline-none focus:border-field-green font-medium text-ink"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['ALL', 'Mandya', 'Mysuru', 'Hassan', 'Kolar', 'Bengaluru Urban', 'Bengaluru Rural', 'Belagavi', 'Tumakuru', 'Shivamogga'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDistrictChange(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedDistrict === d
                        ? 'bg-field-green text-white shadow-xs'
                        : 'bg-paper text-ink-muted hover:bg-border/40 hover:text-ink'
                    }`}
                  >
                    {d === 'ALL' ? 'All Karnataka' : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Facilities List */}
            {(() => {
              const filtered = facilities.filter((fac) => {
                const q = searchQuery.toLowerCase().trim();
                if (!q) return true;
                return (
                  fac.name.toLowerCase().includes(q) ||
                  fac.operator.toLowerCase().includes(q) ||
                  fac.district.toLowerCase().includes(q) ||
                  fac.suitableCrops.some((c) => c.toLowerCase().includes(q))
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-2xl p-10 text-center border border-border space-y-3">
                    <Warehouse className="w-10 h-10 text-ink-muted mx-auto" />
                    <h3 className="text-sm font-bold text-ink">No facilities match your search</h3>
                    <p className="text-xs text-ink-muted max-w-sm mx-auto">
                      Try clearing your search keyword or switching to &ldquo;All Karnataka&rdquo; districts above.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        handleDistrictChange('ALL');
                      }}
                      className="px-4 py-2 bg-field-green text-white text-xs font-bold rounded-xl hover:bg-field-green-light"
                    >
                      Show All Centers
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map((fac) => {
                    const isSelected = selectedFacility?.facilityId === fac.facilityId;
                    const hasSubsidy = !!fac.subsidySchemeTag;
                    const occ = fac.totalCapacityKg > 0
                      ? Math.round(((fac.totalCapacityKg - (fac.availableCapacityKg || 0)) / fac.totalCapacityKg) * 100)
                      : 0;

                    return (
                      <div
                        key={fac.facilityId}
                        onClick={() => setSelectedFacility(fac)}
                        className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer shadow-xs ${
                          isSelected
                            ? 'border-field-green shadow-md ring-2 ring-field-green/20'
                            : 'border-border hover:border-field-green/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-base text-ink">{fac.name}</h3>
                              {isSelected && (
                                <span className="text-[10px] font-bold bg-field-green text-white px-2 py-0.5 rounded-full">
                                  Selected ✓
                                </span>
                              )}
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                {fac.verificationStatus === 'verified' ? 'WDRA Verified' : 'Accredited'}
                              </span>
                              {hasSubsidy && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                  {fac.subsidySchemeTag} Subsidized
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-muted flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-field-green" />
                              <span>{fac.operator} · <strong className="text-ink">{fac.district}</strong>, Karnataka</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-base font-extrabold text-field-green font-mono">
                              ₹{(fac.pricePerKgPerDay / 100).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-ink-muted block">/kg/day</span>
                          </div>
                        </div>

                        {/* Capacity Meter */}
                        <div className="mt-3 bg-paper p-2.5 rounded-xl border border-border/60">
                          <div className="flex justify-between text-[11px] text-ink-muted mb-1 font-medium">
                            <span>Available Capacity: <strong className="text-ink">{formatWeight(fac.availableCapacityKg)}</strong></span>
                            <span className="text-emerald-700">{100 - occ}% Free</span>
                          </div>
                          <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-field-green h-full rounded-full" style={{ width: `${100 - occ}%` }} />
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-ink-muted">
                            Temp Range: <strong>{fac.tempRangeC[0]}°C – {fac.tempRangeC[1]}°C</strong>
                          </span>
                          <div className="flex items-center gap-3">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.name + ', ' + fac.district + ', Karnataka')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-field-green font-bold flex items-center gap-1 hover:underline"
                            >
                              <MapPin className="w-3.5 h-3.5 text-field-green" />
                              <span>Maps ↗</span>
                            </a>
                            <a
                              href={`tel:${fac.contactPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-field-green font-bold flex items-center gap-1 hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{fac.contactPhone}</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Reservation Sidebar Form */}
          <div className="bg-white rounded-2xl p-6 border border-border shadow-xs h-fit space-y-4">
            <div>
              <h3 className="text-base font-bold text-ink">{t('storage.book')}</h3>
              <p className="text-xs text-ink-muted mt-0.5">Reserve storage at government subsidized rates</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">Select Facility</label>
                <select
                  value={selectedFacility?.facilityId || ''}
                  onChange={(e) => {
                    const found = facilities.find((f) => f.facilityId === e.target.value);
                    if (found) setSelectedFacility(found);
                  }}
                  className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-field-green"
                >
                  {facilities.map((f) => (
                    <option key={f.facilityId} value={f.facilityId}>
                      {f.name} ({f.district}) — ₹{(f.pricePerKgPerDay / 100).toFixed(2)}/kg
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">Quantity to Store (kg)</label>
                <input
                  type="number"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-field-green"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">Duration (Days)</label>
                <select
                  value={bookingDays}
                  onChange={(e) => setBookingDays(e.target.value)}
                  className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-field-green"
                >
                  <option value="3">3 Days</option>
                  <option value="4">4 Days (Recommended)</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="14">14 Days (2 Weeks)</option>
                </select>
              </div>

              {/* Logistics Request Option */}
              <div className="p-3 bg-cyan-50/70 border border-cyan-200/80 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-cyan-950">
                  <input
                    type="checkbox"
                    checked={requestLogistics}
                    onChange={(e) => setRequestLogistics(e.target.checked)}
                    className="w-4 h-4 rounded text-field-green focus:ring-field-green"
                  />
                  <Truck className="w-4 h-4 text-cyan-700" />
                  <span>Request Farm Gate Pickup Haulage</span>
                </label>
                {requestLogistics && (
                  <div>
                    <label className="text-[11px] text-cyan-900 font-semibold block mb-1">
                      Farm Gate Pickup Address:
                    </label>
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Enter farm location or APMC node"
                      className="w-full p-2 bg-white border border-cyan-300 rounded-lg text-xs font-medium text-ink focus:outline-none"
                    />
                    <span className="text-[10px] text-cyan-800 block mt-1">
                      + ₹1.40/kg direct logistics transport fee
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border space-y-2 bg-paper/60 p-3 rounded-xl">
                <div className="flex justify-between text-ink-muted">
                  <span>Storage Fee ({bookingDays} days):</span>
                  <span className="font-bold text-ink">{formatCurrency(storageCostPaise)}</span>
                </div>
                {requestLogistics && (
                  <div className="flex justify-between text-ink-muted">
                    <span>Haulage Transport:</span>
                    <span className="font-bold text-cyan-800">{formatCurrency(logisticsCostPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-ink text-sm pt-1 border-t border-border/60">
                  <span>Total Payable:</span>
                  <span className="text-field-green font-mono font-extrabold">{formatCurrency(totalCostPaise)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBook}
                disabled={bookingInProgress || !selectedFacility}
                className="w-full py-3 bg-field-green text-white font-bold text-xs rounded-xl hover:bg-field-green-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {bookingInProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reserving Space...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Confirm Reservation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
