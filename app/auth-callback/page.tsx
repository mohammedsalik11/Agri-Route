'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'ready'>('loading');
  const [deepLinkUrl, setDeepLinkUrl] = useState<string>('agriroute://');
  const [webFallbackUrl, setWebFallbackUrl] = useState<string>('/farmer');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.data) {
          const profile = data.data;
          const role = profile.role || 'farmer';
          const name = profile.name || 'Verified User';
          const district = profile.district || 'Mandya';
          const idNumber = profile.farmerId || profile.wholesalerId || profile.driverId || '';
          const userId = profile.clerkUserId || '';

          setUserName(name);

          let webDest = '/farmer';
          if (role === 'wholesaler') webDest = '/wholesaler';
          if (role === 'logistics_driver') webDest = '/driver';
          setWebFallbackUrl(webDest);

          // Deep link back into native Android Jetpack Compose app
          const appLink = `agriroute://auth-callback?role=${encodeURIComponent(role)}&name=${encodeURIComponent(name)}&district=${encodeURIComponent(district)}&idNumber=${encodeURIComponent(idNumber)}&userId=${encodeURIComponent(userId)}`;
          setDeepLinkUrl(appLink);
          setStatus('redirecting');

          // Trigger immediate app redirect
          window.location.href = appLink;

          setTimeout(() => {
            setStatus('ready');
          }, 1200);
        } else {
          const appLink = 'agriroute://role';
          setDeepLinkUrl(appLink);
          setWebFallbackUrl('/onboarding');
          setStatus('redirecting');
          window.location.href = appLink;
          setTimeout(() => {
            setStatus('ready');
          }, 1200);
        }
      })
      .catch(() => {
        setStatus('ready');
      });
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-border shadow-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <Smartphone className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink flex items-center justify-center gap-2">
            <span>Clerk Auth Verified</span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </h1>
          <p className="text-xs text-ink-muted leading-relaxed">
            {userName ? `Welcome, ${userName}!` : 'Your account is verified.'} Redirecting back to the Agri Route Android app...
          </p>
        </div>

        {status === 'redirecting' && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-field-green">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Opening Agri Route Mobile App...</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <a
            href={deepLinkUrl}
            className="w-full py-3.5 px-4 bg-field-green text-white font-bold text-sm rounded-xl hover:bg-field-green/90 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open in Agri Route App</span>
          </a>

          <button
            type="button"
            onClick={() => router.push(webFallbackUrl)}
            className="w-full py-3 px-4 bg-paper/60 text-ink font-semibold text-xs rounded-xl hover:bg-paper transition-all flex items-center justify-center gap-1.5 border border-border"
          >
            <span>Continue in Web Browser</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-ink-muted">
          If your browser does not switch automatically, tap the green button above to return to the app.
        </p>
      </div>
    </div>
  );
}
