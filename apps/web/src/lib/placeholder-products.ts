import type { Product } from './types';
import { estTotalFromPerKg, depositFromEstTotal } from './money';

/**
 * PLACEHOLDER catalogue — clearly marked, used two ways:
 *   1) the seed (script or /api/admin/seed-products) writes these into Firestore
 *      so every field becomes editable in the Firebase console;
 *   2) server reads fall back to these when Firestore has no products yet, so the
 *      UI always renders.
 *
 * Pricing is PRICE PER KG. `pricePerKg` below is from the King River wholesale
 * guide (April–June 2024) WITH Laine's +20% margin already applied — i.e. the
 * customer-facing rate. The estimated box price and deposit are derived from
 * pricePerKg × the weight range (see lib/money.ts). The real grades are MSA
 * "6/7", "8/9", "9+"; each cut is offered in all three (7 cuts × 3 = 21 boxes).
 *
 * NOTE imagery: drop a photo at apps/web/public/cuts/<slug>.jpg and set its
 * `imageUrl` to `/cuts/<slug>.jpg`. Until then BoxCard shows the brass monogram
 * fallback. One image per cut is reused across its three grades.
 * NOTE weights are placeholders and now DRIVE the estimate (est = $/kg × midpoint)
 * — set real box weights in Firebase. $/kg is editable there too (the price lever).
 */

type Grade = '6/7' | '8/9' | '9+';

interface Cut {
  slug: string;
  name: string;
  cuts: string;
  description: string;
  weightMinKg: number;
  weightMaxKg: number;
  /** Customer-facing $/kg per grade (King River +20%). */
  pricePerKg: Record<Grade, number>;
}

// Order here = display order within each grade.
const CUTS: Cut[] = [
  { slug: 'strip-loin', name: 'Strip Loin', cuts: 'Whole strip loin', description: 'The steakhouse classic — even marbling, clean fat cap, faultless on the grill.', weightMinKg: 1.2, weightMaxKg: 1.5, pricePerKg: { '6/7': 102, '8/9': 120, '9+': 126 } },
  { slug: 'cube-roll', name: 'Cube Roll', cuts: 'Whole cube roll (scotch fillet)', description: 'Ribeye / scotch fillet with the prized eye of fat. Rich, buttery, forgiving.', weightMinKg: 1.3, weightMaxKg: 1.6, pricePerKg: { '6/7': 102, '8/9': 132, '9+': 138 } },
  { slug: 'eye-fillet', name: 'Eye Fillet', cuts: 'Whole eye fillet (tenderloin)', description: 'The tenderloin — lean and astonishingly tender. Our most prized cut.', weightMinKg: 0.9, weightMaxKg: 1.2, pricePerKg: { '6/7': 114, '8/9': 138, '9+': 150 } },
  { slug: 'tomahawk', name: 'Tomahawk', cuts: 'Whole tomahawk (bone-in ribeye)', description: 'The showpiece. Bone-in ribeye with a dramatic long bone — built to impress.', weightMinKg: 1.2, weightMaxKg: 1.6, pricePerKg: { '6/7': 78, '8/9': 108, '9+': 114 } },
  { slug: 'rump-cap', name: 'Rump Cap', cuts: 'Whole rump cap (picanha)', description: 'The Brazilian churrasco icon — fat cap on. Huge flavour, huge value.', weightMinKg: 1.0, weightMaxKg: 1.3, pricePerKg: { '6/7': 54, '8/9': 60, '9+': 66 } },
  { slug: 'tri-tip', name: 'Tri Tip', cuts: 'Whole tri tip', description: 'A Santa Maria favourite — lean, beefy and quick on the grill or smoker.', weightMinKg: 1.0, weightMaxKg: 1.4, pricePerKg: { '6/7': 56.4, '8/9': 62.4, '9+': 66 } },
  { slug: 'brisket', name: 'Brisket', cuts: 'Whole brisket', description: 'Point and flat, built for low-and-slow. A full day of smoke, deep reward.', weightMinKg: 3.5, weightMaxKg: 5.0, pricePerKg: { '6/7': 21.6, '8/9': 22.8, '9+': 24 } },
];

const GRADES: { grade: Grade; key: string }[] = [
  { grade: '6/7', key: '67' },
  { grade: '8/9', key: '89' },
  { grade: '9+', key: '9plus' },
];

export const PLACEHOLDER_PRODUCTS: Product[] = CUTS.flatMap((cut, cutIndex) =>
  GRADES.map(({ grade, key }, gradeIndex) => {
    const pricePerKg = cut.pricePerKg[grade];
    const estTotalAmount = estTotalFromPerKg(pricePerKg, cut.weightMinKg, cut.weightMaxKg);
    const depositAmount = depositFromEstTotal(estTotalAmount);
    return {
      id: `${cut.slug}-${key}`,
      name: cut.name,
      description: cut.description,
      cuts: cut.cuts,
      grade,
      weightMinKg: cut.weightMinKg,
      weightMaxKg: cut.weightMaxKg,
      pricePerKg,
      depositAmount,
      estTotalAmount,
      // imageUrl: `/cuts/${cut.slug}.jpg`, // ← uncomment per cut once the photo exists
      sort: cutIndex * 10 + gradeIndex,
      active: true,
    } satisfies Product;
  }),
);
