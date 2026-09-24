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
  Building,
  Layers,
  Thermometer,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { INDIAN_STATES, getDistrictsForState } from '@/lib/constants/indianStates';

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

  // Booking Modal & Fields
  const [bookingModalFac, setBookingModalFac] = useState<StorageFacility | null>(null);
  const [bookingDays, setBookingDays] = useState('4');
  const [quantityKg, setQuantityKg] = useState('500');
  const [pickupAddress, setPickupAddress] = useState('Farm Gate APMC Node, Mandya');
  const [requestLogistics, setRequestLogistics] = useState(true);

  // Filter States
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  const [trendData, setTrendData] = useState<{ day: string; price: number }[]>([]);
  const [farmerCrop, setFarmerCrop] = useState('tomato');
  const [farmerDistrict, setFarmerDistrict] = useState('Mandya');
  const [farmerState, setFarmerState] = useState('Karnataka');

  const loadStorageData = async () => {
    try {
      const meRes = await fetch('/api/me').then((r) => (r.ok ? r.json() : null));
      const district = meRes?.data?.district || 'Mandya';
      const state = meRes?.data?.state || 'Karnataka';
      const crop = meRes?.data?.primaryCrops?.[0] || 'tomato';
      setFarmerDistrict(district);
      setFarmerState(state);
      setFarmerCrop(crop);
      if (meRes?.data?.address) {
        setPickupAddress(meRes.data.address);
      }

      const [storageRes, bookingsRes, trendRes] = await Promise.all([
        fetch(`/api/storage?crop=${encodeURIComponent(crop)}`).then((r) => (r.ok ? r.json() : null)),
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

  const days = parseInt(bookingDays) || 4;
  const qty = parseInt(quantityKg) || 500;
  const activeFac = bookingModalFac || selectedFacility;
  const ratePerKgDayPaise = activeFac?.pricePerKgPerDay || 15;
  const storageCostPaise = qty * ratePerKgDayPaise * days;

  // Logistics fee (₹1.40/kg)
  const logisticsCostPaise = requestLogistics ? Math.round(qty * 140) : 0;
  const totalCostPaise = storageCostPaise + logisticsCostPaise;

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetFac = bookingModalFac || selectedFacility;
    if (!targetFac) return;

    setBookingInProgress(true);
    setBookingSuccessMsg(null);
    setBookingErrorMsg(null);

    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: targetFac.facilityId,
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
          `Storage reserved at ${targetFac.name}! Booking ID: #${data.booking.bookingId.slice(-6)}${
            requestLogistics ? ' • Direct haulage dispatched to your farm gate!' : ''
          }`
        );
        setBookingModalFac(null);
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

  // Filter facilities by state, district, and search keyword
  const filteredFacilities = facilities.filter((fac) => {
    const matchesState =
      selectedState === 'ALL' ||
      (fac.state && fac.state.toLowerCase() === selectedState.toLowerCase());

    const matchesDistrict =
      selectedDistrict === 'ALL' ||
      fac.district.toLowerCase() === selectedDistrict.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      fac.name.toLowerCase().includes(q) ||
      fac.operator.toLowerCase().includes(q) ||
      fac.district.toLowerCase().includes(q) ||
      (fac.state && fac.state.toLowerCase().includes(q)) ||
      fac.suitableCrops.some((c) => c.toLowerCase().includes(q));

    return matchesState && matchesDistrict && matchesQuery;
  });

  // Dynamic district pills based on selected state
  const availableDistricts =
    selectedState === 'ALL'
      ? ['ALL', 'Mandya', 'Mysuru', 'Nashik', 'Pune', 'Ludhiana', 'Agra', 'Guntur', 'Surat', 'Indore', 'Jaipur', 'Hooghly']
      : ['ALL', ...getDistrictsForState(selectedState).slice(0, 10)];

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ========================================================================= */}
        {/* TOP SECTION: KEPT EXACTLY SAME AS USER'S SCREENSHOT                      */}
        {/* ========================================================================= */}

        {/* 1. Header Banner */}
        <div>
          <span className="text-xs font-bold text-field-green uppercase tracking-wide">
            Cold Chain &amp; Price Preservation Network
          </span>
          <h1 className="text-2xl font-bold text-ink mt-0.5">{t('storage.title')}</h1>
          <p className="text-xs text-ink-muted">
            Avoid distress sales during peak harvest price dips. Store your produce in WDRA certified cold chain facilities with optional direct farm pickup haulage.
          </p>
        </div>

        {/* 2. Active Reservations Tracking Section */}
        {myBookings.length > 0 && (
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
                            <Truck className="w-3 h-3 text-cyan-600" />
                            <span>Haulage Active</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted flex items-center gap-3">
                        <span>
                          <strong className="text-ink">{formatWeight(b.quantityKg)}</strong> {b.crop}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                          {b.startDate} to {b.endDate} ({b.days} days)
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-ink-muted block uppercase font-medium">Total Rental Fee</span>
                        <span className="text-base font-extrabold text-ink font-mono">
                          {formatCurrency(b.totalCost)}
                        </span>
                      </div>
                      {b.contactPhone && (
                        <a
                          href={`tel:${b.contactPhone}`}
                          className="p-2 rounded-xl bg-paper text-field-green hover:bg-emerald-50 transition-colors"
                          title="Call Storage Manager"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Hold Vs Sell Advice Banner with Recharts Trend */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-field-green text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-ink capitalize">
                    Hold Vs Sell Advice · {farmerCrop} ({farmerDistrict} APMC)
                  </h2>
                </div>
                <p className="text-xs text-field-green font-semibold mt-0.5">
                  Our advice: Hold for 4 days
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-field-green text-white shadow-xs">
                + ₹2.50/kg Potential
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[11px] text-ink-muted font-medium block">Price trend is rising</span>
              <span className="text-base font-extrabold text-field-green flex items-center gap-1 mt-0.5 font-mono">
                +18.4% (7 Days)
              </span>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[11px] text-ink-muted font-medium block">Storage cost for 4 days:</span>
              <span className="text-base font-extrabold text-ink font-mono mt-0.5 block">
                ₹240
              </span>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[11px] text-ink-muted font-medium block">Potential gain:</span>
              <span className="text-base font-extrabold text-earth font-mono mt-0.5 block">
                +₹1,010
              </span>
            </div>
          </div>

          {trendData.length > 0 && (
            <div className="h-36 w-full pt-2">
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
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{bookingSuccessMsg}</span>
          </div>
        )}
        {bookingErrorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{bookingErrorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BELOW SECTION: REDESIGNED TO MATCH WHOLESALER LAYOUT (PAN-INDIA GRID)    */}
        {/* ========================================================================= */}

        <div className="space-y-4 pt-2">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-ink tracking-tight flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-field-green" />
                <span>Certified Cold Storage Warehouses &amp; Staging Hubs</span>
              </h2>
              <p className="text-xs text-ink-muted">
                WDRA and FSSAI accredited temperature-controlled facilities available across India
              </p>
            </div>
            <span className="px-3 py-1 bg-white rounded-xl text-xs font-bold text-ink border border-border shadow-xs self-start sm:self-auto">
              {filteredFacilities.length} Facilities Available
            </span>
          </div>

          {/* Full-width Filter Bar matching Wholesaler pattern with Pan-India State selector */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Keyword */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by facility name, operator, district, or crop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-paper pl-9 pr-3 py-2.5 text-xs rounded-xl border border-border focus:outline-none focus:border-field-green font-medium text-ink"
                />
              </div>

              {/* State Selector */}
              <div className="sm:w-56 shrink-0">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict('ALL');
                  }}
                  className="w-full bg-paper px-3 py-2.5 text-xs rounded-xl border border-border focus:outline-none focus:border-field-green font-bold text-ink"
                >
                  <option value="ALL">All States (Pan-India)</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* District Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {availableDistricts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedDistrict === d
                      ? 'bg-field-green text-white shadow-xs'
                      : 'bg-paper text-ink-muted hover:bg-border/40 hover:text-ink'
                  }`}
                >
                  {d === 'ALL' ? (selectedState === 'ALL' ? 'All Districts' : `All in ${selectedState}`) : d}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Facilities Grid matching Wholesaler Card Styling */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-pulse bg-white rounded-2xl h-48 border border-border" />
              <div className="animate-pulse bg-white rounded-2xl h-48 border border-border" />
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-border space-y-3">
              <Warehouse className="w-10 h-10 text-ink-muted mx-auto" />
              <h3 className="text-base font-bold text-ink">No storage facilities found</h3>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                No cold storage facilities matched your search criteria. Try selecting &ldquo;All States&rdquo; or clearing your search keywords.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedState('ALL');
                  setSelectedDistrict('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-field-green text-white text-xs font-bold rounded-xl hover:bg-field-green-light"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFacilities.map((fac) => (
                <div
                  key={fac.facilityId}
                  className="bg-white rounded-2xl p-5 border border-border hover:border-field-green transition-all shadow-xs flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    {/* Facility Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-ink group-hover:text-field-green transition-colors">
                            {fac.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            {fac.verificationStatus === 'verified' ? 'WDRA Verified' : 'Accredited'}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-field-green" />
                          <span>{fac.operator}</span>
                        </p>
                      </div>

                      {/* Daily Rate Chip */}
                      <span className="px-2.5 py-1 bg-paper text-ink font-bold text-xs rounded-xl border border-border shrink-0 font-mono">
                        ₹{(fac.pricePerKgPerDay / 100).toFixed(2)}/kg/day
                      </span>
                    </div>

                    {/* Subsidized Facility Tag */}
                    {fac.subsidySchemeTag && (
                      <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-900 text-[11px] font-bold rounded-full border border-amber-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>{fac.subsidySchemeTag} Subsidised Facility</span>
                      </div>
                    )}

                    {/* Capacity & Temp Well */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-paper p-3 rounded-xl">
                      <div>
                        <span className="text-ink-muted block text-[11px]">Available Space</span>
                        <span className="font-bold text-ink">
                          {formatWeight(fac.availableCapacityKg)}
                        </span>
                      </div>
                      <div>
                        <span className="text-ink-muted block text-[11px]">Temperature Range</span>
                        <span className="font-bold text-ink flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                          {fac.tempRangeC[0]}°C – {fac.tempRangeC[1]}°C
                        </span>
                      </div>
                    </div>

                    {/* Suitable Crops */}
                    <div className="mt-3">
                      <span className="text-[11px] text-ink-muted block mb-1">Suitable Crops:</span>
                      <div className="flex flex-wrap gap-1">
                        {fac.suitableCrops.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 bg-paper rounded-lg text-[10px] font-semibold text-ink capitalize border border-border/60"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with Location & Book Space Button */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin className="w-3.5 h-3.5 text-field-green shrink-0" />
                      <span className="truncate">
                        <strong className="text-ink">{fac.district}</strong>, {fac.state || 'India'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.name + ', ' + fac.district + ', ' + (fac.state || 'India'))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:text-field-green hover:bg-paper rounded-xl transition-colors"
                        title="View Location on Google Maps"
                      >
                        Maps ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingModalFac(fac);
                          setBookingDays('4');
                          setQuantityKg('500');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-field-green text-white text-xs font-bold rounded-xl hover:bg-field-green-light active:scale-95 transition-all shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Book Space</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* POPUP MODAL: BOOK SPACE WITH FARMER HAULAGE & DURATION ADVICE            */}
        {/* ========================================================================= */}
        {bookingModalFac && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-field-green">
                    Reserve Chamber Space
                  </span>
                  <h3 className="text-lg font-bold text-ink">{bookingModalFac.name}</h3>
                  <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-field-green" />
                    <span>{bookingModalFac.district}, {bookingModalFac.state || 'India'} · WDRA Facility</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingModalFac(null)}
                  className="p-1.5 rounded-xl text-ink-muted hover:bg-paper transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBook} className="space-y-4 text-xs">
                {/* Crop Field */}
                <div>
                  <label className="font-bold text-ink block mb-1">Crop / Commodity to Store *</label>
                  <input
                    type="text"
                    required
                    value={farmerCrop}
                    onChange={(e) => setFarmerCrop(e.target.value)}
                    placeholder="e.g. Tomato, Potato, Onion"
                    className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-field-green capitalize"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Quantity Field */}
                  <div>
                    <label className="font-bold text-ink block mb-1">Quantity (kg) *</label>
                    <input
                      type="number"
                      required
                      min="50"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(e.target.value)}
                      placeholder="500"
                      className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-field-green"
                    />
                  </div>

                  {/* Duration Field */}
                  <div>
                    <label className="font-bold text-ink block mb-1">Storage Duration *</label>
                    <select
                      value={bookingDays}
                      onChange={(e) => setBookingDays(e.target.value)}
                      className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-field-green"
                    >
                      <option value="3">3 Days</option>
                      <option value="4">4 Days (AI Hold Advice)</option>
                      <option value="7">7 Days (1 Week)</option>
                      <option value="14">14 Days (2 Weeks)</option>
                      <option value="30">30 Days (1 Month)</option>
                    </select>
                  </div>
                </div>

                {/* Logistics Haulage Checkbox */}
                <div className="p-3.5 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl space-y-2">
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
                    <div className="pt-1 space-y-1">
                      <label className="text-[11px] text-cyan-900 font-semibold block">
                        Farm Gate Pickup Address:
                      </label>
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Enter farm gate location or village node"
                        className="w-full p-2 bg-white border border-cyan-300 rounded-xl text-xs font-medium text-ink focus:outline-none"
                      />
                      <span className="text-[10px] text-cyan-800 block">
                        + ₹1.40/kg direct logistics transport fee
                      </span>
                    </div>
                  )}
                </div>

                {/* Live Cost Summary Well */}
                <div className="p-3.5 bg-paper rounded-2xl border border-border space-y-2 text-xs">
                  <div className="flex justify-between text-ink-muted">
                    <span>
                      Chamber Storage Fee ({days} days @ ₹{(bookingModalFac.pricePerKgPerDay / 100).toFixed(2)}/kg/day):
                    </span>
                    <span className="font-bold text-ink">{formatCurrency(storageCostPaise)}</span>
                  </div>
                  {requestLogistics && (
                    <div className="flex justify-between text-ink-muted">
                      <span>Farm Gate Pickup Haulage ({qty} kg @ ₹1.40/kg):</span>
                      <span className="font-bold text-cyan-800">{formatCurrency(logisticsCostPaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-ink text-sm pt-2 border-t border-border">
                    <span>Total Payable:</span>
                    <span className="text-field-green font-mono font-extrabold text-base">
                      {formatCurrency(totalCostPaise)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModalFac(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-ink hover:bg-paper font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingInProgress}
                    className="flex-1 py-2.5 bg-field-green text-white font-bold text-xs rounded-xl hover:bg-field-green-light active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Reserving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Reservation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
