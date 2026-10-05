export interface DemoAccount {
  id: 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner' | 'admin';
  role: 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner' | 'admin';
  roleLabel: string;
  name: string;
  email: string;
  password?: string;
  authMethod: string;
  clerkUserId: string;
  idNumber: string;
  location: string;
  accessSummary: string;
  dashboardUrl: string;
  badges: string[];
  sharedTesting: boolean;
  notes?: string;
}

export interface DemoAccountWithStatus extends DemoAccount {
  status: 'Available' | 'Available for shared testing' | 'In use';
  activeSessionsCount: number;
  lastActiveAt?: string | null;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'farmer',
    role: 'farmer',
    roleLabel: 'Farmer (Producer)',
    name: 'Lakshmamma',
    email: 'farmer.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    authMethod: 'Pre-verified Email & Password',
    clerkUserId: 'user_3JmfQOD5urjMYyFTxKGzI7mIl6j',
    idNumber: 'KA-MAN-2026-004417',
    location: 'Mandya, Karnataka',
    accessSummary: 'List produce lots, view AI Fair Price & MSP floor, join aggregation pools, check Hold-vs-Sell cold storage advisor, and track escrow earnings.',
    dashboardUrl: '/farmer',
    badges: ['AI Fair Price', 'Produce Pooling', 'Storage Advisor', 'Escrow Payouts'],
    sharedTesting: true,
    notes: 'Pre-verified against Agristack registry with active listings in Mandya tomato pool.',
  },
  {
    id: 'wholesaler',
    role: 'wholesaler',
    roleLabel: 'Wholesaler / Buyer',
    name: 'Suresh Traders',
    email: 'wholesaler.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    authMethod: 'Pre-verified Email & Password',
    clerkUserId: 'user_3JmfUujj15M00HzIJciXKVuf3wt',
    idNumber: 'WS-KA-2026-1183',
    location: 'Bengaluru Urban, Karnataka',
    accessSummary: 'Browse Pan-India pooled lots across 6 states, submit price negotiations with farmers, buy full aggregated truckloads, and complete test escrow checkout.',
    dashboardUrl: '/wholesaler',
    badges: ['Bulk Aggregation', 'Price Negotiation', 'Escrow Checkout', 'Order History'],
    sharedTesting: true,
    notes: 'Verified APMC trade licence with multi-state pool purchasing privileges.',
  },
  {
    id: 'logistics_driver',
    role: 'logistics_driver',
    roleLabel: 'Logistics Driver / Transporter',
    name: 'Ramesh Transport',
    email: 'driver.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    authMethod: 'Pre-verified Email & Password',
    clerkUserId: 'user_3JmfV7pqfOWT9HwRbD0gKYw5ZSY',
    idNumber: 'DRV-KA-2026-0042',
    location: 'Mandya, Karnataka (Vehicle: KA-11-TR-4590, 10 Ton)',
    accessSummary: 'Accept pooled lot transport dispatches, track trip milestones with standard market per-km rates, generate handover OTPs, and confirm deliveries.',
    dashboardUrl: '/driver',
    badges: ['Market Per-KM Rates', 'Trip Handover OTP', 'Capacity Match', 'Live Tracking'],
    sharedTesting: true,
    notes: 'Permit-verified 10-ton commercial vehicle for inter-district Mandya-to-Bengaluru route.',
  },
  {
    id: 'storage_owner',
    role: 'storage_owner',
    roleLabel: 'Cold-Storage Facility Provider',
    name: 'H. M. Chandrashekar',
    email: 'storage.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    authMethod: 'Pre-verified Email & Password',
    clerkUserId: 'user_3JmfV2IGQUlik22UhBGGQ2wJxA2',
    idNumber: 'STO-KA-2026-1001',
    location: 'Mandya Agri Cold Store (WDRA-KA-MAN-2024-0891)',
    accessSummary: 'Manage cold storage capacity, configure daily rental tariffs (₹15/day), monitor incoming produce bookings, and review WDRA accredited electronic receipts.',
    dashboardUrl: '/storage-owner',
    badges: ['WDRA Accredited', 'AIF Subsidized', 'Bay Capacity Manager', 'Booking Dispatch'],
    sharedTesting: true,
    notes: 'Accredited warehouse operator linked with Mandya Agri Cold Store (500T capacity).',
  },
  {
    id: 'admin',
    role: 'admin',
    roleLabel: 'Platform Admin & System Panel',
    name: 'AgriRoute Administrator',
    email: 'admin.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    authMethod: 'Email & Password / Admin Passcode',
    clerkUserId: 'user_3Jmfx13ctDYiEwcXhXU2IvfUZRK',
    idNumber: 'ADM-CENTRAL-01',
    location: 'Central Operations Center',
    accessSummary: 'Full platform oversight, data honesty matrix inspection, live simulated SMS/WhatsApp outbox, and one-click Pan-India database wipe and re-seed.',
    dashboardUrl: '/demo',
    badges: ['Control Panel', 'SMS Outbox', 'Honesty Matrix', '1-Click Wipe & Reseed'],
    sharedTesting: true,
    notes: 'Can also be accessed via /demo directly using the master admin passcode (agri-route-admin-2026).',
  },
];
