'use client';

import { useT } from '@/lib/i18n/LanguageProvider';
import { useRouter } from 'next/navigation';
import { Sprout, Store, Truck } from 'lucide-react';

export default function RoleSelectPage() {
  const { t } = useT();
  const router = useRouter();

  const selectRole = (role: 'farmer' | 'wholesaler' | 'logistics_driver') => {
    document.cookie = `intendedRole=${role};path=/;max-age=${60 * 60 * 24}`;
    router.push('/sign-up');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-paper">
      <h1 className="text-2xl font-bold text-field-green mb-2">{t('role.title')}</h1>
      <p className="text-ink-muted text-sm mb-8">Agri Route</p>

      <div className="w-full max-w-sm space-y-4">
        {/* Farmer */}
        <button
          onClick={() => selectRole('farmer')}
          className="w-full flex items-center gap-4 px-6 py-6 bg-white rounded-2xl border-2 border-border
                     hover:border-field-green hover:shadow-lg transition-all
                     active:scale-[0.98] touch-manipulation"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-fair-green/10">
            <Sprout className="w-7 h-7 text-fair-green" />
          </div>
          <div className="text-left">
            <p className="text-lg font-semibold text-ink">{t('role.farmer')}</p>
            <p className="text-sm text-ink-muted">{t('role.farmerDesc')}</p>
          </div>
        </button>

        {/* Wholesaler */}
        <button
          onClick={() => selectRole('wholesaler')}
          className="w-full flex items-center gap-4 px-6 py-6 bg-white rounded-2xl border-2 border-border
                     hover:border-earth hover:shadow-lg transition-all
                     active:scale-[0.98] touch-manipulation"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-earth/10">
            <Store className="w-7 h-7 text-earth" />
          </div>
          <div className="text-left">
            <p className="text-lg font-semibold text-ink">{t('role.wholesaler')}</p>
            <p className="text-sm text-ink-muted">{t('role.wholesalerDesc')}</p>
          </div>
        </button>

        {/* Logistics Driver */}
        <button
          onClick={() => selectRole('logistics_driver')}
          className="w-full flex items-center gap-4 px-6 py-6 bg-white rounded-2xl border-2 border-border
                     hover:border-blue-600 hover:shadow-lg transition-all
                     active:scale-[0.98] touch-manipulation"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50">
            <Truck className="w-7 h-7 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-lg font-semibold text-ink">{t('role.driver') || 'Logistics Driver'}</p>
            <p className="text-sm text-ink-muted">{t('role.driverDesc') || 'Deliver produce and earn per trip'}</p>
          </div>
        </button>
      </div>
    </main>
  );
}
