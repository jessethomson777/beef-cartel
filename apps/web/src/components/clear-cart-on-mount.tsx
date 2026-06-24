'use client';

import { useEffect } from 'react';
import { useCart } from './cart-provider';

/** Clears the cart once the order is confirmed (keeps saved customer details). */
export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
