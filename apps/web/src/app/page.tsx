import { getActiveProducts } from '@/lib/server/products';
import { Catalogue } from '@/components/catalogue';

// Render per-request so the catalogue is always fresh (and the build never makes
// a Firestore call). NOTE: switch to ISR (export const revalidate = 300) if you
// want CDN caching once traffic grows.
export const dynamic = 'force-dynamic';

// Catalogue is fetched server-side (SSR), then hydrated for the cart interaction.
export default async function HomePage() {
  const products = await getActiveProducts();
  return <Catalogue products={products} />;
}
