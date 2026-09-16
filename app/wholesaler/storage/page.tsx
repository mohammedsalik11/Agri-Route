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
} from 'lucide-react';

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
}

export default function WholesalerStoragePage() {
  const { t, formatCurrency, formatWeight } = useT();

  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch('/api/storage')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && Array.isArray(res.data)) {
          setFacilities(res.data);
        }
      })
      .catch((err) => console.error('Error fetching storage facilities:', err))
      .finally(() => setLoading(false));
  }, []);

  const districts = ['ALL', 'Mandya', 'Mysuru', 'Hassan', 'Kolar'];

  const filteredFacilities = facilities.filter((fac) => {
    const matchesDistrict =
      selectedDistrict === 'ALL' ||
      fac.district.toLowerCase() === selectedDistrict.toLowerCase();

    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.suitableCrops.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDistrict && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-paper pb-24">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-border">
          <div>
            <span className="text-xs font-semibold text-earth uppercase tracking-wide">
              Agri Logistics & Infrastructure
            </span>
            <h1 className="text-xl font-bold text-ink mt-0.5">
              Cold Storage & Logistics Hubs
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Locate verified temperature-controlled storage and staging centers across Karnataka
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-paper rounded-xl text-xs font-bold text-ink border border-border">
              {filteredFacilities.length} Facilities Active
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by facility name, operator, or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-paper pl-9 pr-3 py-2 text-xs rounded-xl border border-border focus:outline-none focus:border-earth font-medium text-ink"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedDistrict === d
                    ? 'bg-earth text-white'
                    : 'bg-paper text-ink-muted hover:bg-border/40'
                }`}
              >
                {d === 'ALL' ? 'All Districts' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Facilities Grid */}
        {loading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-white rounded-2xl h-36 border border-border" />
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
                      <h3 className="font-bold text-base text-ink">{fac.name}</h3>
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
                    <span>{fac.district}, Karnataka</span>
                  </div>

                  <a
                    href={`tel:${fac.contactPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-earth text-white text-xs font-bold rounded-xl hover:bg-earth-light transition-all shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact Facility</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
