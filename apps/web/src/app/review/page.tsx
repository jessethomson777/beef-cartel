import { getActiveProducts } from '@/lib/server/products';
import { ReviewClient } from '@/components/review-client';

// Fetch live products so the review totals always reflect current prices
// (the cart's persisted snapshot is only a fast-paint fallback).
export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const products = await getActiveProducts();
  return <ReviewClient products={products} />;
}
