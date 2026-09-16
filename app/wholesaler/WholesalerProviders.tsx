'use client';

import { CartProvider } from '@/lib/context/CartContext';

export function WholesalerProviders({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
