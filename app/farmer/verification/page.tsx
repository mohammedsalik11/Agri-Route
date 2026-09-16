'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Plus,
  UserCheck,
} from 'lucide-react';

interface VerificationBooking {
  bookingId: string;
  farmerId: string;
  farmerName: string;
  farmerDistrict: string;
  listingId?: string | null;
  crop?: string;
  qualityGrade?: string;
  quantityKg?: number;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  assignedInspector?: string | null;
  createdAt?: any;
}

export default function FarmerVerificationPage() {
  const { t, formatWeight } = useT();
  const [bookings, setBookings] = useState<VerificationBooking[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [selectedListingId, setSelectedListingId] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('09:00–11:00');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const [verRes, listRes] = await Promise.all([
        fetch('/api/verification').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/listings').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (verRes?.ok && Array.isArray(verRes.data)) {
        setBookings(verRes.data);
      }
      if (listRes?.ok && Array.isArray(listRes.data)) {
        setListings(listRes.data);
      }
    } catch (err) {
      console.error('Error loading verification data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set tomorrow as default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPreferredDate(tomorrow.toISOString().split('T')[0]);

    loadData();
  }, []);

  const handleBookVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferredDate) {
      setStatusMsg({ msg: 'Please select a date for inspection.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListingId || null,
          preferredDate,
          preferredTimeSlot,
          notes,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setStatusMsg({
          msg: 'Verification visit successfully booked! An APMC/Agristack inspector will contact you.',
          type: 'success',
        });
        setShowModal(false);
        setNotes('');
        setSelectedListingId('');
        loadData();
      } else {
        setStatusMsg({ msg: data.message || 'Failed to book verification', type: 'error' });
      }
    } catch {
      setStatusMsg({ msg: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/farmer"
              className="p-2 rounded-xl bg-white border border-border text-ink hover:bg-paper transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-xs font-bold text-field-green uppercase tracking-wide">
                Quality Assurance
              </span>
              <h1 className="text-2xl font-bold text-ink">Field Crop Verification</h1>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-field-green text-paper rounded-xl text-xs font-bold hover:bg-field-green-light flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book Visit</span>
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{statusMsg.msg}</span>
          </div>
        )}

        {/* Feature Explainer */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-field-green text-paper flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-xs space-y-1">
            <h3 className="font-bold text-emerald-950 text-sm">
              Official Quality Certification &amp; Assay
            </h3>
            <p className="text-emerald-800 leading-relaxed">
              Book a verified APMC agricultural officer to inspect your harvest in the field.
              Certified Grade A lots unlock higher wholesale benchmark pricing and faster pool matching.
            </p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Calendar className="w-4 h-4 text-field-green" />
            Your Verification Visits ({bookings.length})
          </h2>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-field-green" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-xl space-y-2">
              <UserCheck className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="text-sm font-semibold text-ink">No verification bookings yet</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Schedule a field visit for your produce to get physical quality assay and official certification.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 px-4 py-2 bg-field-green text-paper text-xs font-bold rounded-xl hover:bg-field-green-light"
              >
                Schedule First Visit
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {bookings.map((b) => (
                <div key={b.bookingId} className="py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ink capitalize">
                        {b.crop ? `${b.crop} Inspection` : 'Farm Inspection'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          b.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {b.preferredDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {b.preferredTimeSlot}
                      </span>
                    </div>
                    {b.notes && <p className="text-[11px] text-ink-light italic">"{b.notes}"</p>}
                  </div>

                  <div className="text-right text-xs">
                    {b.assignedInspector ? (
                      <div>
                        <span className="text-[10px] text-ink-muted block">Assigned Officer</span>
                        <span className="font-bold text-ink">{b.assignedInspector}</span>
                      </div>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-[11px] font-medium">
                        Assigning Inspector
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Booking Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-ink">Schedule Crop Verification</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-paper"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBookVerification} className="space-y-4 text-xs">
                {listings.length > 0 && (
                  <div>
                    <label className="font-bold text-ink block mb-1">
                      Select Produce Lot (Optional)
                    </label>
                    <select
                      value={selectedListingId}
                      onChange={(e) => setSelectedListingId(e.target.value)}
                      className="w-full p-2.5 bg-paper border border-border rounded-xl text-ink font-medium focus:outline-none focus:border-field-green"
                    >
                      <option value="">General Farm Inspection</option>
                      {listings.map((l) => (
                        <option key={l.listingId} value={l.listingId}>
                          {l.crop} · {formatWeight(l.quantityKg)} (Grade {l.qualityGrade})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-bold text-ink block mb-1">Preferred Inspection Date</label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full p-2.5 bg-paper border border-border rounded-xl text-ink font-medium focus:outline-none focus:border-field-green"
                  />
                </div>

                <div>
                  <label className="font-bold text-ink block mb-1">Preferred Time Window</label>
                  <select
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="w-full p-2.5 bg-paper border border-border rounded-xl text-ink font-medium focus:outline-none focus:border-field-green"
                  >
                    <option value="09:00–11:00">Morning (09:00 AM – 11:00 AM)</option>
                    <option value="11:00–13:00">Mid-day (11:00 AM – 01:00 PM)</option>
                    <option value="14:00–16:00">Afternoon (02:00 PM – 04:00 PM)</option>
                    <option value="16:00–18:00">Evening (04:00 PM – 06:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-ink block mb-1">
                    Special Instructions / Farm Landmarks
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. Near the village water tank, north gate entry."
                    className="w-full p-2.5 bg-paper border border-border rounded-xl text-ink font-medium focus:outline-none focus:border-field-green resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-border rounded-xl font-bold text-ink-muted hover:bg-paper"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-field-green text-paper rounded-xl font-bold hover:bg-field-green-light flex items-center justify-center gap-1.5 disabled:opacity-50"
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
