import type { Product } from './types';

/**
 * PLACEHOLDER catalogue — clearly marked, used two ways:
 *   1) the seed script writes these into Firestore so you can see real data;
 *   2) server reads fall back to these when Firestore has no creds/products,
 *      so the UI always renders locally before Firebase is wired up.
 * Replace with real boxes (and imagery) once the supplier list is final.
 * NOTE: imageUrl is intentionally omitted → BoxCard renders its matte brass
 * "BC" monogram fallback, which is on-brand and offline-safe.
 */
export const PLACEHOLDER_PRODUCTS: Product[] = [
  {
    id: 'strip-loin',
    name: 'Strip Loin',
    description: 'Whole striploin, MSA-graded and grain-fed. Big, even marbling and a clean fat cap — the everyday hero cut.',
    cuts: 'Whole striploin · portion-ready',
    grade: 'MSA 7',
    weightMinKg: 1.2,
    weightMaxKg: 1.5,
    depositAmount: 60,
    estTotalAmount: 245,
    sort: 1,
    active: true,
  },
  {
    id: 'eye-fillet',
    name: 'Eye Fillet',
    description: 'The tenderloin. Lean, buttery, and absurdly tender. Our most premium box — 9+ marble score.',
    cuts: 'Whole eye fillet · trimmed',
    grade: '9+',
    weightMinKg: 0.9,
    weightMaxKg: 1.1,
    depositAmount: 90,
    estTotalAmount: 335,
    sort: 2,
    active: true,
  },
  {
    id: 'tomahawk',
    name: 'Tomahawk',
    description: 'Bone-in ribeye, dry-aged 35 days, frenched long bone. The showpiece on any grill.',
    cuts: 'Bone-in ribeye · dry-aged 35-day',
    grade: 'MSA 7',
    weightMinKg: 1.4,
    weightMaxKg: 1.8,
    depositAmount: 75,
    estTotalAmount: 285,
    sort: 3,
    active: true,
  },
  {
    id: 'whole-brisket',
    name: 'Whole Brisket',
    description: 'Packer-cut brisket, point and flat. Built for low-and-slow — a full day of smoke.',
    cuts: 'Whole packer brisket',
    grade: 'MSA 6',
    weightMinKg: 4.5,
    weightMaxKg: 6.0,
    depositAmount: 80,
    estTotalAmount: 240,
    sort: 4,
    active: true,
  },
  {
    id: 'short-rib',
    name: 'Beef Short Rib',
    description: 'Jacob’s ladder, three-bone. Deep beef flavour, made for braising or the smoker.',
    cuts: 'Three-bone short rib',
    grade: 'MSA 6',
    weightMinKg: 1.8,
    weightMaxKg: 2.4,
    depositAmount: 55,
    estTotalAmount: 185,
    sort: 5,
    active: true,
  },
  {
    id: 'picanha',
    name: 'Rump Cap · Picanha',
    description: 'The Brazilian churrasco cut — fat cap on, sliced thick. Huge value, huge flavour.',
    cuts: 'Whole rump cap · fat on',
    grade: 'MSA 6',
    weightMinKg: 1.0,
    weightMaxKg: 1.3,
    depositAmount: 45,
    estTotalAmount: 165,
    sort: 6,
    active: true,
  },
];
