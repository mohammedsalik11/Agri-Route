import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
      });
    } catch (e) {
      console.warn('Firebase cert init failed, falling back to dummy app for build:', e);
      initializeApp({ projectId });
    }
  } else {
    // Graceful fallback for local development / build before real service account keys are injected
    initializeApp({ projectId });
  }
}

export const db = getFirestore();

// Collection references
export const collections = {
  users: db.collection('users'),
  listings: db.collection('listings'),
  pools: db.collection('pools'),
  orders: db.collection('orders'),
  negotiations: db.collection('negotiations'),
  coldStorages: db.collection('coldStorages'),
  storageBookings: db.collection('storageBookings'),
  schemes: db.collection('schemes'),
  notifications: db.collection('notifications'),
  priceCache: db.collection('priceCache'),
} as const;

