import { getActiveProducts } from '@/lib/server/products';
import { CheckoutClient } from '@/components/checkout-client';

// Fetch products server-side so checkout can resolve the cart lines on its own
// (independent of the in-memory catalogue), avoiding a false "empty cart" bounce.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const products = await getActiveProducts();
  return <CheckoutClient products={products} />;
}
