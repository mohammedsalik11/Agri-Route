'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Phone } from 'lucide-react';
import type { LogisticsJob } from '@/lib/services/logisticsService';

interface LogisticsTrackerProps {
  orderId: string;
  isFarmer?: boolean;
}

export const LogisticsTracker: React.FC<LogisticsTrackerProps> = ({ orderId, isFarmer }) => {
  const [job, setJob] = useState<LogisticsJob | null>(null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/logistics/track/' + orderId)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.data) {
          setJob(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-4 bg-paper rounded w-1/3 mb-2" />
        <div className="h-3 bg-paper rounded w-1/2" />
      </div>
    );
  }

  if (!job || !job.trips || job.trips.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-border text-xs flex items-center justify-between text-ink-muted">
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-ink-muted" />
          <span>Logistics: Open on Transporter Board (Awaiting Driver Allocation)</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-paper border border-border text-[10px] font-semibold">
          Pending
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-border space-y-3">
      <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-ink">
              Logistics: {job.trips.length} {job.trips.length === 1 ? 'Trip' : 'Trips'} Allocated
            </p>
            <p className="text-[11px] text-ink-muted">
              {job.pickupDistrict} → {job.deliveryDistrict} ({job.estimatedDistanceKm} km)
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
          {job.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="space-y-2">
        {job.trips.map((trip) => {
          const isDelivered = trip.status === 'delivered';
          const isInTransit = trip.status === 'in_transit';
          const isPickedUp = trip.status === 'picked_up';

          let badgeClass = 'bg-amber-100 text-amber-800';
          if (isDelivered) badgeClass = 'bg-emerald-100 text-emerald-800';
          else if (isInTransit || isPickedUp) badgeClass = 'bg-blue-100 text-blue-800 animate-pulse';

          return (
            <div
              key={trip.tripId}
              className="p-3 bg-paper/60 rounded-xl border border-border/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">
                    Trip #{trip.tripNumber}: {trip.assignedQuantityKg.toLocaleString('en-IN')} kg
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    · {trip.vehicleType?.replace('_', ' ') || 'Truck'} ({trip.vehicleNumber || 'KA-XX-0000'})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-muted">
                  <span>Driver: <strong className="text-ink">{trip.assignedDriverName || 'Assigned Transporter'}</strong></span>
                  {trip.assignedDriverPhone && (
                    <span className="text-blue-600 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" /> {trip.assignedDriverPhone}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isFarmer && trip.pickupOtp && trip.status === 'en_route_pickup' && (
                  <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-mono font-bold text-[11px]">
                    Pickup OTP: {trip.pickupOtp}
                  </span>
                )}
                {!isFarmer && trip.deliveryOtp && (trip.status === 'in_transit' || trip.status === 'picked_up') && (
                  <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-mono font-bold text-[11px]">
                    Delivery OTP: {trip.deliveryOtp}
                  </span>
                )}
                <span className={"px-2 py-1 rounded-lg font-semibold text-[10px] " + badgeClass}>
                  {trip.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
