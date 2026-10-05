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

const ACCOUNTS_TO_PROVISION = [
  {
    email: 'farmer.nashik@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Prakash',
    lastName: 'Patil (Nashik)',
    role: 'farmer',
    metadata: {
      role: 'farmer',
      onboarded: true,
      farmerId: 'MH-NAS-2026-008129',
      district: 'Nashik',
      state: 'Maharashtra',
    },
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
      highlightBadge: 'Nashik Onion Lot',
    },
  },
  {
    email: 'farmer.ludhiana@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Gurpreet',
    lastName: 'Singh (Ludhiana)',
    role: 'farmer',
    metadata: {
      role: 'farmer',
      onboarded: true,
      farmerId: 'PB-LUD-2026-003921',
      district: 'Ludhiana',
      state: 'Punjab',
    },
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
      highlightBadge: 'Sharbati Wheat Lot',
    },
  },
  {
    email: 'farmer.guntur@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Venkateswara',
    lastName: 'Rao (Guntur)',
    role: 'farmer',
    metadata: {
      role: 'farmer',
      onboarded: true,
      farmerId: 'AP-GUN-2026-005612',
      district: 'Guntur',
      state: 'Andhra Pradesh',
    },
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
      highlightBadge: 'Teja Chilli Pool',
    },
  },
  {
    email: 'wholesaler.delhi@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Rakesh',
    lastName: 'Aggarwal (Delhi)',
    role: 'wholesaler',
    metadata: {
      role: 'wholesaler',
      onboarded: true,
      wholesalerId: 'WS-DL-2026-3021',
      businessName: 'Aggarwal Mandi Traders',
      district: 'Delhi',
      state: 'Delhi',
    },
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
      highlightBadge: 'Azadpur APMC Buyer',
    },
  },
  {
    email: 'driver.punjab@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Harnek',
    lastName: 'Singh (Freight)',
    role: 'logistics_driver',
    metadata: {
      role: 'logistics_driver',
      onboarded: true,
      driverId: 'DRV-PB-2026-0089',
      vehicleNumber: 'PB-10-CD-5678',
      district: 'Ludhiana',
      state: 'Punjab',
    },
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
      highlightBadge: '10T Cold Reefer',
    },
  },
  {
    email: 'storage.nashik@agriroute.in',
    password: 'Password@AgriRoute2026',
    firstName: 'Dilip',
    lastName: 'Deshmukh (MSWC)',
    role: 'storage_owner',
    metadata: {
      role: 'storage_owner',
      onboarded: true,
      ownerId: 'STO-MH-2026-1003',
      facilityId: 'cs-nashik-01',
      facilityName: 'Nashik Agro Cold Chain Hub',
      district: 'Nashik',
      state: 'Maharashtra',
    },
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
      facilityAddress: 'MIDC Ambad Industrial Area, Nashik - 422010',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      avatar: '🧊',
      highlightBadge: 'WDRA 1,000T Hub',
    },
  },
];

async function run() {
  console.log('⚡ Checking/Provisioning diverse Pan-India accounts in Clerk & Firestore...');

  // 1. Fetch existing Clerk users
  const usersRes = await clerkRequest('/v1/users?limit=100', 'GET');
  const existingMap = new Map();
  if (Array.isArray(usersRes.body)) {
    for (const u of usersRes.body) {
      for (const e of u.email_addresses || []) {
        existingMap.set(e.email_address, u.id);
      }
    }
  }

  for (const acc of ACCOUNTS_TO_PROVISION) {
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
        console.warn(`  ✕ Could not create ${acc.email}:`, createRes.body);
        continue;
      }
    } else {
      console.log(`  ℹ Found existing Clerk user for ${acc.email} -> ${clerkUserId}`);
    }

    // Save to Firestore under clerkUserId
    const userDoc = {
      ...acc.firestoreData,
      clerkUserId,
      language: 'en',
      createdAt: new Date().toISOString(),
      isDemoAccount: true,
    };
    await db.collection('users').doc(clerkUserId).set(userDoc, { merge: true });
    console.log(`  ✓ Synced to Firestore users/${clerkUserId}`);
  }

  // Also tag the 5 base accounts as isDemoAccount: true
  const baseAccountIds = [
    'user_3JmfQOD5urjMYyFTxKGzI7mIl6j', // Farmer Lakshmamma
    'user_3JmfUujj15M00HzIJciXKVuf3wt', // Wholesaler Suresh
    'user_3JmfV7pqfOWT9HwRbD0gKYw5ZSY', // Driver Ramesh
    'user_3JmfV2IGQUlik22UhBGGQ2wJxA2', // Storage Chandrashekar
    'user_3Jmfx13ctDYiEwcXhXU2IvfUZRK', // Admin
  ];
  for (const id of baseAccountIds) {
    await db.collection('users').doc(id).set({ isDemoAccount: true }, { merge: true });
  }

  console.log('🎉 Successfully provisioned all diverse accounts!');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
