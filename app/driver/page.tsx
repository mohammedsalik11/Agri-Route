'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useT } from '@/lib/i18n/LanguageProvider';
import {
  Truck,
  MapPin,
  Package,
  CheckCircle2,
  Navigation,
  KeyRound,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import type { LogisticsJob, LogisticsTrip } from '@/lib/services/logisticsService';
import type { UserProfile } from '@/lib/auth';

export default function DriverDashboardPage() {
  const { t } = useT();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [availableJobs, setAvailableJobs] = useState<LogisticsJob[]>([]);
  const [myTrips, setMyTrips] = useState<Array<{ job: LogisticsJob; trip: LogisticsTrip }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<LogisticsJob | null>(null);
  const [tripsCountToAccept, setTripsCountToAccept] = useState<number>(1);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP dialog state for trip lifecycle
  const [otpModal, setOtpModal] = useState<{
    isOpen: boolean;
    jobId: string;
    tripId: string;
    type: 'pickup' | 'delivery';
    targetOtp?: string;
  }>({ isOpen: false, jobId: '', tripId: '', type: 'pickup' });
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  // Fetch driver profile and jobs
  const loadData = async () => {
    try {
      setError(null);
      const [meRes, jobsRes, tripsRes] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/logistics'),
        fetch('/api/logistics?my_trips=true'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.ok) setProfile(meData.data);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (jobsData.ok) setAvailableJobs(jobsData.data || []);
      }

      if (tripsRes.ok) {
        const tripsData = await tripsRes.json();
        if (tripsData.ok) setMyTrips(tripsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching driver data:', err);
      setError('Failed to refresh data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-poll every 6 seconds for live farmer lots and trip status updates
    const intervalId = setInterval(() => {
      loadData();
    }, 6000);

    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Driver accepts a job
  const handleAcceptJob = async () => {
    if (!selectedJob) return;
    setAccepting(true);
    setError(null);

    try {
      const res = await fetch('/api/logistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          requestedTripsCount: tripsCountToAccept,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.message || 'Failed to accept job');
      }

      setSuccessMessage(`Trip allocation confirmed for ${selectedJob.crop}!`);
      setSelectedJob(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Could not accept job');
    } finally {
      setAccepting(false);
    }
  };

  // Update trip status (en_route_pickup, picked_up, in_transit, delivered)
  const handleTripAction = async (
    jobId: string,
    tripId: string,
    nextStatus: LogisticsTrip['status'],
    requiresOtp?: 'pickup' | 'delivery'
  ) => {
    if (requiresOtp) {
      setEnteredOtp('');
      setOtpModal({
        isOpen: true,
        jobId,
        tripId,
        type: requiresOtp,
      });
      return;
    }

    try {
      const res = await fetch(`/api/logistics/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          newStatus: nextStatus,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.message || 'Status update failed');
      }

      setSuccessMessage(`Trip status updated: ${nextStatus.replace(/_/g, ' ')}`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update trip');
    }
  };

  // Submit OTP for pickup or delivery
  const handleVerifyOtp = async () => {
    if (!enteredOtp || enteredOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setOtpSubmitting(true);
    setError(null);

    try {
      const newStatus = otpModal.type === 'pickup' ? 'picked_up' : 'delivered';
      const res = await fetch(`/api/logistics/${otpModal.jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: otpModal.tripId,
          newStatus,
          otpInput: enteredOtp.trim(),
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.message || 'Invalid verification OTP');
      }

      setSuccessMessage(
        otpModal.type === 'pickup'
          ? 'Pickup verified from farmer! You can now start transit.'
          : 'Delivery verified by buyer! Trip completed and payment recorded.'
      );
      setOtpModal({ isOpen: false, jobId: '', tripId: '', type: 'pickup' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setOtpSubmitting(false);
    }
  };

  const activeTrips = myTrips.filter((t) => t.trip.status !== 'delivered');
  const completedTrips = myTrips.filter((t) => t.trip.status === 'delivered');

  const totalEarningsPaise = completedTrips.reduce((acc, curr) => acc + curr.trip.tripFee, 0);
  const totalKgHauled = completedTrips.reduce((acc, curr) => acc + curr.trip.assignedQuantityKg, 0);

  const vehicleCapacity = profile?.vehicleCapacityKg || 3000;

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Driver Profile & Vehicle Badge */}
        <div className="bg-white border border-border rounded-2xl p-5 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-700">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-ink">{profile?.name || 'Logistics Driver'}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {profile?.driverId || 'Verified Transporter'}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Base Node: <span className="font-semibold text-ink">{profile?.district}, {profile?.state || 'Karnataka'}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-paper border border-border text-xs">
                <p className="text-ink-muted text-[10px] uppercase font-bold tracking-wider">Vehicle</p>
                <p className="font-bold text-ink mt-0.5">
                  {profile?.vehicleNumber || 'KA-XX-0000'} ({profile?.vehicleType?.replace('_', ' ') || 'Truck'})
                </p>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-blue-50/50 border border-blue-200 text-xs">
                <p className="text-blue-800 text-[10px] uppercase font-bold tracking-wider">Max Capacity</p>
                <p className="font-bold text-blue-900 mt-0.5">
                  {vehicleCapacity.toLocaleString('en-IN')} kg / trip
                </p>
              </div>

              {profile?.isRefrigerated && (
                <div className="px-3 py-2 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-800 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Cold Chain</span>
                </div>
              )}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl border border-border bg-white hover:bg-paper text-ink transition-colors flex items-center justify-center"
                title="Refresh loads"
              >
                <RefreshCw className={`w-4 h-4 text-ink-muted ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts & Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-border rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-ink-muted uppercase">Active Trips</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{activeTrips.length}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-ink-muted uppercase">Completed</p>
            <p className="text-xl font-bold text-ink mt-1">{completedTrips.length}</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-ink-muted uppercase">Total Hauled</p>
            <p className="text-xl font-bold text-ink mt-1">{totalKgHauled.toLocaleString('en-IN')} kg</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-ink-muted uppercase">Total Earnings</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">₹{(totalEarningsPaise / 100).toFixed(0)}</p>
          </div>
        </div>

        {/* Active Trips Section */}
        <div id="active-trips" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              Active Hauling Trips ({activeTrips.length})
            </h2>
          </div>

          {activeTrips.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-2xl p-8 text-center">
              <Truck className="w-10 h-10 text-ink-muted/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-ink">No active trips in progress</p>
              <p className="text-xs text-ink-muted mt-1">
                Browse available loads below and claim a shipment to start earning.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTrips.map(({ job, trip }) => {
                const statusSteps = ['assigned', 'en_route_pickup', 'picked_up', 'in_transit', 'delivered'];
                const currentStepIdx = statusSteps.indexOf(trip.status);

                return (
                  <div key={trip.tripId} className="bg-white border border-border rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            Trip #{trip.tripNumber}
                          </span>
                          <span className="text-sm font-bold text-ink capitalize">{job.crop}</span>
                          <span className="text-xs text-ink-muted">· {trip.assignedQuantityKg.toLocaleString('en-IN')} kg</span>
                        </div>
                        <p className="text-xs text-ink-muted mt-1">
                          {job.orderId ? `Order #${job.orderId.slice(-6)}` : `Lot #${job.id.slice(-6)}`} · {job.estimatedDistanceKm} km route
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-ink-muted">Driver Trip Fee</p>
                        <p className="text-base font-bold text-emerald-700">₹{(trip.tripFee / 100).toFixed(0)}</p>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 text-xs border-b border-border">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink">Pickup (Farm Gate)</p>
                          <p className="text-ink-muted">{job.pickupAddress}</p>
                          <p className="text-[11px] text-ink-muted font-medium mt-0.5">{job.pickupDistrict}, {job.pickupState}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink">Delivery (Wholesaler)</p>
                          <p className="text-ink-muted">{job.deliveryAddress}</p>
                          <p className="text-[11px] text-ink-muted font-medium mt-0.5">{job.deliveryDistrict}, {job.deliveryState}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Progress */}
                    <div className="py-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-ink mb-2">
                        <span className={currentStepIdx >= 0 ? 'text-blue-700' : 'text-ink-muted'}>1. Assigned</span>
                        <span className={currentStepIdx >= 1 ? 'text-blue-700' : 'text-ink-muted'}>2. En Route</span>
                        <span className={currentStepIdx >= 2 ? 'text-blue-700' : 'text-ink-muted'}>3. Picked Up</span>
                        <span className={currentStepIdx >= 3 ? 'text-blue-700' : 'text-ink-muted'}>4. In Transit</span>
                        <span className={currentStepIdx >= 4 ? 'text-emerald-700' : 'text-ink-muted'}>5. Delivered</span>
                      </div>
                      <div className="w-full h-2 bg-paper rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${((currentStepIdx + 1) / statusSteps.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons based on status */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                      {trip.status === 'assigned' && (
                        <button
                          onClick={() => handleTripAction(job.id, trip.tripId, 'en_route_pickup')}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Start Navigation to Farm Gate
                        </button>
                      )}

                      {trip.status === 'en_route_pickup' && (
                        <button
                          onClick={() => handleTripAction(job.id, trip.tripId, 'picked_up', 'pickup')}
                          className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Arrived & Enter Farmer Pickup OTP
                        </button>
                      )}

                      {trip.status === 'picked_up' && (
                        <button
                          onClick={() => handleTripAction(job.id, trip.tripId, 'in_transit')}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Depart Farm Gate (Start Transit)
                        </button>
                      )}

                      {trip.status === 'in_transit' && (
                        <button
                          onClick={() => handleTripAction(job.id, trip.tripId, 'delivered', 'delivery')}
                          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Arrived & Enter Buyer Delivery OTP
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Loads Marketplace */}
        <div id="jobs" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Available Produce Loads ({availableJobs.length})
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Capacity-checked loads ready for pickup across Karnataka mandis & farms
              </p>
            </div>
          </div>

          {availableJobs.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-8 text-center">
              <Package className="w-10 h-10 text-ink-muted/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-ink">No pending shipments at this moment</p>
              <p className="text-xs text-ink-muted mt-1">
                New orders placed by wholesalers will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableJobs.map((job) => {
                const totalKg = job.totalQuantityKg;
                const remainingKg = job.remainingUnassignedKg;
                const canTakeFull = vehicleCapacity >= remainingKg;
                const requiredTripsForCapacity = Math.ceil(remainingKg / vehicleCapacity);

                return (
                  <div key={job.id} className="bg-white border border-border rounded-2xl p-5 hover:border-blue-400 transition-all shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-ink capitalize">{job.crop}</span>
                            {job.requiresRefrigeration && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                                Cold Chain
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {job.orderId ? `Order #${job.orderId.slice(-6)}` : `Lot #${job.id.slice(-6)}`}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] text-ink-muted font-medium">Total Logistics Pool</p>
                          <p className="text-base font-bold text-emerald-700">₹{(job.totalLogisticsFee / 100).toFixed(0)}</p>
                        </div>
                      </div>

                      {/* Route Summary */}
                      <div className="p-3 bg-paper rounded-xl space-y-1.5 text-xs mb-4">
                        <div className="flex items-center justify-between text-ink">
                          <span className="font-medium text-ink-muted">From:</span>
                          <span className="font-semibold">{job.pickupDistrict} (Farm)</span>
                        </div>
                        <div className="flex items-center justify-between text-ink">
                          <span className="font-medium text-ink-muted">To:</span>
                          <span className="font-semibold">{job.deliveryDistrict} (Wholesaler)</span>
                        </div>
                        <div className="flex items-center justify-between text-ink-muted text-[11px] pt-1 border-t border-border/60">
                          <span>Est. Distance: {job.estimatedDistanceKm} km</span>
                          <span>Unassigned: <strong className="text-ink">{remainingKg.toLocaleString('en-IN')} kg</strong> / {totalKg.toLocaleString('en-IN')} kg</span>
                        </div>
                      </div>

                      {/* Capacity Allocation Preview */}
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs mb-4">
                        <p className="font-semibold text-blue-900">
                          {canTakeFull ? (
                            `✓ Fits in 1 trip with your ${vehicleCapacity.toLocaleString('en-IN')} kg capacity vehicle.`
                          ) : (
                            `⚠️ Large load (${remainingKg.toLocaleString('en-IN')} kg). Requires ${requiredTripsForCapacity} trips of max ${vehicleCapacity.toLocaleString('en-IN')} kg each.`
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setTripsCountToAccept(1);
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <span>Claim Shipment & Allocate Trips</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Trips History */}
        {completedTrips.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Completed Trips ({completedTrips.length})
            </h2>

            <div className="bg-white border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {completedTrips.map(({ job, trip }) => (
                <div key={trip.tripId} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-ink capitalize">
                      {job.crop} · {trip.assignedQuantityKg.toLocaleString('en-IN')} kg (Trip #{trip.tripNumber})
                    </p>
                    <p className="text-ink-muted text-[11px] mt-0.5">
                      {job.pickupDistrict} → {job.deliveryDistrict} ({job.estimatedDistanceKm} km)
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                      Delivered
                    </span>
                    <p className="font-bold text-ink text-sm mt-1">₹{(trip.tripFee / 100).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Capacity-Constrained Job Acceptance */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink capitalize">Accept Shipment: {selectedJob.crop}</h3>
                <p className="text-xs text-ink-muted">Capacity-verified load allocation</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1 rounded-lg text-ink-muted hover:bg-paper"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3 bg-paper rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Available Weight:</span>
                  <span className="font-bold text-ink">{selectedJob.remainingUnassignedKg.toLocaleString('en-IN')} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Your Vehicle Capacity:</span>
                  <span className="font-bold text-blue-700">{vehicleCapacity.toLocaleString('en-IN')} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Route:</span>
                  <span className="font-medium text-ink">{selectedJob.pickupDistrict} → {selectedJob.deliveryDistrict}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Select Number of Trips:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTripsCountToAccept(1)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      tripsCountToAccept === 1
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                        : 'border-border bg-white hover:border-ink-muted'
                    }`}
                  >
                    <p className="font-bold text-ink text-xs">Single Trip (1x)</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      Haul {Math.min(vehicleCapacity, selectedJob.remainingUnassignedKg).toLocaleString('en-IN')} kg
                    </p>
                  </button>

                  {selectedJob.remainingUnassignedKg > vehicleCapacity && (
                    <button
                      type="button"
                      onClick={() => setTripsCountToAccept(2)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        tripsCountToAccept === 2
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                          : 'border-border bg-white hover:border-ink-muted'
                      }`}
                    >
                      <p className="font-bold text-ink text-xs">Round Trips (2x)</p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Haul {Math.min(vehicleCapacity * 2, selectedJob.remainingUnassignedKg).toLocaleString('en-IN')} kg
                      </p>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-xs flex justify-between items-center">
                <span>Estimated Payout:</span>
                <span className="text-sm font-bold">
                  ₹{(
                    (selectedJob.totalLogisticsFee *
                      Math.min(vehicleCapacity * tripsCountToAccept, selectedJob.remainingUnassignedKg)) /
                    (selectedJob.totalQuantityKg * 100)
                  ).toFixed(0)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="w-1/2 py-2.5 border border-border text-ink rounded-xl text-xs font-semibold hover:bg-paper"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={accepting}
                onClick={handleAcceptJob}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: OTP Verification for Pickup / Delivery */}
      {otpModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-border">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-base font-bold text-ink">
                {otpModal.type === 'pickup' ? 'Enter Farmer Pickup OTP' : 'Enter Buyer Delivery OTP'}
              </h3>
              <button
                onClick={() => setOtpModal({ isOpen: false, jobId: '', tripId: '', type: 'pickup' })}
                className="p-1 rounded-lg text-ink-muted hover:bg-paper"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-muted mb-4">
              {otpModal.type === 'pickup'
                ? 'Ask the farmer for their 6-digit handover OTP upon loading produce at farm.'
                : 'Ask the wholesaler / buyer for their 6-digit confirmation OTP upon delivery inspection.'}
            </p>

            <div className="mb-4">
              <input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                className="w-full text-center tracking-widest text-xl font-mono py-3 bg-paper border border-border rounded-xl focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOtpModal({ isOpen: false, jobId: '', tripId: '', type: 'pickup' })}
                className="w-1/2 py-2.5 border border-border text-ink rounded-xl text-xs font-semibold hover:bg-paper"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={otpSubmitting || enteredOtp.length !== 6}
                onClick={handleVerifyOtp}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {otpSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
