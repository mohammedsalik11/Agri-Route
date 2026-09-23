'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { KisanBot } from '@/components/KisanBot';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Clock,
  Plus,
  Truck,
  Phone,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  ThermometerSnowflake,
  IndianRupee,
  RefreshCw,
  Building2,
  MapPin,
  FileCheck,
  Loader2,
} from 'lucide-react';
import type { UserProfile } from '@/lib/auth';

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
  pricePerKgPerDay: number; // paise
  contactPhone: string;
  licenseNumber?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  address?: string;
  features?: string[];
}

interface StorageBooking {
  bookingId: string;
  facilityId: string;
  facilityName: string;
  farmerId?: string;
  userId: string;
  userRole: 'farmer' | 'wholesaler';
  userName?: string;
  userPhone?: string;
  crop: string;
  quantityKg: number;
  startDate: string;
  endDate: string;
  days: number;
  totalCost: number; // paise
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  contactPhone?: string;
  requestLogistics?: boolean;
  logisticsJobId?: string | null;
  createdAt: string;
}

export default function StorageOwnerDashboard() {
  const { t, formatCurrency, formatWeight } = useT();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [bookings, setBookings] = useState<StorageBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Facility Form State
  const [formData, setFormData] = useState({
    name: '',
    operator: '',
    district: 'Mandya',
    totalCapacityKg: '500000',
    pricePerKgPerDay: '15', // paise
    contactPhone: '+919876543210',
    licenseNumber: 'WDRA-KA-2026-8812',
    suitableCrops: 'tomato, potato, onion, carrot, apple, mango',
    tempMin: '2',
    tempMax: '8',
    address: 'APMC Warehouse Corridor',
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meRes, facRes, bookRes] = await Promise.all([
        fetch('/api/me').then(r => r.ok ? r.json() : null),
        fetch('/api/storage/facilities').then(r => r.ok ? r.json() : null),
        fetch('/api/storage/bookings').then(r => r.ok ? r.json() : null),
      ]);

      if (meRes?.data) {
        setProfile(meRes.data);
        setFormData(prev => ({
          ...prev,
          operator: meRes.data.name || prev.operator,
          district: meRes.data.district || prev.district,
          contactPhone: meRes.data.phone || prev.contactPhone,
          licenseNumber: meRes.data.storageDetails?.licenseNumber || prev.licenseNumber,
          address: meRes.data.storageDetails?.facilityAddress || prev.address,
        }));
      }

      if (facRes?.success && Array.isArray(facRes.facilities)) {
        setFacilities(facRes.facilities);
      }
      if (bookRes?.success && Array.isArray(bookRes.bookings)) {
        setBookings(bookRes.bookings);
      }
    } catch (err) {
      console.error('Error loading storage owner data:', err);
      showToast('error', 'Failed to load storage dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/storage/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalCapacityKg: Number(formData.totalCapacityKg),
          pricePerKgPerDay: Number(formData.pricePerKgPerDay),
          tempMin: Number(formData.tempMin),
          tempMax: Number(formData.tempMax),
          suitableCrops: formData.suitableCrops.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register facility');

      showToast('success', 'Facility registered and verified successfully!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Error registering facility');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: StorageBooking['status']) => {
    try {
      const res = await fetch('/api/storage/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update booking status');

      showToast('success', `Booking status marked as ${status}`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Error updating status');
    }
  };

  // Calculations
  const totalCapacityAll = facilities.reduce((sum, f) => sum + (f.totalCapacityKg || 0), 0);
  const totalAvailableAll = facilities.reduce((sum, f) => sum + (f.availableCapacityKg || 0), 0);
  const totalOccupiedAll = Math.max(0, totalCapacityAll - totalAvailableAll);
  const occupancyPercent = totalCapacityAll > 0 ? Math.round((totalOccupiedAll / totalCapacityAll) * 100) : 0;

  const totalRevenuePaise = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const activeBookingsCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length;

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Profile / Header Banner */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  WDRA / FSSAI Accredited Facility Provider
                </span>
                <span className="text-xs text-ink-muted font-mono">
                  ID: {profile?.facilityId || profile?.clerkUserId || 'STO-KA-2026-1001'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-ink tracking-tight">
                {profile?.facilityName || profile?.name || 'Cold Storage Facility Hub'}
              </h1>
              <p className="text-ink-muted text-xs mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-field-green" />
                {profile?.facilityAddress || 'APMC Agro Warehouse Corridor, Karnataka'} |{' '}
                <FileCheck className="w-3.5 h-3.5 text-earth ml-2" />
                License: {profile?.licenseNumber || 'WDRA-KA-2026-8812'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="p-2.5 rounded-xl bg-paper hover:bg-border/40 border border-border text-ink transition-all shadow-xs"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-field-green hover:bg-field-green-light text-white font-semibold text-xs shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                Add New Facility
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-ink-muted mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Capacity</span>
              <Warehouse className="w-4 h-4 text-field-green" />
            </div>
            <div className="text-2xl font-bold text-ink">
              {(totalCapacityAll / 1000).toFixed(0)} <span className="text-xs font-normal text-ink-muted">Tonnes</span>
            </div>
            <div className="text-xs text-ink-muted mt-1">{facilities.length} operational facilities</div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-ink-muted mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Occupancy</span>
              <Layers className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-700">{occupancyPercent}%</div>
            <div className="w-full bg-paper h-2 rounded-full mt-2 overflow-hidden border border-border/40">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              {(totalOccupiedAll / 1000).toFixed(1)}T occupied • {(totalAvailableAll / 1000).toFixed(1)}T free
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-ink-muted mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Bookings</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-ink">{activeBookingsCount}</div>
            <div className="text-xs text-ink-muted mt-1">{bookings.length} historical bookings</div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-ink-muted mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Rental Value</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-field-green">
              ₹{(totalRevenuePaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-ink-muted mt-1">Secured via AgriRoute Escrow</div>
          </div>
        </div>

        {/* Facilities Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Building2 className="w-5 h-5 text-field-green" />
              Registered Storage Warehouses &amp; Chambers ({facilities.length})
            </h2>
          </div>

          {facilities.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-2xl p-8 text-center">
              <Warehouse className="w-10 h-10 text-ink-muted/40 mx-auto mb-3" />
              <h3 className="text-base font-bold text-ink">No Facilities Registered Yet</h3>
              <p className="text-ink-muted text-xs mt-1 mb-4">
                List your cold storage facility to receive crop preservation bookings from local farmers and wholesalers.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-field-green hover:bg-field-green-light text-white font-semibold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add First Facility
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {facilities.map((fac) => {
                const facOccupancy = fac.totalCapacityKg > 0
                  ? Math.round(((fac.totalCapacityKg - (fac.availableCapacityKg || 0)) / fac.totalCapacityKg) * 100)
                  : 0;

                return (
                  <div
                    key={fac.facilityId}
                    className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-field-green/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {fac.verificationStatus === 'verified' ? 'WDRA Verified' : 'Accreditation Pending'}
                          </span>
                          <h3 className="text-base font-bold text-ink leading-snug">{fac.name}</h3>
                          <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-field-green" />
                            {fac.district}, {fac.state || 'Karnataka'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-field-green font-extrabold text-base font-mono">
                            ₹{(fac.pricePerKgPerDay / 100).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-ink-muted block">/kg /day</span>
                        </div>
                      </div>

                      {/* Capacity Bar */}
                      <div className="bg-paper rounded-xl p-3 border border-border/60 mb-3">
                        <div className="flex justify-between text-xs text-ink mb-1 font-medium">
                          <span>Capacity:</span>
                          <span className="text-teal-700 font-bold">{facOccupancy}% Occupied</span>
                        </div>
                        <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden mb-1.5">
                          <div
                            className="bg-teal-600 h-full rounded-full transition-all"
                            style={{ width: `${facOccupancy}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-ink-muted">
                          <span>Total: {(fac.totalCapacityKg / 1000).toFixed(0)} MT</span>
                          <span className="text-emerald-700 font-bold">
                            Avail: {(fac.availableCapacityKg / 1000).toFixed(1)} MT
                          </span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-ink mb-3">
                        <div className="bg-paper p-2 rounded-lg border border-border/40 flex items-center gap-1.5">
                          <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-600" />
                          <span>{fac.tempRangeC?.[0]}°C to {fac.tempRangeC?.[1]}°C</span>
                        </div>
                        <div className="bg-paper p-2 rounded-lg border border-border/40 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-field-green" />
                          <span className="truncate">{fac.contactPhone}</span>
                        </div>
                      </div>

                      {/* Suitable Crops */}
                      <div className="mb-3">
                        <div className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mb-1">
                          Suitable Crops
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(fac.suitableCrops || []).slice(0, 5).map((crop) => (
                            <span
                              key={crop}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-paper text-ink capitalize border border-border/60"
                            >
                              {crop}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                      <span className="font-mono text-[11px]">Lic: {fac.licenseNumber || 'WDRA-REG'}</span>
                      <span className="text-emerald-700 font-bold">AIF Subsidy Eligible</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Incoming & Active Bookings Section */}
        <div id="bookings" className="bg-white border border-border rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Package className="w-5 h-5 text-field-green" />
                Produce Storage Bookings &amp; Haulage Requests
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Manage storage space allocations and incoming produce batches from farmers and buyers.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-paper text-ink font-bold border border-border self-start sm:self-auto">
              {bookings.length} Total Bookings
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-10 text-ink-muted">
              <Package className="w-10 h-10 text-ink-muted/40 mx-auto mb-2" />
              <p className="text-xs font-semibold">No storage bookings received yet.</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Incoming reservations from farmers and wholesalers will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink">
                <thead className="bg-paper text-ink-muted uppercase font-bold text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Client / Role</th>
                    <th className="py-3 px-3">Crop & Quantity</th>
                    <th className="py-3 px-3">Duration & Dates</th>
                    <th className="py-3 px-3">Logistics Transit</th>
                    <th className="py-3 px-3">Total Fee</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-paper/50 transition-colors">
                      <td className="py-3.5 px-3 font-mono text-ink-muted">
                        {b.bookingId.slice(0, 14)}...
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-ink">{b.userName || 'Agri Producer'}</div>
                        <div className="text-ink-muted capitalize">
                          {b.userRole || 'Farmer'} • {b.userPhone || '+91-9876543210'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-field-green capitalize">{b.crop}</div>
                        <div className="text-ink-muted">{b.quantityKg.toLocaleString()} kg ({((b.quantityKg || 0) / 1000).toFixed(1)} MT)</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-ink">{b.days} Days</div>
                        <div className="text-ink-muted">{new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        {b.requestLogistics ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                            <Truck className="w-3 h-3" />
                            Haulage Active
                          </span>
                        ) : (
                          <span className="text-ink-muted">Self Drop-off</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-bold font-mono text-ink">
                        ₹{((b.totalCost || 0) / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            b.status === 'confirmed'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : b.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : b.status === 'completed'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.bookingId, 'active')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold transition-all"
                            >
                              Check-In
                            </button>
                          )}
                          {b.status === 'active' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.bookingId, 'completed')}
                              className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-bold transition-all"
                            >
                              Complete
                            </button>
                          )}
                          {b.status !== 'completed' && b.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.bookingId, 'cancelled')}
                              className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 text-xs font-bold transition-all"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add New Facility */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl relative my-8">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-field-green" />
                  <h3 className="text-base font-bold text-ink">Register Cold Storage Facility</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-ink-muted hover:text-ink text-lg font-bold p-1"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateFacility} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-ink mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Kaveri High-Tech Cold Store"
                    className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-field-green font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">
                      District (APMC) *
                    </label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-field-green font-semibold"
                    >
                      {['Mandya', 'Mysuru', 'Hassan', 'Kolar', 'Bengaluru Rural', 'Bengaluru Urban', 'Tumakuru', 'Belagavi', 'Dharwad', 'Shivamogga'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      WDRA / FSSAI License *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="WDRA-KA-2026-XXXX"
                      className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-field-green font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Total Capacity (kg) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="500"
                      value={formData.totalCapacityKg}
                      onChange={(e) => setFormData({ ...formData, totalCapacityKg: e.target.value })}
                      className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-field-green font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Rental Rate (paise/kg/day) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={formData.pricePerKgPerDay}
                      onChange={(e) => setFormData({ ...formData, pricePerKgPerDay: e.target.value })}
                      className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-field-green font-semibold"
                    />
                    <span className="text-[10px] text-ink-muted">
                      15 paise = ₹0.15/kg/day
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Temp Range (°C)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Min"
                        value={formData.tempMin}
                        onChange={(e) => setFormData({ ...formData, tempMin: e.target.value })}
                        className="w-1/2 bg-paper border border-border rounded-xl px-2.5 py-2 text-ink text-center"
                      />
                      <span>–</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={formData.tempMax}
                        onChange={(e) => setFormData({ ...formData, tempMax: e.target.value })}
                        className="w-1/2 bg-paper border border-border rounded-xl px-2.5 py-2 text-ink text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-field-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">
                    Facility Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Plot No. 4, Mandya APMC Industrial Area, Karnataka"
                    className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-field-green"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">
                    Suitable Crops
                  </label>
                  <input
                    type="text"
                    value={formData.suitableCrops}
                    onChange={(e) => setFormData({ ...formData, suitableCrops: e.target.value })}
                    placeholder="tomato, potato, onion, carrot, apple, mango"
                    className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-field-green"
                  />
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-paper border border-border text-ink hover:bg-border/40 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-field-green hover:bg-field-green-light text-white font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Facility'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <KisanBot userRole="storage_owner" />
    </div>
  );
}
