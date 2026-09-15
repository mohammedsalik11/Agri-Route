import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { collections } from './firebase-admin';

export interface UserProfile {
  clerkUserId: string;
  role: 'farmer' | 'wholesaler';
  name: string;
  phone: string;
  language: 'en' | 'hi' | 'kn';
  // farmer only
  farmerId?: string;
  village?: string;
  district: string;
  state: string;
  landSizeAcres?: number;
  category?: 'general' | 'sc' | 'st' | 'obc';
  primaryCrops?: string[];
  // wholesaler only
  wholesalerId?: string;
  businessName?: string;
  gstin?: string;
  // both
  verificationStatus: 'verified' | 'pending' | 'failed';
  verificationSource: 'seeded-registry';
  createdAt: string;
}

/**
 * Get the authenticated user's profile from Firestore.
 * Returns null if user doc doesn't exist (not onboarded yet).
 */
export async function getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  const doc = await collections.users.doc(clerkUserId).get();
  if (!doc.exists) return null;
  return doc.data() as UserProfile;
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
 * Auth + role guard. Returns the user profile or a 403 response.
 */
export async function requireRole(
  requiredRole: 'farmer' | 'wholesaler'
): Promise<
  { user: UserProfile; error?: never } | { user?: never; error: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.error) return { error: authResult.error };

  const user = await getUserProfile(authResult.userId);
  if (!user) {
    return {
      error: NextResponse.json(
        { ok: false, error: 'NOT_ONBOARDED', message: 'Complete onboarding first' },
        { status: 403 }
      ),
    };
  }
  if (user.role !== requiredRole) {
    return {
      error: NextResponse.json(
        { ok: false, error: 'WRONG_ROLE', message: `This action requires ${requiredRole} role` },
        { status: 403 }
      ),
    };
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

  const user = await getUserProfile(authResult.userId);
  if (!user) {
    return {
      error: NextResponse.json(
        { ok: false, error: 'NOT_ONBOARDED', message: 'Complete onboarding first' },
        { status: 403 }
      ),
    };
  }
  return { user };
}
