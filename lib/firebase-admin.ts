import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.FIREBASE_PROJECT_ID || 'agri-route-demo';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const isRealPrivateKey =
  privateKey &&
  privateKey.includes('BEGIN PRIVATE KEY') &&
  !privateKey.includes('YOUR_KEY_HERE') &&
  privateKey.length > 200;

if (!getApps().length) {
  if (projectId && clientEmail && isRealPrivateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } catch (e) {
      console.warn('Firebase cert init failed, falling back to dummy app for build:', e);
      initializeApp({
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'agri-route-demo.appspot.com',
      });
    }
  } else {
    // Graceful fallback for local development / build before real service account keys are injected
    initializeApp({
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'agri-route-demo.appspot.com',
    });
  }
}

export const db = getFirestore();
export const storage = getStorage();

// Collection references
export const collections = {
  users: db.collection('users'),
  listings: db.collection('listings'),
  pools: db.collection('pools'),
  orders: db.collection('orders'),
  coldStorages: db.collection('coldStorages'),
  storageBookings: db.collection('storageBookings'),
  schemes: db.collection('schemes'),
  notifications: db.collection('notifications'),
  priceCache: db.collection('priceCache'),
} as const;
