const fs = require('fs');
const path = require('path');
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

const projectId = env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

async function syncUsers() {
  const users = [
    {
      clerkUserId: 'user_3JmfQOD5urjMYyFTxKGzI7mIl6j',
      role: 'farmer',
      name: 'Lakshmamma',
      farmerId: 'KA-MAN-2026-004417',
      email: 'farmer.demo@agriroute.in',
      phone: '+919876543210',
      language: 'en',
      district: 'Mandya',
      state: 'Karnataka',
      village: 'Tubinakere',
      landSizeAcres: 3.5,
      primaryCrops: ['tomato', 'ragi', 'paddy'],
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      createdAt: new Date().toISOString(),
    },
    {
      clerkUserId: 'user_3JmfUujj15M00HzIJciXKVuf3wt',
      role: 'wholesaler',
      name: 'Suresh Traders',
      wholesalerId: 'WS-KA-2026-1183',
      businessName: 'Suresh Traders Bengaluru',
      email: 'wholesaler.demo@agriroute.in',
      phone: '+919880011223',
      language: 'en',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      gstin: '29AAAAA0000A1Z5',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      createdAt: new Date().toISOString(),
    },
    {
      clerkUserId: 'user_3JmfV7pqfOWT9HwRbD0gKYw5ZSY',
      role: 'logistics_driver',
      name: 'Ramesh Transport',
      driverId: 'DRV-KA-2026-0042',
      email: 'driver.demo@agriroute.in',
      phone: '+919845012345',
      language: 'en',
      vehicleType: 'truck',
      vehicleNumber: 'KA-11-TR-4590',
      vehicleCapacityKg: 10000,
      isRefrigerated: false,
      district: 'Mandya',
      state: 'Karnataka',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      createdAt: new Date().toISOString(),
    },
    {
      clerkUserId: 'user_3JmfV2IGQUlik22UhBGGQ2wJxA2',
      role: 'storage_owner',
      name: 'H. M. Chandrashekar',
      ownerId: 'STO-KA-2026-1001',
      businessName: 'Karnataka Cold Chain Pvt Ltd',
      facilityName: 'Mandya Agri Cold Store',
      facilityId: 'cs-mandya-01',
      email: 'storage.demo@agriroute.in',
      phone: '+919876543210',
      language: 'en',
      district: 'Mandya',
      state: 'Karnataka',
      licenseNumber: 'WDRA-KA-MAN-2024-0891',
      storageCapacityKg: 500000,
      availableCapacityKg: 180000,
      pricePerKgPerDay: 15,
      facilityAddress: 'Plot 14-16, KIADB Industrial Area, Tubinakere, Mandya - 571402',
      verificationStatus: 'verified',
      verificationSource: 'seeded-registry',
      createdAt: new Date().toISOString(),
    },
    {
      clerkUserId: 'user_3Jmfx13ctDYiEwcXhXU2IvfUZRK',
      role: 'admin',
      name: 'AgriRoute Administrator',
      email: 'admin.demo@agriroute.in',
      phone: '+919876543210',
      language: 'en',
      district: 'Central HQ',
      state: 'National',
      verificationStatus: 'verified',
      verificationSource: 'system-admin',
      createdAt: new Date().toISOString(),
    },
  ];

  console.log('🔄 Syncing demo user profiles to Firestore...');
  for (const u of users) {
    // Save under clerkUserId doc
    await db.collection('users').doc(u.clerkUserId).set(u, { merge: true });
    // Also save under role-based doc id if referenced elsewhere
    if (u.role === 'farmer') {
      await db.collection('users').doc('demo_farmer_0').set(u, { merge: true });
      await db.collection('users').doc('demo_farmer_lakshmamma').set(u, { merge: true });
    } else if (u.role === 'wholesaler') {
      await db.collection('users').doc('demo_wholesaler_suresh').set(u, { merge: true });
      await db.collection('users').doc('wholesaler_suresh_traders_ka').set(u, { merge: true });
    } else if (u.role === 'logistics_driver') {
      await db.collection('users').doc('demo_driver_01').set(u, { merge: true });
    } else if (u.role === 'storage_owner') {
      await db.collection('users').doc('demo_storage_owner_01').set(u, { merge: true });
    }
    console.log(`  ✅ Synced: ${u.role} -> ${u.email} (${u.clerkUserId})`);
  }

  console.log('🎉 All demo users synced to Firestore successfully!');
}

syncUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error syncing users:', err);
    process.exit(1);
  });
