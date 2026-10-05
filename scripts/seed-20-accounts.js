const fs = require('fs');
const path = require('path');
const https = require('https');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const k = line.substring(0, idx).trim();
      let v = line.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[k] = v;
    }
  }
}

const clerkKey = env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY;
const projectId = env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}
const db = getFirestore();

function clerkRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = https.request(
      {
        hostname: 'api.clerk.com',
        path,
        method,
        headers: {
          Authorization: 'Bearer ' + clerkKey,
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(payload);
    req.end();
  });
}

const ALL_20_PROFILES = [
  // --- 5 FARMERS ---
  {
    email: 'farmer.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Lakshmamma',
    lastName: '(Mandya)',
    role: 'farmer',
    metadata: { role: 'farmer', onboarded: true, farmerId: 'KA-MAN-2026-004417', district: 'Mandya' },
    firestoreData: {
      role: 'farmer',
      name: 'Lakshmamma',
      farmerId: 'KA-MAN-2026-004417',
      email: 'farmer.demo@agriroute.in',
      phone: '+919876543210',
      district: 'Mandya',
      state: 'Karnataka',
      village: 'Tubinakere',
      landSizeAcres: 3.5,
      primaryCrops: ['tomato', 'ragi', 'paddy'],
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🌾',
      highlightBadge: 'Tomato Pool (Mandya)',
      tagline: 'Bangalore Blue Tomato',
    },
  },
  {
    email: 'farmer.nashik@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Prakash',
    lastName: 'Patil (Nashik)',
    role: 'farmer',
    metadata: { role: 'farmer', onboarded: true, farmerId: 'MH-NAS-2026-008129', district: 'Nashik' },
    firestoreData: {
      role: 'farmer',
      name: 'Prakash Patil',
      farmerId: 'MH-NAS-2026-008129',
      email: 'farmer.nashik@agriroute.in',
      phone: '+919822114477',
      district: 'Nashik',
      state: 'Maharashtra',
      village: 'Lasalgaon',
      landSizeAcres: 4.5,
      primaryCrops: ['onion', 'grapes'],
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🌾',
      highlightBadge: 'Nashik Onion Pool',
      tagline: 'Lasalgaon Red Onion',
    },
  },
  {
    email: 'farmer.ludhiana@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Gurpreet',
    lastName: 'Singh (Punjab)',
    role: 'farmer',
    metadata: { role: 'farmer', onboarded: true, farmerId: 'PB-LUD-2026-003921', district: 'Ludhiana' },
    firestoreData: {
      role: 'farmer',
      name: 'Gurpreet Singh',
      farmerId: 'PB-LUD-2026-003921',
      email: 'farmer.ludhiana@agriroute.in',
      phone: '+919814123456',
      district: 'Ludhiana',
      state: 'Punjab',
      village: 'Samrala',
      landSizeAcres: 8.0,
      primaryCrops: ['wheat', 'paddy'],
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🌾',
      highlightBadge: 'Sharbati Wheat Pool',
      tagline: 'High-Protein Sharbati',
    },
  },
  {
    email: 'farmer.guntur@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Venkateswara',
    lastName: 'Rao (Guntur)',
    role: 'farmer',
    metadata: { role: 'farmer', onboarded: true, farmerId: 'AP-GUN-2026-005612', district: 'Guntur' },
    firestoreData: {
      role: 'farmer',
      name: 'Venkateswara Rao',
      farmerId: 'AP-GUN-2026-005612',
      email: 'farmer.guntur@agriroute.in',
      phone: '+919848011223',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      village: 'Tenali',
      landSizeAcres: 5.2,
      primaryCrops: ['green_chilli', 'cotton'],
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🌾',
      highlightBadge: 'Guntur Teja Chilli',
      tagline: 'Guntur Teja S17 Spice',
    },
  },
  {
    email: 'farmer.agra@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Shivram',
    lastName: 'Yadav (Agra)',
    role: 'farmer',
    metadata: { role: 'farmer', onboarded: true, farmerId: 'UP-AGR-2026-007733', district: 'Agra' },
    firestoreData: {
      role: 'farmer',
      name: 'Shivram Yadav',
      farmerId: 'UP-AGR-2026-007733',
      email: 'farmer.agra@agriroute.in',
      phone: '+919837012345',
      district: 'Agra',
      state: 'Uttar Pradesh',
      village: 'Khandari',
      landSizeAcres: 6.0,
      primaryCrops: ['potato', 'mustard'],
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🌾',
      highlightBadge: 'Agra Potato Pool',
      tagline: 'Kufri Jyoti Table Potato',
    },
  },

  // --- 5 WHOLESALERS ---
  {
    email: 'wholesaler.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Suresh',
    lastName: 'Traders (Bengaluru)',
    role: 'wholesaler',
    metadata: { role: 'wholesaler', onboarded: true, wholesalerId: 'WS-KA-2026-1183', district: 'Bengaluru Urban' },
    firestoreData: {
      role: 'wholesaler',
      name: 'Suresh Traders',
      wholesalerId: 'WS-KA-2026-1183',
      businessName: 'Suresh Traders Bengaluru',
      email: 'wholesaler.demo@agriroute.in',
      phone: '+919880011223',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      gstin: '29AAAAA0000A1Z5',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🏪',
      highlightBadge: 'APMC Yard Gate 4',
      tagline: 'Bengaluru APMC Buyer',
    },
  },
  {
    email: 'wholesaler.delhi@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Aggarwal',
    lastName: 'Mandi (Delhi)',
    role: 'wholesaler',
    metadata: { role: 'wholesaler', onboarded: true, wholesalerId: 'WS-DL-2026-3021', district: 'Delhi' },
    firestoreData: {
      role: 'wholesaler',
      name: 'Aggarwal Mandi Traders',
      wholesalerId: 'WS-DL-2026-3021',
      businessName: 'Aggarwal Mandi Traders Delhi',
      email: 'wholesaler.delhi@agriroute.in',
      phone: '+919811099887',
      district: 'Delhi',
      state: 'Delhi',
      gstin: '07AAAAA1111B1Z2',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🏪',
      highlightBadge: 'Azadpur Mandi Shed B-4',
      tagline: 'North India APMC Bulk',
    },
  },
  {
    email: 'wholesaler.mumbai@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Vashi',
    lastName: 'Agro (Navi Mumbai)',
    role: 'wholesaler',
    metadata: { role: 'wholesaler', onboarded: true, wholesalerId: 'WS-MH-2026-4412', district: 'Mumbai Suburban' },
    firestoreData: {
      role: 'wholesaler',
      name: 'Vashi Agro APMC Traders',
      wholesalerId: 'WS-MH-2026-4412',
      businessName: 'Vashi Wholesale APMC Market Bay 12',
      email: 'wholesaler.mumbai@agriroute.in',
      phone: '+919820088776',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      gstin: '27AAAAA5555C1Z9',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🏪',
      highlightBadge: 'Vashi APMC Bay 12',
      tagline: 'Western Bulk Hub',
    },
  },
  {
    email: 'wholesaler.punjab@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Khanna',
    lastName: 'Grain (Khanna)',
    role: 'wholesaler',
    metadata: { role: 'wholesaler', onboarded: true, wholesalerId: 'WS-PB-2026-5599', district: 'Ludhiana' },
    firestoreData: {
      role: 'wholesaler',
      name: 'Khanna Grain Merchants',
      wholesalerId: 'WS-PB-2026-5599',
      businessName: 'Asia Largest Grain Terminal Corp',
      email: 'wholesaler.punjab@agriroute.in',
      phone: '+919815044332',
      district: 'Ludhiana',
      state: 'Punjab',
      gstin: '03AAAAA8888D1Z4',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🏪',
      highlightBadge: 'Asia Largest Grain Market',
      tagline: 'Wheat & Grain Terminal',
    },
  },
  {
    email: 'wholesaler.hyderabad@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Deccan',
    lastName: 'Produce (Hyderabad)',
    role: 'wholesaler',
    metadata: { role: 'wholesaler', onboarded: true, wholesalerId: 'WS-TS-2026-6622', district: 'Hyderabad' },
    firestoreData: {
      role: 'wholesaler',
      name: 'Deccan Produce Wholesalers',
      wholesalerId: 'WS-TS-2026-6622',
      businessName: 'Kothapet Wholesale Spice Market',
      email: 'wholesaler.hyderabad@agriroute.in',
      phone: '+919849033221',
      district: 'Hyderabad',
      state: 'Telangana',
      gstin: '36AAAAA9999E1Z1',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🏪',
      highlightBadge: 'Kothapet Wholesale Bay',
      tagline: 'South Central Spices',
    },
  },

  // --- 5 LOGISTICS DRIVERS ---
  {
    email: 'driver.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Ramesh',
    lastName: 'Transport (Mandya)',
    role: 'logistics_driver',
    metadata: { role: 'logistics_driver', onboarded: true, driverId: 'DRV-KA-2026-0042', district: 'Mandya' },
    firestoreData: {
      role: 'logistics_driver',
      name: 'Ramesh Transport',
      driverId: 'DRV-KA-2026-0042',
      email: 'driver.demo@agriroute.in',
      phone: '+919845012345',
      vehicleType: 'truck',
      vehicleNumber: 'KA-11-TR-4590',
      vehicleCapacityKg: 10000,
      isRefrigerated: false,
      district: 'Mandya',
      state: 'Karnataka',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🚛',
      highlightBadge: 'KA-11-TR-4590 · 10T',
      tagline: '10 Ton Heavy Truck',
    },
  },
  {
    email: 'driver.punjab@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Harnek',
    lastName: 'Singh (Freight)',
    role: 'logistics_driver',
    metadata: { role: 'logistics_driver', onboarded: true, driverId: 'DRV-PB-2026-0089', district: 'Ludhiana' },
    firestoreData: {
      role: 'logistics_driver',
      name: 'Harnek Singh Freight',
      driverId: 'DRV-PB-2026-0089',
      email: 'driver.punjab@agriroute.in',
      phone: '+919814098765',
      vehicleType: 'truck',
      vehicleNumber: 'PB-10-CD-5678',
      vehicleCapacityKg: 10000,
      isRefrigerated: true,
      district: 'Ludhiana',
      state: 'Punjab',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🚛',
      highlightBadge: 'PB-10-CD-5678 · Reefer',
      tagline: '10T Cold Refrigerated',
    },
  },
  {
    email: 'driver.maharashtra@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Balaji',
    lastName: 'Roadlines (Nashik)',
    role: 'logistics_driver',
    metadata: { role: 'logistics_driver', onboarded: true, driverId: 'DRV-MH-2026-3011', district: 'Nashik' },
    firestoreData: {
      role: 'logistics_driver',
      name: 'Balaji Roadlines',
      driverId: 'DRV-MH-2026-3011',
      email: 'driver.maharashtra@agriroute.in',
      phone: '+919822998877',
      vehicleType: 'truck',
      vehicleNumber: 'MH-15-AB-3344',
      vehicleCapacityKg: 10000,
      isRefrigerated: false,
      district: 'Nashik',
      state: 'Maharashtra',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🚛',
      highlightBadge: 'MH-15-AB-3344 · 10T',
      tagline: 'Interstate ICV Freight',
    },
  },
  {
    email: 'driver.up@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Ganga',
    lastName: 'Express (Agra)',
    role: 'logistics_driver',
    metadata: { role: 'logistics_driver', onboarded: true, driverId: 'DRV-UP-2026-7788', district: 'Agra' },
    firestoreData: {
      role: 'logistics_driver',
      name: 'Ganga Express Logistics',
      driverId: 'DRV-UP-2026-7788',
      email: 'driver.up@agriroute.in',
      phone: '+919838112233',
      vehicleType: 'truck',
      vehicleNumber: 'UP-80-XY-9988',
      vehicleCapacityKg: 10000,
      isRefrigerated: false,
      district: 'Agra',
      state: 'Uttar Pradesh',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🚛',
      highlightBadge: 'UP-80-XY-9988 · 10T',
      tagline: 'Agra-Delhi Express',
    },
  },
  {
    email: 'driver.ap@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Coastal',
    lastName: 'Cargo (Guntur)',
    role: 'logistics_driver',
    metadata: { role: 'logistics_driver', onboarded: true, driverId: 'DRV-AP-2026-4411', district: 'Guntur' },
    firestoreData: {
      role: 'logistics_driver',
      name: 'Coastal Cargo Carriers',
      driverId: 'DRV-AP-2026-4411',
      email: 'driver.ap@agriroute.in',
      phone: '+919848556677',
      vehicleType: 'mini_truck',
      vehicleNumber: 'AP-07-JK-4411',
      vehicleCapacityKg: 3000,
      isRefrigerated: false,
      district: 'Guntur',
      state: 'Andhra Pradesh',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🚛',
      highlightBadge: 'AP-07-JK-4411 · 3T',
      tagline: 'Mini Truck Aggregator',
    },
  },

  // --- 5 COLD STORAGE PROVIDERS ---
  {
    email: 'storage.demo@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'H. M.',
    lastName: 'Chandrashekar (Mandya)',
    role: 'storage_owner',
    metadata: { role: 'storage_owner', onboarded: true, ownerId: 'STO-KA-2026-1001', district: 'Mandya' },
    firestoreData: {
      role: 'storage_owner',
      name: 'H. M. Chandrashekar',
      ownerId: 'STO-KA-2026-1001',
      businessName: 'Karnataka Cold Chain Pvt Ltd',
      facilityName: 'Mandya Agri Cold Store',
      facilityId: 'cs-mandya-01',
      email: 'storage.demo@agriroute.in',
      phone: '+919876543210',
      district: 'Mandya',
      state: 'Karnataka',
      licenseNumber: 'WDRA-KA-MAN-2024-0891',
      storageCapacityKg: 500000,
      availableCapacityKg: 180000,
      pricePerKgPerDay: 15,
      facilityAddress: 'KIADB Industrial Area, Tubinakere, Mandya',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🧊',
      highlightBadge: 'WDRA 500T · ₹15/day',
      tagline: 'Mandya Agri Cold Store',
    },
  },
  {
    email: 'storage.nashik@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Dilip',
    lastName: 'Deshmukh (MSWC)',
    role: 'storage_owner',
    metadata: { role: 'storage_owner', onboarded: true, ownerId: 'STO-MH-2026-1003', district: 'Nashik' },
    firestoreData: {
      role: 'storage_owner',
      name: 'Dilip R. Deshmukh',
      ownerId: 'STO-MH-2026-1003',
      businessName: 'Maharashtra State Warehousing Corp',
      facilityName: 'Nashik Agro Cold Chain Hub',
      facilityId: 'cs-nashik-01',
      email: 'storage.nashik@agriroute.in',
      phone: '+919822334455',
      district: 'Nashik',
      state: 'Maharashtra',
      licenseNumber: 'WDRA-MH-NAS-2023-0412',
      storageCapacityKg: 1000000,
      availableCapacityKg: 420000,
      pricePerKgPerDay: 14,
      facilityAddress: 'MIDC Ambad Industrial Area, Nashik',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🧊',
      highlightBadge: 'WDRA 1,000T · ₹14/day',
      tagline: 'MSWC Agro Cold Hub',
    },
  },
  {
    email: 'storage.agra@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Khandari',
    lastName: 'Cold Storage (Agra)',
    role: 'storage_owner',
    metadata: { role: 'storage_owner', onboarded: true, ownerId: 'STO-UP-2026-3088', district: 'Agra' },
    firestoreData: {
      role: 'storage_owner',
      name: 'Khandari Cold Storage Cluster',
      ownerId: 'STO-UP-2026-3088',
      businessName: 'UP Warehousing Logistics Ltd',
      facilityName: 'Khandari Potato Cold Store',
      facilityId: 'cs-agra-01',
      email: 'storage.agra@agriroute.in',
      phone: '+919837998811',
      district: 'Agra',
      state: 'Uttar Pradesh',
      licenseNumber: 'WDRA-UP-AGR-2024-0199',
      storageCapacityKg: 800000,
      availableCapacityKg: 350000,
      pricePerKgPerDay: 12,
      facilityAddress: 'National Highway 19, Khandari, Agra',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🧊',
      highlightBadge: 'WDRA 800T · ₹12/day',
      tagline: 'Potato Climate Bays',
    },
  },
  {
    email: 'storage.ludhiana@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Punjab',
    lastName: 'Cold Chain (Ludhiana)',
    role: 'storage_owner',
    metadata: { role: 'storage_owner', onboarded: true, ownerId: 'STO-PB-2026-5511', district: 'Ludhiana' },
    firestoreData: {
      role: 'storage_owner',
      name: 'Punjab Agro Cold Chain Depot',
      ownerId: 'STO-PB-2026-5511',
      businessName: 'Punjab State Grains & Storage Corp',
      facilityName: 'Samrala Grain Depot & Silos',
      facilityId: 'cs-ludhiana-01',
      email: 'storage.ludhiana@agriroute.in',
      phone: '+919814443322',
      district: 'Ludhiana',
      state: 'Punjab',
      licenseNumber: 'WDRA-PB-LUD-2023-0941',
      storageCapacityKg: 600000,
      availableCapacityKg: 280000,
      pricePerKgPerDay: 13,
      facilityAddress: 'Samrala Road Grain Depot, Ludhiana',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🧊',
      highlightBadge: 'WDRA 600T · ₹13/day',
      tagline: 'Seed & Grain Silos',
    },
  },
  {
    email: 'storage.guntur@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Guntur',
    lastName: 'Spices Cold (Guntur)',
    role: 'storage_owner',
    metadata: { role: 'storage_owner', onboarded: true, ownerId: 'STO-AP-2026-7744', district: 'Guntur' },
    firestoreData: {
      role: 'storage_owner',
      name: 'Guntur Spices Cold Terminal',
      ownerId: 'STO-AP-2026-7744',
      businessName: 'AP Cold Chain Infrastructure Ltd',
      facilityName: 'Mirchi Yard Cold Bay 3',
      facilityId: 'cs-guntur-01',
      email: 'storage.guntur@agriroute.in',
      phone: '+919848778899',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      licenseNumber: 'WDRA-AP-GUN-2024-0612',
      storageCapacityKg: 500000,
      availableCapacityKg: 210000,
      pricePerKgPerDay: 16,
      facilityAddress: 'Guntur Mirchi Yard Gate 3, Guntur',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🧊',
      highlightBadge: 'WDRA 500T · ₹16/day',
      tagline: 'Dry Chilli Cold Bay',
    },
  },
];

async function seedAll() {
  console.log('🚀 Checking and creating all 20 demo accounts in Clerk & Firestore...');

  const usersRes = await clerkRequest('/v1/users?limit=100', 'GET');
  const existingMap = new Map();
  if (Array.isArray(usersRes.body)) {
    for (const u of usersRes.body) {
      for (const e of u.email_addresses || []) {
        existingMap.set(e.email_address, u.id);
      }
    }
  }

  for (const acc of ALL_20_PROFILES) {
    let clerkUserId = existingMap.get(acc.email);
    if (!clerkUserId) {
      console.log(`Creating Clerk user for ${acc.email}...`);
      const createRes = await clerkRequest('/v1/users', 'POST', {
        email_address: [acc.email],
        password: acc.password,
        first_name: acc.firstName,
        last_name: acc.lastName,
        public_metadata: acc.metadata,
        skip_password_checks: true,
        skip_password_requirement: true,
      });

      if (createRes.status === 200 && createRes.body?.id) {
        clerkUserId = createRes.body.id;
        console.log(`  ✓ Created ${acc.email} -> ${clerkUserId}`);
      } else {
        console.warn(`  ✕ Failed ${acc.email}:`, createRes.body);
        continue;
      }
    }

    const docData = {
      ...acc.firestoreData,
      clerkUserId,
      language: 'en',
      createdAt: new Date().toISOString(),
      isDemoAccount: true,
    };
    await db.collection('users').doc(clerkUserId).set(docData, { merge: true });
    console.log(`  ✓ Saved ${acc.role} profile: ${acc.firestoreData.name} (${clerkUserId})`);
  }

  console.log('🎉 Done! All 20 demo profiles are active in Clerk & Firestore.');
}

seedAll()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  });
