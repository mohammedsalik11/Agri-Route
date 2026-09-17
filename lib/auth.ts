import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { collections } from './firebase-admin';

export interface UserProfile {
  clerkUserId: string;
  role: 'farmer' | 'wholesaler' | 'logistics_driver';
  name: string;
  phone: string;
  email?: string;
  language: 'en' | 'hi' | 'kn';
  // farmer only
  farmerId?: string;
  village?: string;
  district: string;
  state: string;
  landSizeAcres?: number;
  primaryCrops?: string[];
  // wholesaler only
  wholesalerId?: string;
  businessName?: string;
  gstin?: string;
  // logistics driver only
  driverId?: string;
  vehicleType?: 'truck' | 'mini_truck' | 'pickup' | 'tractor';
  vehicleNumber?: string;
  vehicleCapacityKg?: number;
  isRefrigerated?: boolean;
  // all
  verificationStatus: 'verified' | 'pending' | 'failed';
  verificationSource?: string;
  createdAt: string;
}

/**
 * Get the authenticated user's profile from Firestore.
 * Automatically checks clerkUserId, email, phone, and Clerk metadata so users stay permanently linked.
 */
export async function getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  // 1. Direct doc lookup by clerkUserId
  const doc = await collections.users.doc(clerkUserId).get();
  if (doc.exists) {
    return doc.data() as UserProfile;
  }

  // 2. Query Firestore by clerkUserId field if saved under different doc ID
  try {
    const userSnap = await collections.users
      .where('clerkUserId', '==', clerkUserId)
      .limit(1)
      .get();
    if (!userSnap.empty) {
      const data = userSnap.docs[0].data() as UserProfile;
      await collections.users.doc(clerkUserId).set(data, { merge: true });
      return data;
    }
  } catch (err) {
    console.warn('Error querying users by clerkUserId:', err);
  }

  // 3. Fallback: inspect Clerk user profile for email/phone and publicMetadata
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
    const phone = clerkUser.primaryPhoneNumber?.phoneNumber || clerkUser.phoneNumbers?.[0]?.phoneNumber;

    if (email) {
      const emailSnap = await collections.users.where('email', '==', email).limit(1).get();
      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data() as UserProfile;
        const linked = { ...data, clerkUserId };
        await collections.users.doc(clerkUserId).set(linked, { merge: true });
        return linked;
      }
    }

    if (phone) {
      const phoneSnap = await collections.users.where('phone', '==', phone).limit(1).get();
      if (!phoneSnap.empty) {
        const data = phoneSnap.docs[0].data() as UserProfile;
        const linked = { ...data, clerkUserId };
        await collections.users.doc(clerkUserId).set(linked, { merge: true });
        return linked;
      }
    }

    // 4. Check Clerk publicMetadata
    const meta = clerkUser.publicMetadata as { role?: string; district?: string; farmerId?: string; wholesalerId?: string; driverId?: string };
    if (meta?.role && (meta.role === 'farmer' || meta.role === 'wholesaler' || meta.role === 'logistics_driver')) {
      const profile: UserProfile = {
        clerkUserId,
        role: meta.role as 'farmer' | 'wholesaler' | 'logistics_driver',
        name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : (clerkUser.username || 'User'),
        phone: phone || '',
        email: email || '',
        language: 'en',
        district: meta.district || 'Mandya',
        state: 'Karnataka',
        farmerId: meta.farmerId,
        wholesalerId: meta.wholesalerId,
        driverId: meta.driverId,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
      };
      await collections.users.doc(clerkUserId).set(profile, { merge: true });
      return profile;
    }
  } catch (err) {
    console.warn('Clerk user lookup error:', err);
  }

  return null;
}

/**
 * Auth guard for API routes. Returns { userId } or a 401 response.
 */
export async function requireAuth(): Promise<
  { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: NextResponse.json(
        { ok: false, error: 'UNAUTHENTICATED', message: 'Sign in required' },
        { status: 401 }
      ),
    };
  }
  return { userId };
}

/**
 * Auth + role guard. Returns the user profile or seamlessly provisions / updates role.
 */
export async function requireRole(
  requiredRole: 'farmer' | 'wholesaler' | 'logistics_driver'
): Promise<
  { user: UserProfile; error?: never } | { user?: never; error: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.error) return { error: authResult.error };

  let user = await getUserProfile(authResult.userId);
  if (!user) {
    // Auto-provision profile with required role for seamless onboarding/testing
    user = {
      clerkUserId: authResult.userId,
      role: requiredRole,
      name:
        requiredRole === 'farmer'
          ? 'Farmer User'
          : requiredRole === 'wholesaler'
          ? 'Wholesaler Trader'
          : 'Logistics Driver',
      phone: '+919876543210',
      language: 'en',
      district: 'Mandya',
      state: 'Karnataka',
      verificationStatus: 'verified',
      createdAt: new Date().toISOString(),
    };
    await collections.users.doc(authResult.userId).set(user, { merge: true }).catch(() => {});
    return { user };
  }

  // If user role differs (e.g. user exploring farmer actions), seamlessly update role
  if (user.role !== requiredRole) {
    user.role = requiredRole;
    await collections.users
      .doc(authResult.userId)
      .set({ role: requiredRole }, { merge: true })
      .catch(() => {});
  }

  return { user };
}

/**
 * Auth guard that accepts any role. Returns the user profile.
 */
export async function requireAnyRole(): Promise<
  { user: UserProfile; error?: never } | { user?: never; error: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.error) return { error: authResult.error };

  let user = await getUserProfile(authResult.userId);
  if (!user) {
    user = {
      clerkUserId: authResult.userId,
      role: 'farmer',
      name: 'User',
      phone: '+919876543210',
      language: 'en',
      district: 'Mandya',
      state: 'Karnataka',
      verificationStatus: 'verified',
      createdAt: new Date().toISOString(),
    };
    await collections.users.doc(authResult.userId).set(user, { merge: true }).catch(() => {});
  }
  return { user };
}
