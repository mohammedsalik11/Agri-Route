import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/role',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/auth-callback(.*)',
  '/manifest.json',
  '/favicon.ico',
  '/api/health',
  '/api/prices',
  '/api/prices/(.*)',
]);

const isFarmerRoute = createRouteMatcher(['/farmer(.*)']);
const isWholesalerRoute = createRouteMatcher(['/wholesaler(.*)']);
const isDriverRoute = createRouteMatcher(['/driver(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  // Static assets: manifest, icons, favicon
  if (
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // Handle API routes: API requests must NEVER be redirected to HTML pages!
  if (pathname.startsWith('/api')) {
    if (!isPublicRoute(request)) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { ok: false, error: 'UNAUTHENTICATED', message: 'Sign in required' },
          { status: 401 }
        );
      }
    }
    // Authorized API routes proceed directly to their route handlers
    return NextResponse.next();
  }

  // Protect all non-public page routes
  if (!isPublicRoute(request)) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      // Not authenticated — redirect to sign-in
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }

    const role =
      (sessionClaims?.publicMetadata as { role?: string })?.role ||
      request.cookies.get('userRole')?.value;

    // If user is authenticated but has no role, redirect to onboarding
    if (!role && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Role-based route enforcement
    if (role === 'farmer' && (isWholesalerRoute(request) || isDriverRoute(request))) {
      return NextResponse.redirect(new URL('/farmer', request.url));
    }

    if (role === 'wholesaler' && (isFarmerRoute(request) || isDriverRoute(request))) {
      return NextResponse.redirect(new URL('/wholesaler', request.url));
    }

    if (role === 'logistics_driver' && (isFarmerRoute(request) || isWholesalerRoute(request))) {
      return NextResponse.redirect(new URL('/driver', request.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
