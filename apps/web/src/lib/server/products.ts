import 'server-only';
import { adminDb } from '../firebase-admin';
import type { Product } from '../types';
import { PLACEHOLDER_PRODUCTS } from '../placeholder-products';
import { withDerivedPricing } from '../money';

/**
 * Active catalogue, server-side. Falls back to placeholders when Firestore has
 * no creds (local dev before Firebase is wired) or no products yet — so the UI
 * always renders. In production with seeded data this reads Firestore.
 */
export async function getActiveProducts(): Promise<Product[]> {
  try {
    const snap = await adminDb()
      .collection('products')
      .where('active', '==', true)
      .orderBy('sort')
      .get();
    if (snap.empty) return PLACEHOLDER_PRODUCTS;
    // Derive estTotalAmount/depositAmount from pricePerKg so $/kg is the only
    // pricing lever (and old pre-$/kg docs still render via back-compat infer).
    return snap.docs.map((d) =>
      withDerivedPricing({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }),
    );
  } catch (e) {
    console.warn('[products] falling back to placeholders:', (e as Error).message);
    return PLACEHOLDER_PRODUCTS;
  }
}

/** Look up specific products by id (server recompute, PO aggregation). */
export async function getProductsByIds(ids: string[]): Promise<Map<string, Product>> {
  const all = await getActiveProducts();
  const wanted = new Set(ids);
  const map = new Map<string, Product>();
  for (const p of all) if (wanted.has(p.id)) map.set(p.id, p);
  return map;
}
