'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import {
  Zap,
  Sprout,
  Store,
  Truck,
  Warehouse,
  ShieldCheck,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { DemoDbAccount } from '@/app/api/demo/accounts/route';

type RoleKey = 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner' | 'admin';

interface OneStepDemoLoginProps {
  initialRole?: RoleKey;
  className?: string;
}

export const OneStepDemoLogin: React.FC<OneStepDemoLoginProps> = ({
  initialRole = 'farmer',
  className = '',
}) => {
  const router = useRouter();
  const clerk = useClerk();

  const [activeTab, setActiveTab] = useState<RoleKey>(initialRole);
  const [byRole, setByRole] = useState<Record<RoleKey, DemoDbAccount[]>>({
    farmer: [],
    wholesaler: [],
    logistics_driver: [],
    storage_owner: [],
    admin: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [loggingInUserId, setLoggingInUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all profiles grouped by role from /api/demo/accounts
  const fetchAccounts = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/demo/accounts?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.byRole) {
          setByRole(json.byRole);
        }
      }
    } catch (e) {
      console.warn('Could not load demo accounts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOneStepLogin = async (account: DemoDbAccount) => {
    if (loggingInUserId) return;
    setLoggingInUserId(account.clerkUserId);
    setErrorMessage(null);

    // Set cookie immediately for quick routing
    document.cookie = `userRole=${account.role};path=/;max-age=${60 * 60 * 24 * 30}`;

    try {
      // If there's an existing active session, sign out first to avoid session conflicts
      if (clerk?.session) {
        try {
          await clerk.signOut();
        } catch {
          // ignore signout errors
        }
      }

      // 1. Try in-app token login via backend API
      try {
        const res = await fetch('/api/demo/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkUserId: account.clerkUserId }),
        });

        const data = await res.json();

        if (data?.ok && data?.token && clerk?.client?.signIn) {
          const signInAttempt = await (clerk.client.signIn as any).create({
            strategy: 'ticket',
            ticket: data.token,
          });

          if (signInAttempt?.status === 'complete' && signInAttempt?.createdSessionId) {
            await clerk.setActive({ session: signInAttempt.createdSessionId });
            window.location.href = data.destination || account.destination;
            return;
          }
        }
      } catch (tokenErr) {
        console.warn('Ticket sign-in attempt warning:', tokenErr);
      }

      // 2. Direct in-app password sign-in (never leaves AgriRoute, 0 external clerk website visits!)
      if (clerk?.client?.signIn && account.email) {
        const pwAttempt = await clerk.client.signIn.create({
          identifier: account.email,
          password: 'Password@AgriRoute2026',
        });

        if (pwAttempt?.status === 'complete' && pwAttempt?.createdSessionId) {
          await clerk.setActive({ session: pwAttempt.createdSessionId });
          window.location.href = account.destination;
          return;
        }
      }

      throw new Error('Could not establish demo session. Please try clicking again.');
    } catch (err: unknown) {
      console.error('1-step login error:', err);
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setErrorMessage(msg);
      setLoggingInUserId(null);
    }
  };

  const tabs: {
    key: RoleKey;
    label: string;
    count: number;
    icon: React.ReactNode;
    activeClass: string;
    badgeClass: string;
  }[] = [
    {
      key: 'farmer',
      label: 'Farmers',
      count: byRole.farmer.length || 5,
      icon: <Sprout className="w-3.5 h-3.5" />,
      activeClass: 'border-field-green bg-emerald-50 text-field-green font-bold shadow-xs',
      badgeClass: 'bg-emerald-100 text-field-green',
    },
    {
      key: 'wholesaler',
      label: 'Wholesalers',
      count: byRole.wholesaler.length || 5,
      icon: <Store className="w-3.5 h-3.5" />,
      activeClass: 'border-earth bg-amber-50 text-earth font-bold shadow-xs',
      badgeClass: 'bg-amber-100 text-earth',
    },
    {
      key: 'logistics_driver',
      label: 'Drivers',
      count: byRole.logistics_driver.length || 5,
      icon: <Truck className="w-3.5 h-3.5" />,
      activeClass: 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs',
      badgeClass: 'bg-blue-100 text-blue-700',
    },
    {
      key: 'storage_owner',
      label: 'Cold Storage',
      count: byRole.storage_owner.length || 5,
      icon: <Warehouse className="w-3.5 h-3.5" />,
      activeClass: 'border-teal-600 bg-teal-50 text-teal-800 font-bold shadow-xs',
      badgeClass: 'bg-teal-100 text-teal-800',
    },
    {
      key: 'admin',
      label: 'Admin',
      count: byRole.admin.length || 1,
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      activeClass: 'border-purple-600 bg-purple-50 text-purple-800 font-bold shadow-xs',
      badgeClass: 'bg-purple-100 text-purple-800',
    },
  ];

  const currentAccounts = byRole[activeTab] || [];

  return (
    <div
      className={`w-full max-w-xl mx-auto bg-white border border-border rounded-3xl p-4 shadow-sm text-ink ${className}`}
    >
      {/* Header matching AgriRoute brand identity */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-field-green/10 text-field-green flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 fill-field-green" />
          </div>
          <h3 className="font-extrabold text-xs sm:text-sm text-ink flex items-center gap-1.5">
            1-Step Demo Profiles
            <span className="text-[10px] font-bold text-field-green bg-emerald-100/70 border border-emerald-200 px-2 py-0.2 rounded-full">
              Instant
            </span>
          </h3>
        </div>
        <span className="text-[10px] text-ink-muted font-medium">
          Click profile to log in
        </span>
      </div>

      {/* Role Selector Tabs (Light Theme) */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-all shrink-0 border ${
                isActive
                  ? tab.activeClass
                  : 'bg-paper/70 hover:bg-paper border-border text-ink-muted hover:text-ink'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                  isActive ? tab.badgeClass : 'bg-border/60 text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error notification if any */}
      {errorMessage && (
        <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-800 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Small 1-Step Profiles: ONLY ICON WITH NAME */}
      {loading && currentAccounts.length === 0 ? (
        <div className="py-4 flex items-center justify-center text-ink-muted gap-2 text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-field-green" />
          <span>Loading profiles...</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {currentAccounts.map((acc) => {
            const isThisLoggingIn = loggingInUserId === acc.clerkUserId;

            return (
              <button
                key={acc.clerkUserId}
                type="button"
                onClick={() => handleOneStepLogin(acc)}
                disabled={!!loggingInUserId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/90 bg-paper/60 hover:bg-emerald-50/70 hover:border-field-green text-ink text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer group"
                title={`1-Step Login as ${acc.name} (${acc.district}, ${acc.state})`}
              >
                {isThisLoggingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-field-green" />
                ) : (
                  <span className="text-sm shrink-0">{acc.avatar}</span>
                )}
                <span className="truncate">{acc.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
