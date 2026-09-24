'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  Warehouse,
  Phone,
  Thermometer,
  ShieldCheck,
  Search,
  Building,
  MapPin,
  Truck,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';
import { INDIAN_STATES, getDistrictsForState } from '@/lib/constants/indianStates';

interface StorageFacility {
  facilityId: string;
  name: string;
  operator: string;
  district: string;
  state: string;
  totalCapacityKg: number;
  availableCapacityKg: number;
  suitableCrops: string[];
  tempRangeC: [number, number];
  pricePerKgPerDay: number; // in paise
  contactPhone: string;
  subsidySchemeTag?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
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
  totalCost: number;
  status: string;
  requestLogistics?: boolean;
}

export default function WholesalerStoragePage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [myBookings, setMyBookings] = useState<StorageBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Booking Modal
  const [bookingModalFac, setBookingModalFac] = useState<StorageFacility | null>(null);
  const [bookCrop, setBookCrop] = useState('tomato');
  const [bookQtyKg, setBookQtyKg] = useState('2000');
  const [bookDays, setBookDays] = useState('7');
  const [requestLogistics, setRequestLogistics] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('Bengaluru Yeshwanthpur Wholesale Hub');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [facRes, bookRes] = await Promise.all([
        fetch('/api/storage').then((r) => r.json()),
        fetch('/api/storage/bookings').then((r) => r.json()),
      ]);

      if (facRes.success && Array.isArray(facRes.storages)) {
        setFacilities(facRes.storages);
      } else if (facRes.ok && Array.isArray(facRes.data)) {
        setFacilities(facRes.data);
      }

      if (bookRes.success && Array.isArray(bookRes.bookings)) {
        setMyBookings(bookRes.bookings);
      }
    } catch (err) {
      console.error('Error fetching storage facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalFac) return;

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: bookingModalFac.facilityId,
          crop: bookCrop,
          quantityKg: Number(bookQtyKg),
          days: Number(bookDays),
          pickupAddress: requestLogistics ? pickupAddress : undefined,
          requestLogistics,
        }),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        setSuccessMsg(`Cold storage booked successfully at ${bookingModalFac.name}!`);
        setBookingModalFac(null);
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to book storage');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error making booking');
    } finally {
      setSubmitting(false);
    }
  };

  const districts =
    selectedState === 'ALL'
      ? ['ALL', 'Mandya', 'Mysuru', 'Nashik', 'Pune', 'Ludhiana', 'Agra', 'Guntur', 'Surat', 'Indore', 'Jaipur', 'Hooghly']
      : ['ALL', ...getDistrictsForState(selectedState).slice(0, 10)];

  const filteredFacilities = facilities.filter((fac) => {
    const matchesState =
      selectedState === 'ALL' ||
      (fac.state && fac.state.toLowerCase() === selectedState.toLowerCase());

    const matchesDistrict =
      selectedDistrict === 'ALL' ||
      fac.district.toLowerCase() === selectedDistrict.toLowerCase();

    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fac.state && fac.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
      fac.suitableCrops.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesState && matchesDistrict && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-border shadow-xs">
          <div>
            <span className="text-xs font-semibold text-earth uppercase tracking-wide">
              Agri Logistics &amp; Cold Chain Infrastructure
            </span>
            <h1 className="text-xl font-bold text-ink mt-0.5">
              Cold Storage Warehouses &amp; Staging Hubs
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Locate and book WDRA/FSSAI verified temperature-controlled storage and staging centers across India
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-paper rounded-xl text-xs font-bold text-ink border border-border">
              {filteredFacilities.length} Facilities Active
            </span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Active Reservations */}
        {myBookings.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-border shadow-xs">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2 mb-3">
              <PackageCheck className="w-4 h-4 text-earth" />
              <span>My Active Storage Reservations ({myBookings.length})</span>
            </h2>
            <div className="divide-y divide-border">
              {myBookings.map((b) => (
                <div key={b.bookingId} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink">{b.facilityName}</span>
                    <span className="text-ink-muted ml-2">({b.quantityKg} kg {b.crop})</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase">
                      {b.status}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-ink">
                    ₹{((b.totalCost || 0) / 100).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by facility name, operator, district, or crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-paper pl-9 pr-3 py-2.5 text-xs rounded-xl border border-border focus:outline-none focus:border-earth font-medium text-ink"
              />
            </div>

            <div className="sm:w-56 shrink-0">
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('ALL');
                }}
                className="w-full bg-paper px-3 py-2.5 text-xs rounded-xl border border-border focus:outline-none focus:border-earth font-bold text-ink"
              >
                <option value="ALL">All States (Pan-India)</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedDistrict === d
                    ? 'bg-earth text-white'
                    : 'bg-paper text-ink-muted hover:bg-border/40 hover:text-ink'
                }`}
              >
                {d === 'ALL' ? (selectedState === 'ALL' ? 'All Districts' : `All in ${selectedState}`) : d}
              </button>
            ))}
          </div>
        </div>

        {/* Facilities Grid */}
        {loading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-white rounded-2xl h-36 border border-border" />
            <div className="animate-pulse bg-white rounded-2xl h-36 border border-border" />
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-border space-y-3">
            <Warehouse className="w-10 h-10 text-ink-muted mx-auto" />
            <h3 className="text-base font-bold text-ink">No storage facilities found</h3>
            <p className="text-xs text-ink-muted">
              Try adjusting your search query or selecting a different district.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFacilities.map((fac) => (
              <div
                key={fac.facilityId}
                className="bg-white rounded-2xl p-5 border border-border hover:border-earth transition-all shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-ink">{fac.name}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          {fac.verificationStatus === 'verified' ? 'WDRA Verified' : 'Accredited'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-earth" />
                        {fac.operator}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-paper text-ink font-bold text-xs rounded-xl border border-border shrink-0">
                      ₹{(fac.pricePerKgPerDay / 100).toFixed(2)}/kg/day
                    </span>
                  </div>

                  {fac.subsidySchemeTag && (
                    <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{fac.subsidySchemeTag} Subsidised Facility</span>
                    </div>
                  )}

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

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin className="w-3.5 h-3.5 text-earth" />
                    <span>{fac.district}, {fac.state || 'India'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBookingModalFac(fac)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-earth text-white text-xs font-bold rounded-xl hover:bg-earth-light transition-all shadow-xs"
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

        {/* Modal: Book Space */}
        {bookingModalFac && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-ink">Reserve Storage: {bookingModalFac.name}</h3>
                  <p className="text-xs text-ink-muted">{bookingModalFac.district} APMC Facility</p>
                </div>
                <button
                  onClick={() => setBookingModalFac(null)}
                  className="p-1 rounded-lg text-ink-muted hover:bg-paper"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBook} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-ink block mb-1">Crop / Commodity</label>
                  <input
                    type="text"
                    required
                    value={bookCrop}
                    onChange={(e) => setBookCrop(e.target.value)}
                    className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-earth"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-ink block mb-1">Quantity (kg)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={bookQtyKg}
                      onChange={(e) => setBookQtyKg(e.target.value)}
                      className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-earth"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-ink block mb-1">Duration (Days)</label>
                    <select
                      value={bookDays}
                      onChange={(e) => setBookDays(e.target.value)}
                      className="w-full p-2.5 bg-paper border border-border rounded-xl font-bold text-ink focus:outline-none focus:border-earth"
                    >
                      <option value="3">3 Days</option>
                      <option value="7">7 Days (1 Week)</option>
                      <option value="14">14 Days (2 Weeks)</option>
                      <option value="30">30 Days (1 Month)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-paper rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={requestLogistics}
                      onChange={(e) => setRequestLogistics(e.target.checked)}
                      className="w-4 h-4 rounded text-earth focus:ring-earth"
                    />
                    <Truck className="w-4 h-4 text-earth" />
                    <span>Dispatch Logistics Haulage from Hub</span>
                  </label>
                  {requestLogistics && (
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Pickup Hub Address"
                      className="w-full p-2 bg-white border border-border rounded-lg text-xs font-medium text-ink"
                    />
                  )}
                </div>

                <div className="p-3 bg-paper rounded-xl flex justify-between font-bold text-ink text-sm">
                  <span>Estimated Total:</span>
                  <span className="text-earth font-mono font-extrabold">
                    ₹{((Number(bookQtyKg) * bookingModalFac.pricePerKgPerDay * Number(bookDays) + (requestLogistics ? Number(bookQtyKg) * 140 : 0)) / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModalFac(null)}
                    className="w-1/2 py-2.5 border border-border text-ink rounded-xl text-xs font-semibold hover:bg-paper"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 py-2.5 bg-earth hover:bg-earth-light text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
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
