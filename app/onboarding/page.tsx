'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import { Sprout, Store, Truck, Warehouse, AlertCircle, Loader2, CheckCircle, Info, ArrowLeft, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { useClerk } from '@clerk/nextjs';

import { INDIAN_STATES, getDistrictsForState } from '@/lib/constants/indianStates';

const CROP_OPTIONS = [
  'Tomato', 'Onion', 'Potato', 'Ragi', 'Paddy', 'Maize', 'Wheat',
  'Banana', 'Brinjal', 'Cabbage', 'Cauliflower', 'Groundnut',
  'Soybean', 'Sugarcane', 'Cotton',
];

export interface OnboardingDemoProfile {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner';
  state: string;
  district: string;
  clerkUserId: string;
  avatar: string;
  tag: string;
  badge: string;
  village?: string;
  landSizeAcres?: string;
  crops?: string[];
  businessName?: string;
  gstin?: string;
  vehicleType?: 'truck' | 'mini_truck' | 'pickup' | 'tractor';
  vehicleNumber?: string;
  vehicleCapacityKg?: string;
  isRefrigerated?: boolean;
  facilityName?: string;
  licenseNumber?: string;
  storageCapacityKg?: string;
  pricePerKgPerDay?: string;
  facilityAddress?: string;
}

const DEMO_PROFILES_BY_ROLE: Record<'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner', OnboardingDemoProfile[]> = {
  farmer: [
    {
      id: 'KA-MAN-2026-004417',
      email: 'farmer.demo@agriroute.in',
      name: 'Lakshmamma',
      role: 'farmer',
      state: 'Karnataka',
      district: 'Mandya',
      village: 'Tubinakere',
      landSizeAcres: '3.5',
      crops: ['Tomato', 'Paddy', 'Ragi'],
      clerkUserId: 'user_3JmfQOD5urjMYyFTxKGzI7mIl6j',
      avatar: '🌾',
      tag: 'Mandya, KA',
      badge: 'Tomato Pool',
    },
    {
      id: 'MH-NAS-2026-008129',
      email: 'farmer.nashik@agriroute.in',
      name: 'Prakash Patil',
      role: 'farmer',
      state: 'Maharashtra',
      district: 'Nashik',
      village: 'Lasalgaon',
      landSizeAcres: '4.5',
      crops: ['Onion', 'Banana', 'Tomato'],
      clerkUserId: 'user_3JmhmxLN8EyglsDOe2uAUR5mwgl',
      avatar: '🌾',
      tag: 'Nashik, MH',
      badge: 'Onion Pool',
    },
    {
      id: 'PB-LUD-2026-003921',
      email: 'farmer.ludhiana@agriroute.in',
      name: 'Gurpreet Singh',
      role: 'farmer',
      state: 'Punjab',
      district: 'Ludhiana',
      village: 'Samrala',
      landSizeAcres: '8.0',
      crops: ['Wheat', 'Paddy', 'Potato'],
      clerkUserId: 'user_3Jmhn9LFCh8NPkrc6KHVfhbuLio',
      avatar: '🌾',
      tag: 'Ludhiana, PB',
      badge: 'Wheat Pool',
    },
    {
      id: 'AP-GUN-2026-005612',
      email: 'farmer.guntur@agriroute.in',
      name: 'Venkateswara Rao',
      role: 'farmer',
      state: 'Andhra Pradesh',
      district: 'Guntur',
      village: 'Tenali',
      landSizeAcres: '5.2',
      crops: ['Cotton', 'Paddy', 'Tomato'],
      clerkUserId: 'user_3JmhnBjIvOqHn4Fq5QK3sqhsYRh',
      avatar: '🌾',
      tag: 'Guntur, AP',
      badge: 'Chilli Pool',
    },
    {
      id: 'UP-AGR-2026-007733',
      email: 'farmer.agra@agriroute.in',
      name: 'Shivram Yadav',
      role: 'farmer',
      state: 'Uttar Pradesh',
      district: 'Agra',
      village: 'Khandari',
      landSizeAcres: '6.0',
      crops: ['Potato', 'Wheat', 'Mustard'],
      clerkUserId: 'user_3KHSt7UbqYSJgNNOHLC0CzG7KFG',
      avatar: '🌾',
      tag: 'Agra, UP',
      badge: 'Potato Pool',
    },
  ],
  wholesaler: [
    {
      id: 'WS-KA-2026-1183',
      email: 'wholesaler.demo@agriroute.in',
      name: 'Suresh Traders',
      businessName: 'Suresh Traders Bengaluru',
      role: 'wholesaler',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      gstin: '29AAAAA0000A1Z5',
      clerkUserId: 'user_3JmfUujj15M00HzIJciXKVuf3wt',
      avatar: '🏪',
      tag: 'Bengaluru, KA',
      badge: 'APMC Gate 4',
    },
    {
      id: 'WS-DL-2026-3021',
      email: 'wholesaler.delhi@agriroute.in',
      name: 'Aggarwal Mandi Traders',
      businessName: 'Aggarwal Mandi Traders Delhi',
      role: 'wholesaler',
      state: 'Delhi',
      district: 'North Delhi',
      gstin: '07AAAAA1111B1Z2',
      clerkUserId: 'user_3JmhnNuO35BLqEFfnK2LTDirZsn',
      avatar: '🏪',
      tag: 'Azadpur, DL',
      badge: 'Shed B-4 Buyer',
    },
    {
      id: 'WS-MH-2026-4412',
      email: 'wholesaler.mumbai@agriroute.in',
      name: 'Vashi Agro APMC Traders',
      businessName: 'Vashi Wholesale APMC Market Bay 12',
      role: 'wholesaler',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      gstin: '27AAAAA5555C1Z9',
      clerkUserId: 'user_3KHStBn1wJMVw4aBFcdqbQ47dZA',
      avatar: '🏪',
      tag: 'Navi Mumbai, MH',
      badge: 'Vashi APMC Bay 12',
    },
    {
      id: 'WS-PB-2026-5599',
      email: 'wholesaler.punjab@agriroute.in',
      name: 'Khanna Grain Merchants',
      businessName: 'Asia Largest Grain Terminal Corp',
      role: 'wholesaler',
      state: 'Punjab',
      district: 'Ludhiana',
      gstin: '03AAAAA8888D1Z4',
      clerkUserId: 'user_3KHStFyRBAo1LsZndn6qX2zWuLb',
      avatar: '🏪',
      tag: 'Khanna, PB',
      badge: 'Grain Terminal',
    },
    {
      id: 'WS-TS-2026-6622',
      email: 'wholesaler.hyderabad@agriroute.in',
      name: 'Deccan Produce Wholesalers',
      businessName: 'Kothapet Wholesale Spice Market',
      role: 'wholesaler',
      state: 'Telangana',
      district: 'Hyderabad',
      gstin: '36AAAAA9999E1Z1',
      clerkUserId: 'user_3KHStK4AubXRDO8IMC13kArd40G',
      avatar: '🏪',
      tag: 'Hyderabad, TS',
      badge: 'Kothapet Spice Bay',
    },
  ],
  logistics_driver: [
    {
      id: 'DRV-KA-2026-0042',
      email: 'driver.demo@agriroute.in',
      name: 'Ramesh Transport',
      role: 'logistics_driver',
      state: 'Karnataka',
      district: 'Mandya',
      vehicleType: 'truck',
      vehicleNumber: 'KA-11-TR-4590',
      vehicleCapacityKg: '10000',
      isRefrigerated: false,
      clerkUserId: 'user_3JmfV7pqfOWT9HwRbD0gKYw5ZSY',
      avatar: '🚛',
      tag: 'Mandya, KA',
      badge: '10T Cargo Truck',
    },
    {
      id: 'DRV-PB-2026-0089',
      email: 'driver.punjab@agriroute.in',
      name: 'Harnek Singh Freight',
      role: 'logistics_driver',
      state: 'Punjab',
      district: 'Ludhiana',
      vehicleType: 'truck',
      vehicleNumber: 'PB-10-CD-5678',
      vehicleCapacityKg: '10000',
      isRefrigerated: true,
      clerkUserId: 'user_3JmhnY8jtFRU0bMR3FEVbSf9b5g',
      avatar: '🚛',
      tag: 'Ludhiana, PB',
      badge: '10T Cold Reefer',
    },
    {
      id: 'DRV-MH-2026-3011',
      email: 'driver.maharashtra@agriroute.in',
      name: 'Balaji Roadlines',
      role: 'logistics_driver',
      state: 'Maharashtra',
      district: 'Nashik',
      vehicleType: 'truck',
      vehicleNumber: 'MH-15-AB-3344',
      vehicleCapacityKg: '10000',
      isRefrigerated: false,
      clerkUserId: 'user_3KHStiQmm5E7Jsy3WjgqRhshpGp',
      avatar: '🚛',
      tag: 'Nashik, MH',
      badge: '10T Interstate ICV',
    },
    {
      id: 'DRV-UP-2026-7788',
      email: 'driver.up@agriroute.in',
      name: 'Ganga Express Logistics',
      role: 'logistics_driver',
      state: 'Uttar Pradesh',
      district: 'Agra',
      vehicleType: 'truck',
      vehicleNumber: 'UP-80-XY-9988',
      vehicleCapacityKg: '10000',
      isRefrigerated: false,
      clerkUserId: 'user_3KHStrHsRQev2fqpL3ArYDapFeW',
      avatar: '🚛',
      tag: 'Agra, UP',
      badge: '10T Cargo Express',
    },
    {
      id: 'DRV-AP-2026-4411',
      email: 'driver.ap@agriroute.in',
      name: 'Coastal Cargo Carriers',
      role: 'logistics_driver',
      state: 'Andhra Pradesh',
      district: 'Guntur',
      vehicleType: 'mini_truck',
      vehicleNumber: 'AP-07-JK-4411',
      vehicleCapacityKg: '3000',
      isRefrigerated: false,
      clerkUserId: 'user_3KHSu0oNUrbEFRt68ibzfIe1e0y',
      avatar: '🚛',
      tag: 'Guntur, AP',
      badge: '3T Mini Truck',
    },
  ],
  storage_owner: [
    {
      id: 'STO-KA-2026-1001',
      email: 'storage.demo@agriroute.in',
      name: 'H. M. Chandrashekar',
      businessName: 'Karnataka Cold Chain Pvt Ltd',
      facilityName: 'Mandya Agri Cold Store',
      role: 'storage_owner',
      state: 'Karnataka',
      district: 'Mandya',
      licenseNumber: 'WDRA-KA-MAN-2024-0891',
      storageCapacityKg: '500000',
      pricePerKgPerDay: '15',
      facilityAddress: 'KIADB Industrial Area, Tubinakere, Mandya',
      clerkUserId: 'user_3JmfV2IGQUlik22UhBGGQ2wJxA2',
      avatar: '🧊',
      tag: 'Mandya, KA',
      badge: 'WDRA 500T · ₹15/day',
    },
    {
      id: 'STO-MH-2026-1003',
      email: 'storage.nashik@agriroute.in',
      name: 'Dilip R. Deshmukh',
      businessName: 'Maharashtra State Warehousing Corp',
      facilityName: 'Nashik Agro Cold Chain Hub',
      role: 'storage_owner',
      state: 'Maharashtra',
      district: 'Nashik',
      licenseNumber: 'WDRA-MH-NAS-2023-0412',
      storageCapacityKg: '1000000',
      pricePerKgPerDay: '14',
      facilityAddress: 'MIDC Ambad Industrial Area, Nashik',
      clerkUserId: 'user_3JmhnmEGVvZMZWekueztRKNJUBj',
      avatar: '🧊',
      tag: 'Nashik, MH',
      badge: 'WDRA 1,000T · ₹14/day',
    },
    {
      id: 'STO-UP-2026-3088',
      email: 'storage.agra@agriroute.in',
      name: 'Khandari Cold Storage Cluster',
      businessName: 'Khandari Agro Warehousing Corp',
      facilityName: 'Khandari Cold Storage Cluster',
      role: 'storage_owner',
      state: 'Uttar Pradesh',
      district: 'Agra',
      licenseNumber: 'WDRA-UP-AGR-2024-1102',
      storageCapacityKg: '800000',
      pricePerKgPerDay: '16',
      facilityAddress: 'Khandari Industrial Zone, Agra',
      clerkUserId: 'user_3KHStvnXlEllSV6OGLOhNnLeRUv',
      avatar: '🧊',
      tag: 'Agra, UP',
      badge: 'WDRA 800T · ₹16/day',
    },
    {
      id: 'STO-PB-2026-2005',
      email: 'storage.ludhiana@agriroute.in',
      name: 'Punjab Agro Cold Chain Depot',
      businessName: 'Punjab Agro Industries Corp',
      facilityName: 'Punjab Agro Cold Chain Depot',
      role: 'storage_owner',
      state: 'Punjab',
      district: 'Ludhiana',
      licenseNumber: 'WDRA-PB-LUD-2023-0981',
      storageCapacityKg: '600000',
      pricePerKgPerDay: '15',
      facilityAddress: 'GT Road Cold Complex, Samrala, Ludhiana',
      clerkUserId: 'user_3KHSu2zU5Yfs31WjkXqBjQ8kwjF',
      avatar: '🧊',
      tag: 'Ludhiana, PB',
      badge: 'WDRA 600T · ₹15/day',
    },
    {
      id: 'STO-AP-2026-4019',
      email: 'storage.guntur@agriroute.in',
      name: 'Guntur Spices Cold Terminal',
      businessName: 'AP State Warehousing Corp',
      facilityName: 'Guntur Spices Cold Terminal',
      role: 'storage_owner',
      state: 'Andhra Pradesh',
      district: 'Guntur',
      licenseNumber: 'WDRA-AP-GUN-2024-0554',
      storageCapacityKg: '500000',
      pricePerKgPerDay: '18',
      facilityAddress: 'Tenali Road Cold Hub, Guntur',
      clerkUserId: 'user_3KHSuH6dqJ52p50fPvIIRZMQbIw',
      avatar: '🧊',
      tag: 'Guntur, AP',
      badge: 'WDRA 500T · ₹18/day',
    },
  ],
};




export default function OnboardingPage() {
  const { t } = useT();
  const { language } = useLanguage();
  const router = useRouter();
  const clerk = useClerk();

  const [role, setRole] = useState<'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner'>('farmer');
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Karnataka');
  const [village, setVillage] = useState('');
  const [landSizeAcres, setLandSizeAcres] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  // Driver fields
  const [vehicleType, setVehicleType] = useState<'truck' | 'mini_truck' | 'pickup' | 'tractor'>('truck');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleCapacityKg, setVehicleCapacityKg] = useState('3000');
  const [isRefrigerated, setIsRefrigerated] = useState(false);
  // Cold Storage Owner fields
  const [facilityName, setFacilityName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [storageCapacityKg, setStorageCapacityKg] = useState('500000');
  const [pricePerKgPerDay, setPricePerKgPerDay] = useState('15');
  const [facilityAddress, setFacilityAddress] = useState('');

  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [loggingInUserId, setLoggingInUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: role select, Step 2: details
  const availableDistricts = getDistrictsForState(state);

  // Pre-load existing profile data so the user can review/update inputs, but NEVER auto-redirect away
  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.data) {
          const profile = data.data;
          if (profile.role) setRole(profile.role);
          if (profile.name) setName(profile.name);
          if (profile.district) setDistrict(profile.district);
          if (profile.state) setState(profile.state || 'Karnataka');
          if (profile.farmerId) setIdNumber(profile.farmerId);
          if (profile.wholesalerId) setIdNumber(profile.wholesalerId);
          if (profile.driverId) setIdNumber(profile.driverId);
          if (profile.ownerId) setIdNumber(profile.ownerId);
          if (profile.village) setVillage(profile.village);
          if (profile.landSizeAcres) setLandSizeAcres(String(profile.landSizeAcres));
          if (profile.primaryCrops && Array.isArray(profile.primaryCrops)) {
            setSelectedCrops(profile.primaryCrops.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1)));
          }
          if (profile.businessName) setBusinessName(profile.businessName);
          if (profile.gstin) setGstin(profile.gstin);
          if (profile.vehicleType) setVehicleType(profile.vehicleType);
          if (profile.vehicleNumber) setVehicleNumber(profile.vehicleNumber);
          if (profile.vehicleCapacityKg) setVehicleCapacityKg(String(profile.vehicleCapacityKg));
          if (profile.isRefrigerated !== undefined) setIsRefrigerated(profile.isRefrigerated);
          if (profile.facilityName) setFacilityName(profile.facilityName);
          if (profile.licenseNumber) setLicenseNumber(profile.licenseNumber);
          if (profile.storageCapacityKg) setStorageCapacityKg(String(profile.storageCapacityKg));
          if (profile.pricePerKgPerDay) setPricePerKgPerDay(String(profile.pricePerKgPerDay));
          if (profile.facilityAddress) setFacilityAddress(profile.facilityAddress);
        }
      })
      .catch(() => {});

    const cookies = document.cookie.split('; ');
    const roleCookie = cookies.find((c) => c.startsWith('intendedRole='));
    if (roleCookie) {
      const val = roleCookie.split('=')[1];
      if (val === 'wholesaler' || val === 'farmer' || val === 'logistics_driver' || val === 'storage_owner') {
        setRole(val as any);
      }
    }
  }, []);

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleRoleSelect = (r: 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner') => {
    setRole(r);
    setSelectedDemoId(null);
    setError(null);
    setStep(2);
  };

  const applyProfile = (p: OnboardingDemoProfile) => {
    setSelectedDemoId(p.id);
    setName(p.name);
    setIdNumber(p.id);
    setState(p.state);
    setDistrict(p.district);
    if (role === 'farmer') {
      setVillage(p.village || '');
      setLandSizeAcres(p.landSizeAcres || '3.5');
      if (p.crops) setSelectedCrops(p.crops);
    } else if (role === 'wholesaler') {
      setBusinessName(p.businessName || p.name);
      setGstin(p.gstin || '');
    } else if (role === 'logistics_driver') {
      setVehicleType(p.vehicleType || 'truck');
      setVehicleNumber(p.vehicleNumber || 'KA-11-TR-4590');
      setVehicleCapacityKg(p.vehicleCapacityKg || '10000');
      setIsRefrigerated(p.isRefrigerated ?? false);
    } else if (role === 'storage_owner') {
      setBusinessName(p.businessName || '');
      setFacilityName(p.facilityName || p.name);
      setLicenseNumber(p.licenseNumber || 'WDRA-KA-MAN-2024-0891');
      setStorageCapacityKg(p.storageCapacityKg || '500000');
      setPricePerKgPerDay(p.pricePerKgPerDay || '15');
      setFacilityAddress(p.facilityAddress || `${p.district} Industrial Area, ${p.state}`);
    }
    setError(null);
  };

  const handleOneStepLogin = async (p: OnboardingDemoProfile) => {
    if (loggingInUserId) return;
    setLoggingInUserId(p.clerkUserId);
    setError(null);

    const destination =
      p.role === 'farmer'
        ? '/farmer'
        : p.role === 'wholesaler'
        ? '/wholesaler'
        : p.role === 'logistics_driver'
        ? '/driver'
        : '/storage-owner';

    // Set cookie immediately for quick routing
    document.cookie = `userRole=${p.role};path=/;max-age=${60 * 60 * 24 * 30}`;

    try {
      if (clerk?.session) {
        try {
          await clerk.signOut();
        } catch {
          // ignore signout error
        }
      }

      // 1. Try in-app token login via backend API
      try {
        const res = await fetch('/api/demo/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkUserId: p.clerkUserId }),
        });
        const data = await res.json();
        if (data?.ok && data?.token && clerk?.client?.signIn) {
          const attempt = await (clerk.client.signIn as any).create({
            strategy: 'ticket',
            ticket: data.token,
          });
          if (attempt?.status === 'complete' && attempt?.createdSessionId) {
            await clerk.setActive({ session: attempt.createdSessionId });
            window.location.href = data.destination || destination;
            return;
          }
        }
      } catch (tokenErr) {
        console.warn('Ticket sign-in attempt warning:', tokenErr);
      }

      // 2. Direct in-app password sign-in (100% on AgriRoute, 0 external clerk website visits!)
      if (clerk?.client?.signIn && p.email) {
        const pwAttempt = await clerk.client.signIn.create({
          identifier: p.email,
          password: 'Password@AgriRoute2026',
        });
        if (pwAttempt?.status === 'complete' && pwAttempt?.createdSessionId) {
          await clerk.setActive({ session: pwAttempt.createdSessionId });
          window.location.href = destination;
          return;
        }
      }

      // 3. Fallback: autofill the form so user can proceed
      applyProfile(p);
      setError('Form autofilled with verified profile below. Click "Verify & Continue" to launch.');
      setLoggingInUserId(null);
    } catch (err: unknown) {
      console.error('1-step login error:', err);
      applyProfile(p);
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(`${msg}. Profile loaded into form below.`);
      setLoggingInUserId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation before hitting the API
    if (!name.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }
    if (!district) {
      setError('Please select your district.');
      setLoading(false);
      return;
    }
    if (role === 'wholesaler' && !businessName.trim()) {
      setError('Please enter your business name.');
      setLoading(false);
      return;
    }
    if (role === 'logistics_driver' && !vehicleNumber.trim()) {
      setError('Please enter your vehicle registration number.');
      setLoading(false);
      return;
    }
    if (role === 'storage_owner' && !facilityName.trim()) {
      setError('Please enter your cold-storage facility name.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/onboarding/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name: name.trim(),
          idNumber: idNumber.trim().toUpperCase(),
          district,
          state,
          village: role === 'farmer' ? village.trim() : undefined,
          landSizeAcres: role === 'farmer' ? parseFloat(landSizeAcres) || undefined : undefined,
          primaryCrops: role === 'farmer' ? selectedCrops.map((c) => c.toLowerCase()) : undefined,
          businessName: role === 'wholesaler' || role === 'storage_owner' ? businessName.trim() : undefined,
          gstin: role === 'wholesaler' ? gstin.trim() : undefined,
          vehicleType: role === 'logistics_driver' ? vehicleType : undefined,
          vehicleNumber: role === 'logistics_driver' ? vehicleNumber.trim().toUpperCase() : undefined,
          vehicleCapacityKg: role === 'logistics_driver' ? Number(vehicleCapacityKg) || 3000 : undefined,
          isRefrigerated: role === 'logistics_driver' ? isRefrigerated : undefined,
          facilityName: role === 'storage_owner' ? facilityName.trim() : undefined,
          licenseNumber: role === 'storage_owner' ? licenseNumber.trim() : undefined,
          storageCapacityKg: role === 'storage_owner' ? Number(storageCapacityKg) || 500000 : undefined,
          pricePerKgPerDay: role === 'storage_owner' ? Number(pricePerKgPerDay) || 15 : undefined,
          facilityAddress: role === 'storage_owner' ? facilityAddress.trim() : undefined,
          language,
        }),
      });

      let data: { ok: boolean; message?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        setError(`Server returned an unexpected response (HTTP ${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      if (!data.ok) {
        // Show the exact server message so the user knows what went wrong
        setError(data.message || `Something went wrong (${res.status}). Please check your details and try again.`);
        setLoading(false);
        return;
      }

      // Onboarding succeeded — Clerk publicMetadata is updated on the server.
      let destination = '/farmer';
      if (role === 'wholesaler') destination = '/wholesaler';
      if (role === 'logistics_driver') destination = '/driver';
      if (role === 'storage_owner') destination = '/storage-owner';

      const isAndroidSource = typeof window !== 'undefined' && (
        window.location.search.includes('source=android') ||
        window.navigator.userAgent.includes('Android')
      );

      if (isAndroidSource) {
        const appLink = `agriroute://auth-callback?role=${encodeURIComponent(role)}&name=${encodeURIComponent(name)}&district=${encodeURIComponent(district)}&idNumber=${encodeURIComponent(idNumber)}`;
        window.location.href = appLink;
        setTimeout(() => {
          window.location.href = destination;
        }, 1000);
        return;
      }

      window.location.href = destination;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error — please check your connection and try again.';
      setError(msg);
      setLoading(false);
    }
  };

  // Step 1: Role selection
  if (step === 1) {
    return (
      <main className="min-h-screen bg-paper flex flex-col items-center justify-between px-4 py-8 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-72 bg-gradient-to-b from-field-green/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="text-center pt-4 mb-6 flex flex-col items-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 border border-border shadow-md mb-3 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Agri Route Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[11px] font-bold text-field-green uppercase tracking-wider bg-field-green/10 px-3 py-1 rounded-full mb-1.5">
            Step 1 of 2 · {t('role.title')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {t('role.title')}
          </h1>
          <p className="text-xs text-ink-muted mt-1 max-w-xs">{t('app.tagline')}</p>
        </div>

        <div className="w-full max-w-md space-y-3.5 my-auto relative z-10">
          {/* Farmer Card */}
          <button
            onClick={() => handleRoleSelect('farmer')}
            className={`w-full flex items-center gap-4 p-4.5 bg-white rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] text-left shadow-xs group min-h-[76px] ${
              role === 'farmer' ? 'border-field-green bg-emerald-50/50 ring-2 ring-field-green/20' : 'border-border hover:border-field-green/60 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-field-green/10 text-field-green flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink text-base">{t('role.farmer')}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-field-green bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {t('onboarding.producer')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{t('role.farmerDesc')}</p>
            </div>
          </button>

          {/* Wholesaler Card */}
          <button
            onClick={() => handleRoleSelect('wholesaler')}
            className={`w-full flex items-center gap-4 p-4.5 bg-white rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] text-left shadow-xs group min-h-[76px] ${
              role === 'wholesaler' ? 'border-earth bg-amber-50/50 ring-2 ring-earth/20' : 'border-border hover:border-earth/60 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-earth/10 text-earth flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink text-base">{t('role.wholesaler')}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-earth bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {t('onboarding.buyer')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{t('role.wholesalerDesc')}</p>
            </div>
          </button>

          {/* Logistics Driver Card */}
          <button
            onClick={() => handleRoleSelect('logistics_driver')}
            className={`w-full flex items-center gap-4 p-4.5 bg-white rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] text-left shadow-xs group min-h-[76px] ${
              role === 'logistics_driver' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-border hover:border-blue-600/60 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink text-base">{t('role.driver') || 'Logistics Driver'}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {t('onboarding.transporter')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{t('role.driverDesc') || 'Deliver produce and earn per trip'}</p>
            </div>
          </button>

          {/* Cold Storage Owner Card */}
          <button
            onClick={() => handleRoleSelect('storage_owner')}
            className={`w-full flex items-center gap-4 p-4.5 bg-white rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] text-left shadow-xs group min-h-[76px] ${
              role === 'storage_owner' ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20' : 'border-border hover:border-teal-600/60 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Warehouse className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink text-base">{t('onboarding.storageOwnerCardTitle')}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {t('onboarding.storageOwnerCardTag')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{t('onboarding.storageOwnerCardDesc')}</p>
            </div>
          </button>
        </div>

        <div className="w-full max-w-md pt-4 text-center relative z-10">
          <p className="text-[11px] text-ink-muted">
            {t('app.footerNote')}
          </p>
        </div>
      </main>
    );
  }

  // Step 2: Profile form
  return (
    <main className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStep(1); setError(null); }}
              className="p-2.5 rounded-xl bg-white border border-border text-ink hover:bg-paper shadow-xs flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('onboarding.changeRole')}</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                {role === 'farmer' && <Sprout className="w-4 h-4 text-field-green" />}
                {role === 'wholesaler' && <Store className="w-4 h-4 text-earth" />}
                {role === 'logistics_driver' && <Truck className="w-4 h-4 text-blue-600" />}
                {role === 'storage_owner' && <Warehouse className="w-4 h-4 text-cyan-700" />}
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  {role === 'storage_owner'
                    ? t('role.storageOwner')
                    : role === 'logistics_driver'
                    ? (t('role.driver') || 'Logistics Driver')
                    : t(`role.${role}`)}
                </span>
              </div>
              <h1 className="text-xl font-bold text-ink">{t('onboarding.title')}</h1>
            </div>
          </div>
        </div>



        {/* Registry note */}
        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-blue-800">
            {t('onboarding.verifyNote')}
          </p>
        </div>

        {/* 1-Step Demo Profiles (Small, only icon with name) */}
        {(() => {
          const activeProfiles = DEMO_PROFILES_BY_ROLE[role] || [];
          return (
            <div className="mb-4 bg-white border border-border rounded-2xl p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-field-green" />
                  <span>1-Step Demo Logins:</span>
                </span>
                <span className="text-[10px] text-ink-muted">Click to log in directly</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeProfiles.map((p) => {
                  const isLoggingIn = loggingInUserId === p.clerkUserId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleOneStepLogin(p)}
                      disabled={!!loggingInUserId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-paper/60 hover:bg-emerald-50/70 hover:border-field-green text-ink text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer group"
                      title={`1-Step Login as ${p.name} (${p.tag})`}
                    >
                      {isLoggingIn ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-field-green" />
                      ) : (
                        <span className="text-sm shrink-0">{p.avatar}</span>
                      )}
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              {t('onboarding.name')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none transition-colors"
              placeholder={
                role === 'farmer'
                  ? t('onboarding.namePlaceholderFarmer')
                  : role === 'wholesaler'
                  ? t('onboarding.namePlaceholderWholesaler')
                  : 'Driver / Transporter Name'
              }
            />
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              {role === 'farmer'
                ? t('onboarding.farmerId')
                : role === 'wholesaler'
                ? t('onboarding.wholesalerId')
                : 'Driver ID / Licence Number'} *
            </label>
            <input
              type="text"
              required
              value={idNumber}
              onChange={(e) => { setIdNumber(e.target.value); setError(null); }}
              placeholder={
                role === 'farmer'
                  ? 'KA-MAN-2026-004417'
                  : role === 'wholesaler'
                  ? 'WS-KA-2026-1183'
                  : 'DRV-KA-2026-1042'
              }
              className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-field-green focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-ink-muted mt-1.5">
              {role === 'farmer'
                ? 'Format: SS-XXX-YYYY-NNNNNN (e.g. MH-NAS-2026-008129 or KA-MAN-2026-004417)'
                : role === 'wholesaler'
                ? 'Format: WS-SS-YYYY-NNNN (e.g. WS-MH-2026-2041 or WS-KA-2026-1183)'
                : role === 'storage_owner'
                ? 'Format: STO-SS-YYYY-NNNN (e.g. STO-MH-2026-1021 or STO-KA-2026-1001)'
                : 'Format: DRV-SS-YYYY-NNNN (e.g. DRV-MH-2026-3011 or DRV-KA-2026-1042)'}
            </p>
          </div>

          {/* State & District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                {t('onboarding.state')} *
              </label>
              <select
                required
                value={state}
                onChange={(e) => {
                  const newState = e.target.value;
                  setState(newState);
                  const newDists = getDistrictsForState(newState);
                  if (!newDists.includes(district)) {
                    setDistrict('');
                  }
                }}
                className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                {t('onboarding.district')} *
              </label>
              <select
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
              >
                <option value="">{t('onboarding.selectDistrict')}</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Driver-specific fields */}
          {role === 'logistics_driver' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.vehicleType')} *
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-blue-600 focus:outline-none"
                  >
                    <option value="truck">Truck (Heavy / Multi-axle)</option>
                    <option value="mini_truck">Mini Truck (e.g. Tata Ace / Bolero)</option>
                    <option value="pickup">Pickup Van</option>
                    <option value="tractor">Tractor Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.vehicleNumber')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="KA-11-E-4281"
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-blue-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.vehicleMaxLoad')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="500"
                    max="30000"
                    step="100"
                    value={vehicleCapacityKg}
                    onChange={(e) => setVehicleCapacityKg(e.target.value)}
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 px-3 py-3 bg-paper/50 border border-border rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={isRefrigerated}
                      onChange={(e) => setIsRefrigerated(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-semibold text-ink">{t('onboarding.refrigeratedColdChain')}</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Farmer-specific fields */}
          {role === 'farmer' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.village')}
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.landSize')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={landSizeAcres}
                      onChange={(e) => setLandSizeAcres(e.target.value)}
                      className="w-full px-3 py-3 pr-12 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-xs text-ink-muted font-medium">
                      {t('common.acres')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t('onboarding.crops')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CROP_OPTIONS.map((crop) => {
                    const selected = selectedCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selected
                            ? 'bg-field-green text-white border-field-green'
                            : 'bg-white text-ink border-border hover:border-field-green'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Wholesaler-specific fields */}
          {role === 'wholesaler' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t('onboarding.businessName')} *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Suresh Traders"
                  className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-field-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t('onboarding.gstin')}
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-field-green focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Cold-Storage Provider specific fields */}
          {role === 'storage_owner' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  {t('onboarding.facilityName')} *
                </label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g. Mandya Agri Cold Store / KRS Fresh Storage"
                  className="w-full px-3.5 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-cyan-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.licenseNumber')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="WDRA-KA-MAN-2024-0891"
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm font-mono focus:border-cyan-600 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.totalCapacity')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="10000"
                    step="5000"
                    value={storageCapacityKg}
                    onChange={(e) => setStorageCapacityKg(e.target.value)}
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-cyan-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.rentalPrice')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="100"
                    value={pricePerKgPerDay}
                    onChange={(e) => setPricePerKgPerDay(e.target.value)}
                    placeholder="15 (= ₹0.15/kg/day)"
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-cyan-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-ink-muted mt-1">{t('onboarding.paiseNote')}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    {t('onboarding.facilityAddress')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={facilityAddress}
                    onChange={(e) => setFacilityAddress(e.target.value)}
                    placeholder="e.g. KIADB Industrial Area, Tubinakere"
                    className="w-full px-3 py-3 bg-paper/50 border border-border rounded-xl text-sm focus:border-cyan-600 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-field-green text-white font-bold text-sm rounded-xl hover:bg-field-green-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('onboarding.verifying')}</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> {t('onboarding.verify')}</>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
