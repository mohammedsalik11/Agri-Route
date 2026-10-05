import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { OneStepDemoLogin } from '@/components/OneStepDemoLogin';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper relative">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-72 bg-gradient-to-b from-field-green/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* Top bar with back to home */}
        <div className="w-full max-w-xl mx-auto mb-4 flex items-center justify-between relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-field-green transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <span className="flex items-center gap-1 text-[11px] font-bold text-field-green bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Demo System
          </span>
        </div>

        {/* Branding header */}
        <div className="text-center mb-5 relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 border border-border shadow-sm mb-2 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Agri Route"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Agri Route</h1>
          <p className="text-xs text-ink-muted mt-0.5">Direct Agricultural Marketplace · SIH 2026</p>
        </div>

        {/* Main Content: 1-Step Demo Profiles & Clerk Sign-In */}
        <div className="w-full max-w-xl mx-auto space-y-6 relative z-10">
          {/* 1-Step Login Demo Profiles (Theme-Matched, 5 per role) */}
          <OneStepDemoLogin />

          {/* Or standard login divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">
              Or Sign In With Custom Account
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* Clerk Auth Card */}
          <div className="w-full bg-white p-4 sm:p-6 rounded-3xl border border-border flex justify-center shadow-sm">
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/onboarding"
              forceRedirectUrl="/onboarding"
            />
          </div>
        </div>

        <p className="text-[11px] text-ink-muted mt-6 text-center max-w-xs relative z-10">
          Agri Route Direct Marketplace · Protected by Smart Contract Escrow
        </p>
      </div>
    </div>
  );
}
