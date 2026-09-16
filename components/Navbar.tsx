'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage, useT } from '@/lib/i18n/LanguageProvider';
import { UserButton } from '@clerk/nextjs';
import { Sprout, Store, Globe, List, Users, ShoppingBag, MessageSquare, Warehouse, Award } from 'lucide-react';
import type { Language } from '@/lib/i18n/LanguageProvider';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const { t } = useT();

  const isFarmer = pathname.startsWith('/farmer');
  const isWholesaler = pathname.startsWith('/wholesaler');
  const homeLink = isFarmer ? '/farmer' : isWholesaler ? '/wholesaler' : '/';

  const langLabels: Record<Language, string> = {
    en: 'English',
    kn: 'ಕನ್ನಡ',
    hi: 'हिंदी',
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href={homeLink} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-field-green flex items-center justify-center text-white text-lg">
              🌾
            </div>
            <div>
              <span className="font-bold text-field-green text-lg tracking-tight block leading-tight">
                Agri Route
              </span>
            </div>
          </Link>

          {/* Center navigation links - Desktop */}
          <nav className="hidden sm:flex items-center gap-4 text-sm font-semibold">
            {isFarmer && (
              <>
                <Link href="/farmer" className={`hover:text-field-green transition-colors ${pathname === '/farmer' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.title')}</Link>
                <Link href="/farmer/list" className={`hover:text-field-green transition-colors ${pathname === '/farmer/list' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.listProduce')}</Link>
                <Link href="/farmer/pools" className={`hover:text-field-green transition-colors ${pathname === '/farmer/pools' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.viewPools')}</Link>
                <Link href="/farmer/storage" className={`hover:text-field-green transition-colors ${pathname === '/farmer/storage' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.coldStorage')}</Link>
                <Link href="/farmer/orders" className={`hover:text-field-green transition-colors ${pathname === '/farmer/orders' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.viewOrders')}</Link>
                <Link href="/farmer/earnings" className={`hover:text-field-green transition-colors ${pathname === '/farmer/earnings' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.myEarnings')}</Link>
                <Link href="/farmer/negotiations" className={`hover:text-field-green transition-colors ${pathname === '/farmer/negotiations' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.negotiationInbox')}</Link>
              </>
            )}
            {isWholesaler && (
              <>
                <Link href="/wholesaler" className={`hover:text-earth transition-colors ${pathname === '/wholesaler' ? 'text-earth font-bold' : 'text-ink-muted'}`}>{t('wholesaler.browse')}</Link>
                <Link href="/wholesaler/storage" className={`hover:text-earth transition-colors ${pathname === '/wholesaler/storage' ? 'text-earth font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.coldStorage')}</Link>
                <Link href="/wholesaler/orders" className={`hover:text-earth transition-colors ${pathname === '/wholesaler/orders' ? 'text-earth font-bold' : 'text-ink-muted'}`}>{t('wholesaler.orders')}</Link>
                <Link href="/wholesaler/negotiations" className={`hover:text-earth transition-colors ${pathname === '/wholesaler/negotiations' ? 'text-earth font-bold' : 'text-ink-muted'}`}>{t('farmer.dashboard.negotiationInbox')}</Link>
              </>
            )}
          </nav>

          {/* Right tools: Language switch */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper border border-border text-xs font-semibold text-ink hover:border-field-green transition-all cursor-pointer">
                <Globe className="w-3.5 h-3.5 text-field-green" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent border-none outline-none cursor-pointer appearance-none pr-4"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="kn">ಕನ್ನಡ</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-1 text-ink-muted">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <UserButton />
          </div>
        </div>
      </header>

      {/* Fixed Bottom Tab Bar for Mobile */}
      {/* Spacer so content is not hidden behind the fixed bar */}
      <div className="sm:hidden h-16 w-full" />
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] pb-safe">
        {isFarmer ? (
          <div className="flex items-center justify-around px-2 py-2 text-[10px] font-medium h-16">
            <Link href="/farmer" className={`flex flex-col items-center gap-1 w-full ${pathname === '/farmer' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>
              <Sprout className="w-5 h-5" />
              <span>{t('farmer.dashboard.title')}</span>
            </Link>
            <Link href="/farmer/list" className={`flex flex-col items-center gap-1 w-full ${pathname === '/farmer/list' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>
              <List className="w-5 h-5" />
              <span className="truncate w-full text-center">{t('farmer.dashboard.listProduce')}</span>
            </Link>
            <Link href="/farmer/pools" className={`flex flex-col items-center gap-1 w-full ${pathname === '/farmer/pools' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>
              <Users className="w-5 h-5" />
              <span>Pools</span>
            </Link>
            <Link href="/farmer/storage" className={`flex flex-col items-center gap-1 w-full ${pathname === '/farmer/storage' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>
              <Warehouse className="w-5 h-5" />
              <span>Storage</span>
            </Link>
            <Link href="/farmer/orders" className={`flex flex-col items-center gap-1 w-full ${pathname === '/farmer/orders' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>
              <ShoppingBag className="w-5 h-5" />
              <span>Orders</span>
            </Link>
            <Link href="/farmer/negotiations" className={`flex flex-col items-center gap-1 w-full ${pathname === '/farmer/negotiations' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </Link>
          </div>
        ) : isWholesaler ? (
          <div className="flex items-center justify-around px-2 py-2 text-[10px] font-medium h-16">
            <Link href="/wholesaler" className={`flex flex-col items-center gap-1 w-full ${pathname === '/wholesaler' ? 'text-earth font-bold' : 'text-ink-muted'}`}>
              <Store className="w-5 h-5" />
              <span>Browse</span>
            </Link>
            <Link href="/wholesaler/storage" className={`flex flex-col items-center gap-1 w-full ${pathname === '/wholesaler/storage' ? 'text-earth font-bold' : 'text-ink-muted'}`}>
              <Warehouse className="w-5 h-5" />
              <span>Storage</span>
            </Link>
            <Link href="/wholesaler/orders" className={`flex flex-col items-center gap-1 w-full ${pathname === '/wholesaler/orders' ? 'text-earth font-bold' : 'text-ink-muted'}`}>
              <ShoppingBag className="w-5 h-5" />
              <span>Orders</span>
            </Link>
            <Link href="/wholesaler/negotiations" className={`flex flex-col items-center gap-1 w-full ${pathname === '/wholesaler/negotiations' ? 'text-earth font-bold' : 'text-ink-muted'}`}>
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
};
