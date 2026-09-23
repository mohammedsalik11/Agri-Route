'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage, useT } from '@/lib/i18n/LanguageProvider';
import { UserButton } from '@clerk/nextjs';
import { Sprout, Store, Globe, List, Users, ShoppingBag, MessageSquare, Warehouse, Award, Truck, UserCheck, ShieldCheck, Building2 } from 'lucide-react';
import type { Language } from '@/lib/i18n/LanguageProvider';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const { t } = useT();

  const isFarmer = pathname.startsWith('/farmer');
  const isWholesaler = pathname.startsWith('/wholesaler');
  const isDriver = pathname.startsWith('/driver');
  const isStorageOwner = pathname.startsWith('/storage-owner');
  const homeLink = isFarmer ? '/farmer' : isWholesaler ? '/wholesaler' : isDriver ? '/driver' : isStorageOwner ? '/storage-owner' : '/';

  const langLabels: Record<Language, string> = {
    en: 'English',
    kn: 'ಕನ್ನಡ',
    hi: 'हिंदी',
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href={homeLink} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 border border-border/80 shadow-xs group-hover:border-field-green/60 transition-all">
              <img
                src="/logo.png"
                alt="Agri Route Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-field-green text-lg tracking-tight block leading-tight">
                Agri Route
              </span>
              <span className="text-[10px] font-bold text-earth block leading-none tracking-wide">
                Fair Prices, Together
              </span>
            </div>
          </Link>

          {/* Center navigation links - Desktop */}
          <nav className="hidden sm:flex items-center gap-1 text-sm font-semibold">
            {isFarmer && (
              <>
                <Link
                  href="/farmer"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/farmer'
                      ? 'bg-field-green/10 text-field-green font-bold shadow-xs'
                      : 'text-ink-muted hover:text-field-green hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.title')}
                </Link>
                <Link
                  href="/farmer/list"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/farmer/list'
                      ? 'bg-field-green/10 text-field-green font-bold shadow-xs'
                      : 'text-ink-muted hover:text-field-green hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.listProduce')}
                </Link>
                <Link
                  href="/farmer/pools"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/farmer/pools'
                      ? 'bg-field-green/10 text-field-green font-bold shadow-xs'
                      : 'text-ink-muted hover:text-field-green hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.viewPools')}
                </Link>
                <Link
                  href="/farmer/storage"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/farmer/storage'
                      ? 'bg-field-green/10 text-field-green font-bold shadow-xs'
                      : 'text-ink-muted hover:text-field-green hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.coldStorage')}
                </Link>
                <Link
                  href="/farmer/orders"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/farmer/orders'
                      ? 'bg-field-green/10 text-field-green font-bold shadow-xs'
                      : 'text-ink-muted hover:text-field-green hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.viewOrders')}
                </Link>
                <Link
                  href="/farmer/earnings"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/farmer/earnings'
                      ? 'bg-field-green/10 text-field-green font-bold shadow-xs'
                      : 'text-ink-muted hover:text-field-green hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.myEarnings')}
                </Link>
                <Link
                  href="/farmer/negotiations"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/farmer/negotiations'
                      ? 'bg-field-green/10 text-field-green font-bold shadow-xs'
                      : 'text-ink-muted hover:text-field-green hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.negotiationInbox')}
                </Link>
                <Link
                  href="/farmer/messages"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/farmer/messages'
                      ? 'bg-field-green/10 text-field-green font-bold shadow-xs'
                      : 'text-ink-muted hover:text-field-green hover:bg-black/5'
                  }`}
                >
                  Messages
                </Link>
              </>
            )}
            {isWholesaler && (
              <>
                <Link
                  href="/wholesaler"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/wholesaler'
                      ? 'bg-earth/10 text-earth font-bold shadow-xs'
                      : 'text-ink-muted hover:text-earth hover:bg-black/5'
                  }`}
                >
                  {t('wholesaler.browse')}
                </Link>
                <Link
                  href="/wholesaler/storage"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/wholesaler/storage'
                      ? 'bg-earth/10 text-earth font-bold shadow-xs'
                      : 'text-ink-muted hover:text-earth hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.coldStorage')}
                </Link>
                <Link
                  href="/wholesaler/orders"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/wholesaler/orders'
                      ? 'bg-earth/10 text-earth font-bold shadow-xs'
                      : 'text-ink-muted hover:text-earth hover:bg-black/5'
                  }`}
                >
                  {t('wholesaler.orders')}
                </Link>
                <Link
                  href="/wholesaler/negotiations"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/wholesaler/negotiations'
                      ? 'bg-earth/10 text-earth font-bold shadow-xs'
                      : 'text-ink-muted hover:text-earth hover:bg-black/5'
                  }`}
                >
                  {t('farmer.dashboard.negotiationInbox')}
                </Link>
                <Link
                  href="/wholesaler/messages"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/wholesaler/messages'
                      ? 'bg-earth/10 text-earth font-bold shadow-xs'
                      : 'text-ink-muted hover:text-earth hover:bg-black/5'
                  }`}
                >
                  Messages
                </Link>
              </>
            )}
            {isDriver && (
              <>
                <Link
                  href="/driver"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/driver'
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                      : 'text-ink-muted hover:text-blue-600 hover:bg-black/5'
                  }`}
                >
                  Driver Hub
                </Link>
                <Link
                  href="/driver#active-trips"
                  className="px-3 py-1.5 rounded-lg text-ink-muted hover:text-blue-600 hover:bg-black/5 transition-all"
                >
                  Active Trips
                </Link>
                <Link
                  href="/driver#jobs"
                  className="px-3 py-1.5 rounded-lg text-ink-muted hover:text-blue-600 hover:bg-black/5 transition-all"
                >
                  Available Loads
                </Link>
                <Link
                  href="/driver/messages"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/driver/messages'
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                      : 'text-ink-muted hover:text-blue-600 hover:bg-black/5'
                  }`}
                >
                  Messages
                </Link>
              </>
            )}
            {isStorageOwner && (
              <>
                <Link
                  href="/storage-owner"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/storage-owner'
                      ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                      : 'text-ink-muted hover:text-emerald-700 hover:bg-black/5'
                  }`}
                >
                  Storage Dashboard
                </Link>
                <Link
                  href="/storage-owner/messages"
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pathname === '/storage-owner/messages'
                      ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                      : 'text-ink-muted hover:text-emerald-700 hover:bg-black/5'
                  }`}
                >
                  Messages
                </Link>
              </>
            )}
          </nav>

          {/* Right tools: Language switch + User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="relative group">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper/80 border border-border text-xs font-semibold text-ink hover:border-field-green transition-all cursor-pointer shadow-xs">
                <Globe className="w-3.5 h-3.5 text-field-green" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent border-none outline-none cursor-pointer appearance-none pr-4 font-semibold"
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

            {/* Switch Role / Edit Profile */}
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper/80 border border-border text-xs font-semibold text-ink hover:border-field-green hover:bg-field-green/5 transition-all shadow-xs"
              title="Change Role or Profile Inputs"
            >
              {isFarmer && <Sprout className="w-3.5 h-3.5 text-field-green" />}
              {isWholesaler && <Store className="w-3.5 h-3.5 text-earth" />}
              {isDriver && <Truck className="w-3.5 h-3.5 text-blue-600" />}
              {isStorageOwner && <Warehouse className="w-3.5 h-3.5 text-emerald-600" />}
              {!isFarmer && !isWholesaler && !isDriver && !isStorageOwner && <UserCheck className="w-3.5 h-3.5 text-field-green" />}
              <span className="font-semibold capitalize">
                {isFarmer ? 'Farmer' : isWholesaler ? 'Wholesaler' : isDriver ? 'Driver' : isStorageOwner ? 'Storage' : 'Profile'}
              </span>
              <span className="text-[10px] text-ink-muted font-normal">(Role)</span>
            </Link>

            <UserButton />
          </div>
        </div>
      </header>

      {/* Fixed Bottom Tab Bar for Mobile */}
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
            <Link href="/farmer/messages" className={`flex flex-col items-center gap-1 w-full ${pathname === '/farmer/messages' ? 'text-field-green font-bold' : 'text-ink-muted'}`}>
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
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
            <Link href="/wholesaler/messages" className={`flex flex-col items-center gap-1 w-full ${pathname === '/wholesaler/messages' ? 'text-earth font-bold' : 'text-ink-muted'}`}>
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </Link>
          </div>
        ) : isDriver ? (
          <div className="flex items-center justify-around px-2 py-2 text-[10px] font-medium h-16">
            <Link href="/driver" className={`flex flex-col items-center gap-1 w-full ${pathname === '/driver' ? 'text-blue-600 font-bold' : 'text-ink-muted'}`}>
              <List className="w-5 h-5" />
              <span>Loads</span>
            </Link>
            <Link href="/driver#active-trips" className="flex flex-col items-center gap-1 w-full text-ink-muted hover:text-blue-600">
              <ShoppingBag className="w-5 h-5" />
              <span>My Trips</span>
            </Link>
            <Link href="/driver/messages" className={`flex flex-col items-center gap-1 w-full ${pathname === '/driver/messages' ? 'text-blue-600 font-bold' : 'text-ink-muted'}`}>
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </Link>
          </div>
        ) : isStorageOwner ? (
          <div className="flex items-center justify-around px-2 py-2 text-[10px] font-medium h-16">
            <Link href="/storage-owner" className={`flex flex-col items-center gap-1 w-full ${pathname === '/storage-owner' ? 'text-emerald-600 font-bold' : 'text-ink-muted'}`}>
              <Warehouse className="w-5 h-5" />
              <span>Facilities</span>
            </Link>
            <Link href="/storage-owner/messages" className={`flex flex-col items-center gap-1 w-full ${pathname === '/storage-owner/messages' ? 'text-emerald-600 font-bold' : 'text-ink-muted'}`}>
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
};
