import { NextResponse } from 'next/server';
import { collections } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface DemoDbAccount {
  clerkUserId: string;
  role: 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner' | 'admin';
  name: string;
  email: string;
  district: string;
  state: string;
  avatar: string;
  highlightBadge: string;
  destination: string;
  details: string;
}

const FALLBACK_ACCOUNTS: DemoDbAccount[] = [
  // 5 Farmers
  {
    clerkUserId: 'user_3JmfQOD5urjMYyFTxKGzI7mIl6j',
    role: 'farmer',
    name: 'Lakshmamma',
    email: 'farmer.demo@agriroute.in',
    district: 'Mandya',
    state: 'Karnataka',
    avatar: '🌾',
    highlightBadge: 'Tomato Pool (Mandya)',
    destination: '/farmer',
    details: 'Tubinakere, Mandya, KA',
  },
  {
    clerkUserId: 'user_3JmhmxLN8EyglsDOe2uAUR5mwgl',
    role: 'farmer',
    name: 'Prakash Patil',
    email: 'farmer.nashik@agriroute.in',
    district: 'Nashik',
    state: 'Maharashtra',
    avatar: '🌾',
    highlightBadge: 'Nashik Onion Pool',
    destination: '/farmer',
    details: 'Lasalgaon, Nashik, MH',
  },
  {
    clerkUserId: 'user_3Jmhn9LFCh8NPkrc6KHVfhbuLio',
    role: 'farmer',
    name: 'Gurpreet Singh',
    email: 'farmer.ludhiana@agriroute.in',
    district: 'Ludhiana',
    state: 'Punjab',
    avatar: '🌾',
    highlightBadge: 'Sharbati Wheat Pool',
    destination: '/farmer',
    details: 'Samrala, Ludhiana, PB',
  },
  {
    clerkUserId: 'user_3JmhnBjIvOqHn4Fq5QK3sqhsYRh',
    role: 'farmer',
    name: 'Venkateswara Rao',
    email: 'farmer.guntur@agriroute.in',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    avatar: '🌾',
    highlightBadge: 'Guntur Teja Chilli',
    destination: '/farmer',
    details: 'Tenali, Guntur, AP',
  },
  {
    clerkUserId: 'user_3KHSt7UbqYSJgNNOHLC0CzG7KFG',
    role: 'farmer',
    name: 'Shivram Yadav',
    email: 'farmer.agra@agriroute.in',
    district: 'Agra',
    state: 'Uttar Pradesh',
    avatar: '🌾',
    highlightBadge: 'Agra Potato Pool',
    destination: '/farmer',
    details: 'Khandari, Agra, UP',
  },

  // 5 Wholesalers
  {
    clerkUserId: 'user_3JmfUujj15M00HzIJciXKVuf3wt',
    role: 'wholesaler',
    name: 'Suresh Traders',
    email: 'wholesaler.demo@agriroute.in',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    avatar: '🏪',
    highlightBadge: 'APMC Yard Gate 4',
    destination: '/wholesaler',
    details: 'Suresh Traders · Bengaluru, KA',
  },
  {
    clerkUserId: 'user_3JmhnNuO35BLqEFfnK2LTDirZsn',
    role: 'wholesaler',
    name: 'Aggarwal Mandi Traders',
    email: 'wholesaler.delhi@agriroute.in',
    district: 'Delhi',
    state: 'Delhi',
    avatar: '🏪',
    highlightBadge: 'Azadpur Shed B-4',
    destination: '/wholesaler',
    details: 'Aggarwal Mandi · Delhi',
  },
  {
    clerkUserId: 'user_3KHStBn1wJMVw4aBFcdqbQ47dZA',
    role: 'wholesaler',
    name: 'Vashi Agro APMC Traders',
    email: 'wholesaler.mumbai@agriroute.in',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    avatar: '🏪',
    highlightBadge: 'Vashi APMC Bay 12',
    destination: '/wholesaler',
    details: 'Vashi APMC · Navi Mumbai, MH',
  },
  {
    clerkUserId: 'user_3KHStFyRBAo1LsZndn6qX2zWuLb',
    role: 'wholesaler',
    name: 'Khanna Grain Merchants',
    email: 'wholesaler.punjab@agriroute.in',
    district: 'Ludhiana',
    state: 'Punjab',
    avatar: '🏪',
    highlightBadge: 'Asia Largest Grain Mkt',
    destination: '/wholesaler',
    details: 'Grain Terminal · Khanna, PB',
  },
  {
    clerkUserId: 'user_3KHStK4AubXRDO8IMC13kArd40G',
    role: 'wholesaler',
    name: 'Deccan Produce Wholesalers',
    email: 'wholesaler.hyderabad@agriroute.in',
    district: 'Hyderabad',
    state: 'Telangana',
    avatar: '🏪',
    highlightBadge: 'Kothapet Spice Bay',
    destination: '/wholesaler',
    details: 'Kothapet Mandi · Hyderabad, TS',
  },

  // 5 Logistics Drivers
  {
    clerkUserId: 'user_3JmfV7pqfOWT9HwRbD0gKYw5ZSY',
    role: 'logistics_driver',
    name: 'Ramesh Transport',
    email: 'driver.demo@agriroute.in',
    district: 'Mandya',
    state: 'Karnataka',
    avatar: '🚛',
    highlightBadge: 'KA-11-TR-4590 · 10T',
    destination: '/driver',
    details: '10T Cargo · Mandya, KA',
  },
  {
    clerkUserId: 'user_3JmhnY8jtFRU0bMR3FEVbSf9b5g',
    role: 'logistics_driver',
    name: 'Harnek Singh Freight',
    email: 'driver.punjab@agriroute.in',
    district: 'Ludhiana',
    state: 'Punjab',
    avatar: '🚛',
    highlightBadge: 'PB-10-CD-5678 · Reefer',
    destination: '/driver',
    details: '10T Reefer · Ludhiana, PB',
  },
  {
    clerkUserId: 'user_3KHStiQmm5E7Jsy3WjgqRhshpGp',
    role: 'logistics_driver',
    name: 'Balaji Roadlines',
    email: 'driver.maharashtra@agriroute.in',
    district: 'Nashik',
    state: 'Maharashtra',
    avatar: '🚛',
    highlightBadge: 'MH-15-AB-3344 · 10T',
    destination: '/driver',
    details: '10T ICV · Nashik, MH',
  },
  {
    clerkUserId: 'user_3KHStrHsRQev2fqpL3ArYDapFeW',
    role: 'logistics_driver',
    name: 'Ganga Express Logistics',
    email: 'driver.up@agriroute.in',
    district: 'Agra',
    state: 'Uttar Pradesh',
    avatar: '🚛',
    highlightBadge: 'UP-80-XY-9988 · 10T',
    destination: '/driver',
    details: '10T Express · Agra, UP',
  },
  {
    clerkUserId: 'user_3KHSu0oNUrbEFRt68ibzfIe1e0y',
    role: 'logistics_driver',
    name: 'Coastal Cargo Carriers',
    email: 'driver.ap@agriroute.in',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    avatar: '🚛',
    highlightBadge: 'AP-07-JK-4411 · 3T',
    destination: '/driver',
    details: '3T Mini Truck · Guntur, AP',
  },

  // 5 Cold Storage Providers
  {
    clerkUserId: 'user_3JmfV2IGQUlik22UhBGGQ2wJxA2',
    role: 'storage_owner',
    name: 'H. M. Chandrashekar',
    email: 'storage.demo@agriroute.in',
    district: 'Mandya',
    state: 'Karnataka',
    avatar: '🧊',
    highlightBadge: 'WDRA 500T · Mandya Store',
    destination: '/storage-owner',
    details: 'Mandya Agri Cold Store (500T)',
  },
  {
    clerkUserId: 'user_3JmhnmEGVvZMZWekueztRKNJUBj',
    role: 'storage_owner',
    name: 'Dilip R. Deshmukh',
    email: 'storage.nashik@agriroute.in',
    district: 'Nashik',
    state: 'Maharashtra',
    avatar: '🧊',
    highlightBadge: 'WDRA 1,000T · MSWC Hub',
    destination: '/storage-owner',
    details: 'MSWC Hub · Nashik, MH',
  },
  {
    clerkUserId: 'user_3KHStvnXlEllSV6OGLOhNnLeRUv',
    role: 'storage_owner',
    name: 'Khandari Cold Storage Cluster',
    email: 'storage.agra@agriroute.in',
    district: 'Agra',
    state: 'Uttar Pradesh',
    avatar: '🧊',
    highlightBadge: 'WDRA 800T · Agra Cluster',
    destination: '/storage-owner',
    details: 'Khandari Cluster · Agra, UP',
  },
  {
    clerkUserId: 'user_3KHSu2zU5Yfs31WjkXqBjQ8kwjF',
    role: 'storage_owner',
    name: 'Punjab Agro Cold Chain Depot',
    email: 'storage.ludhiana@agriroute.in',
    district: 'Ludhiana',
    state: 'Punjab',
    avatar: '🧊',
    highlightBadge: 'WDRA 600T · Ludhiana Depot',
    destination: '/storage-owner',
    details: 'Punjab Agro · Ludhiana, PB',
  },
  {
    clerkUserId: 'user_3KHSuH6dqJ52p50fPvIIRZMQbIw',
    role: 'storage_owner',
    name: 'Guntur Spices Cold Terminal',
    email: 'storage.guntur@agriroute.in',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    avatar: '🧊',
    highlightBadge: 'WDRA 500T · Spices Terminal',
    destination: '/storage-owner',
    details: 'Spices Terminal · Guntur, AP',
  },

  // 1 Admin
  {
    clerkUserId: 'user_3Jmfx13ctDYiEwcXhXU2IvfUZRK',
    role: 'admin',
    name: 'AgriRoute Administrator',
    email: 'admin.demo@agriroute.in',
    district: 'Central HQ',
    state: 'National',
    avatar: '🛡️',
    highlightBadge: 'Central Control Room',
    destination: '/demo',
    details: 'National System Oversight',
  },
];

export async function GET() {
  try {
    let allAccounts: DemoDbAccount[] = [];

    try {
      const snap = await collections.users.where('isDemoAccount', '==', true).get();
      snap.forEach((doc) => {
        const d = doc.data();
        if (!d.clerkUserId) return;

        const role = d.role as DemoDbAccount['role'];
        let avatar = d.avatar || '👤';
        let highlightBadge = d.highlightBadge || '';
        let destination = '/farmer';
        let details = '';

        if (role === 'farmer') {
          avatar = '🌾';
          highlightBadge = highlightBadge || `${(d.primaryCrops?.[0] || 'Produce').toUpperCase()} Pool`;
          destination = '/farmer';
          details = `${d.village ? d.village + ', ' : ''}${d.district || 'Mandya'}, ${d.state || 'KA'}`;
        } else if (role === 'wholesaler') {
          avatar = '🏪';
          highlightBadge = highlightBadge || 'APMC Buyer';
          destination = '/wholesaler';
          details = `${d.businessName || 'Wholesale Buyer'} · ${d.district || 'City'}`;
        } else if (role === 'logistics_driver') {
          avatar = '🚛';
          highlightBadge = highlightBadge || (d.isRefrigerated ? 'Refrigerated Reefer' : '10T Cargo');
          destination = '/driver';
          details = `${d.vehicleNumber || 'Truck'} · ${d.district || 'City'}`;
        } else if (role === 'storage_owner') {
          avatar = '🧊';
          highlightBadge = highlightBadge || 'WDRA Certified';
          destination = '/storage-owner';
          details = `${d.facilityName || 'Cold Store'} · ${d.district || 'City'}`;
        } else if (role === 'admin') {
          avatar = '🛡️';
          highlightBadge = 'Control Room';
          destination = '/demo';
          details = 'Central Admin & Honesty Panel';
        }

        allAccounts.push({
          clerkUserId: d.clerkUserId,
          role,
          name: d.name || 'Demo User',
          email: d.email || '',
          district: d.district || '',
          state: d.state || '',
          avatar,
          highlightBadge,
          destination,
          details,
        });
      });
    } catch (dbErr) {
      console.warn('Firestore fetch failed, using fallback demo accounts:', dbErr);
    }

    if (allAccounts.length === 0) {
      allAccounts = FALLBACK_ACCOUNTS;
    }

    // Group accounts by role
    const byRole = {
      farmer: allAccounts.filter((a) => a.role === 'farmer'),
      wholesaler: allAccounts.filter((a) => a.role === 'wholesaler'),
      logistics_driver: allAccounts.filter((a) => a.role === 'logistics_driver'),
      storage_owner: allAccounts.filter((a) => a.role === 'storage_owner'),
      admin: allAccounts.filter((a) => a.role === 'admin'),
    };

    return NextResponse.json({
      ok: true,
      byRole,
      data: allAccounts,
      total: allAccounts.length,
    });
  } catch (err: unknown) {
    console.error('Error in /api/demo/accounts:', err);
    return NextResponse.json(
      { ok: false, error: 'FETCH_FAILED', message: 'Could not load demo accounts' },
      { status: 500 }
    );
  }
}
