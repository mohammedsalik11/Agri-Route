import { NextResponse } from 'next/server';
import { DEMO_ACCOUNTS, DemoAccountWithStatus } from '@/lib/constants/demoAccounts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const accountsWithStatus: DemoAccountWithStatus[] = [];

    // Query active sessions from Clerk for real-time occupancy status
    for (const acc of DEMO_ACCOUNTS) {
      let activeSessionsCount = 0;
      let lastActiveAt: string | null = null;

      if (clerkSecretKey && acc.clerkUserId && !acc.clerkUserId.startsWith('admin')) {
        try {
          // Fetch active sessions with 2.5s abort timeout for snappy response
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const sessionRes = await fetch(
            `https://api.clerk.com/v1/sessions?status=active&user_id=${encodeURIComponent(acc.clerkUserId)}`,
            {
              headers: {
                Authorization: `Bearer ${clerkSecretKey}`,
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
              cache: 'no-store',
            }
          );
          clearTimeout(timeoutId);

          if (sessionRes.ok) {
            const sessions = await sessionRes.json();
            if (Array.isArray(sessions)) {
              activeSessionsCount = sessions.length;
              if (sessions.length > 0 && sessions[0].latest_activity_at) {
                lastActiveAt = new Date(sessions[0].latest_activity_at).toISOString();
              }
            }
          }
        } catch {
          // Non-blocking fallback if Clerk network is slow
        }
      }

      // Determine human-friendly status
      let status: 'Available' | 'Available for shared testing' | 'In use' = 'Available';
      if (activeSessionsCount > 0) {
        status = acc.sharedTesting ? 'Available for shared testing' : 'In use';
      } else {
        status = 'Available';
      }

      accountsWithStatus.push({
        ...acc,
        status,
        activeSessionsCount,
        lastActiveAt,
      });
    }

    return NextResponse.json({
      ok: true,
      data: accountsWithStatus,
      serverTime: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Failed to get demo credentials status:', err);
    // Fallback directly to static accounts with 'Available' status
    const fallback = DEMO_ACCOUNTS.map((a) => ({
      ...a,
      status: 'Available' as const,
      activeSessionsCount: 0,
      lastActiveAt: null,
    }));
    return NextResponse.json({
      ok: true,
      data: fallback,
      serverTime: new Date().toISOString(),
    });
  }
}
