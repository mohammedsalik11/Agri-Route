'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';

export interface CartItem {
  sourceType: 'pool' | 'listing';
  sourceId: string;
  crop: string;
  qualityGrade: string;
  district: string;
  quantityKg: number;
  pricePerKgPaise: number; // paise
  farmerCount?: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; sourceId: string }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Deduplicate by sourceId
      const exists = state.items.some((i) => i.sourceId === action.item.sourceId);
      if (exists) return state;
      return { items: [...state.items, action.item] };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.sourceId !== action.sourceId) };
    case 'CLEAR':
      return { items: [] };
    case 'HYDRATE':
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  totalKg: number;
  totalPaise: number;
  addItem: (item: CartItem) => void;
  removeItem: (sourceId: string) => void;
  clearCart: () => void;
  hasItem: (sourceId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'agriroute_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          dispatch({ type: 'HYDRATE', items: parsed });
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore storage errors
    }
  }, [state.items]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', item });
  }, []);

  const removeItem = useCallback((sourceId: string) => {
    dispatch({ type: 'REMOVE_ITEM', sourceId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const hasItem = useCallback(
    (sourceId: string) => state.items.some((i) => i.sourceId === sourceId),
    [state.items]
  );

  const totalKg = state.items.reduce((s, i) => s + i.quantityKg, 0);
  const totalPaise = state.items.reduce(
    (s, i) => s + i.quantityKg * i.pricePerKgPaise,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        count: state.items.length,
        totalKg,
        totalPaise,
        addItem,
        removeItem,
        clearCart,
        hasItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
