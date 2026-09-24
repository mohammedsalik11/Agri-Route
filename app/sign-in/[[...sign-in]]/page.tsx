import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 py-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-72 bg-gradient-to-b from-field-green/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mb-6 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-field-green transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <span className="flex items-center gap-1 text-[11px] font-bold text-field-green bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          Secure Access
        </span>
      </div>

      <div className="text-center mb-6 relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white p-2.5 border border-border shadow-sm mb-3 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Agri Route"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Agri Route</h1>
        <p className="text-xs text-ink-muted mt-1">Sign in with Phone &amp; SMS OTP</p>
      </div>

      <div className="w-full max-w-md bg-white p-4 sm:p-6 rounded-3xl border border-border flex justify-center shadow-sm relative z-10">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/onboarding"
          forceRedirectUrl="/onboarding"
        />
      </div>

      <p className="text-[11px] text-ink-muted mt-6 text-center max-w-xs relative z-10">
        Agri Route Direct Marketplace · Protected by Smart Contract Escrow
      </p>
    </div>
  );
}
