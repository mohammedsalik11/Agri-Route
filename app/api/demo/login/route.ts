import { NextResponse } from 'next/server';
import { collections } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { clerkUserId } = await request.json();

    if (!clerkUserId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_USER_ID', message: 'clerkUserId is required' },
        { status: 400 }
      );
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      return NextResponse.json(
        { ok: false, error: 'NO_CLERK_KEY', message: 'Clerk secret key is missing' },
        { status: 500 }
      );
    }

    // 1. Fetch user role from Firestore to determine destination
    let role = 'farmer';
    let destination = '/farmer';
    let userName = 'Demo User';

    try {
      const userDoc = await collections.users.doc(clerkUserId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        role = data?.role || 'farmer';
        userName = data?.name || userName;
        if (role === 'wholesaler') destination = '/wholesaler';
        else if (role === 'logistics_driver') destination = '/driver';
        else if (role === 'storage_owner') destination = '/storage-owner';
        else if (role === 'admin') destination = '/demo';
      }
    } catch (e) {
      console.warn('Could not read user profile from firestore:', e);
    }

    // 2. Request a 1-step Sign-In Token from Clerk Backend API
    const response = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: clerkUserId,
        expires_in_seconds: 300,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Clerk sign_in_token creation error:', errData);
      return NextResponse.json(
        { ok: false, error: 'CLERK_ERROR', message: errData.errors?.[0]?.message || 'Failed to create sign-in token' },
        { status: response.status }
      );
    }

    const tokenData = await response.json();

    const res = NextResponse.json({
      ok: true,
      token: tokenData.token,
      url: tokenData.url,
      destination,
      role,
      name: userName,
    });

    // Set userRole cookie
    res.cookies.set('userRole', role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: 'lax',
    });

    return res;
  } catch (error: unknown) {
    console.error('Demo 1-step login error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown login error';
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: msg },
      { status: 500 }
    );
  }
}
