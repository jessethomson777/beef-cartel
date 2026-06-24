'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product, CustomerDetails, CartLine } from '@/lib/types';
import { estBalance } from '@/lib/money';

interface CartContextValue {
  /** Snapshot of the product catalogue (set by the catalogue page). */
  catalog: Product[];
  setCatalog: (products: Product[]) => void;
  /** productId → quantity (only > 0 entries kept). */
  quantities: Record<string, number>;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  customer: CustomerDetails | null;
  setCustomer: (c: CustomerDetails) => void;
  /** Catalogue lines with qty > 0, joined to product data. */
  lines: CartLine[];
  itemCount: number;
  depositTotal: number;
  estTotalTotal: number;
  estBalanceTotal: number;
  /** True once localStorage has been read (avoid SSR/first-paint mismatch). */
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'bc-cart-v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customer, setCustomerState] = useState<CustomerDetails | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as {
          quantities?: Record<string, number>;
          customer?: CustomerDetails | null;
          catalog?: Product[];
        };
        if (s.quantities) setQuantities(s.quantities);
        if (s.customer) setCustomerState(s.customer);
        if (s.catalog) setCatalog(s.catalog);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quantities, customer, catalog }));
    } catch {
      /* ignore quota / private mode */
    }
  }, [quantities, customer, catalog, hydrated]);

  // Stable identities so consumers' effects don't loop.
  const setQty = useCallback((productId: string, qty: number) => {
    setQuantities((q) => {
      const next = { ...q };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }, []);

  const clear = useCallback(() => setQuantities({}), []);
  const setCustomer = useCallback((c: CustomerDetails) => setCustomerState(c), []);

  const lines = useMemo<CartLine[]>(
    () =>
      catalog
        .filter((p) => (quantities[p.id] ?? 0) > 0)
        .map((p) => ({ product: p, qty: quantities[p.id] })),
    [catalog, quantities],
  );
  const itemCount = useMemo(
    () => Object.values(quantities).reduce((s, n) => s + n, 0),
    [quantities],
  );
  const depositTotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.depositAmount * l.qty, 0),
    [lines],
  );
  const estTotalTotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.estTotalAmount * l.qty, 0),
    [lines],
  );
  const estBalanceTotal = useMemo(
    () => lines.reduce((s, l) => s + estBalance(l.product) * l.qty, 0),
    [lines],
  );

  const value: CartContextValue = {
    catalog,
    setCatalog,
    quantities,
    setQty,
    clear,
    customer,
    setCustomer,
    lines,
    itemCount,
    depositTotal,
    estTotalTotal,
    estBalanceTotal,
    hydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
