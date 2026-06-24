import type { Product } from './types';

/**
 * PLACEHOLDER catalogue — clearly marked, used two ways:
 *   1) the seed (script or /api/admin/seed-products) writes these into Firestore
 *      so every field becomes editable in the Firebase console;
 *   2) server reads fall back to these when Firestore has no products yet, so the
 *      UI always renders.
 *
 * The real grades are MSA "6/7", "8/9" and "9+". Each cut is offered in all three
 * grades (7 cuts × 3 grades = 21 boxes). Prices scale with grade.
 *
 * NOTE imagery: drop a photo at apps/web/public/cuts/<slug>.jpg and set its
 * `imageUrl` to `/cuts/<slug>.jpg`. Until then BoxCard shows the brass monogram
 * fallback. One image per cut is reused across its three grades.
 * NOTE prices/weights are placeholders — edit them in Firebase once seeded.
 */

type Grade = '6/7' | '8/9' | '9+';

interface Cut {
  slug: string;
  name: string;
  cuts: string;
  description: string;
  weightMinKg: number;
  weightMaxKg: number;
  /** Estimated full price (AUD) at the entry grade 6/7; higher grades scale up. */
  baseEst: number;
}

// Order here = display order within each grade.
const CUTS: Cut[] = [
  { slug: 'strip-loin', name: 'Strip Loin', cuts: 'Whole striploin · portion-ready', description: 'The steakhouse classic — even marbling, clean fat cap, faultless on the grill.', weightMinKg: 1.2, weightMaxKg: 1.5, baseEst: 220 },
  { slug: 'cube-roll', name: 'Cube Roll', cuts: 'Cube roll · scotch fillet', description: 'Ribeye / scotch fillet with the prized eye of fat. Rich, buttery, forgiving.', weightMinKg: 1.3, weightMaxKg: 1.6, baseEst: 245 },
  { slug: 'eye-fillet', name: 'Eye Fillet', cuts: 'Whole tenderloin · trimmed', description: 'The tenderloin — lean and astonishingly tender. Our most prized cut.', weightMinKg: 0.9, weightMaxKg: 1.2, baseEst: 290 },
  { slug: 'tomahawk', name: 'Tomahawk', cuts: 'Bone-in ribeye · long frenched bone', description: 'The showpiece. Bone-in ribeye with a dramatic long bone — built to impress.', weightMinKg: 1.2, weightMaxKg: 1.6, baseEst: 265 },
  { slug: 'rump-cap', name: 'Rump Cap', cuts: 'Rump cap · picanha, fat on', description: 'The Brazilian churrasco icon — fat cap on, sliced thick. Huge flavour, huge value.', weightMinKg: 1.0, weightMaxKg: 1.3, baseEst: 150 },
  { slug: 'tri-tip', name: 'Tri Tip', cuts: 'Whole tri tip', description: 'A Santa Maria favourite — lean, beefy and quick on the grill or smoker.', weightMinKg: 1.0, weightMaxKg: 1.4, baseEst: 160 },
  { slug: 'brisket', name: 'Brisket', cuts: 'Whole packer brisket', description: 'Point and flat, built for low-and-slow. A full day of smoke, deep reward.', weightMinKg: 3.5, weightMaxKg: 5.0, baseEst: 190 },
];

const GRADES: { grade: Grade; key: string; estMult: number }[] = [
  { grade: '6/7', key: '67', estMult: 1.0 },
  { grade: '8/9', key: '89', estMult: 1.45 },
  { grade: '9+', key: '9plus', estMult: 1.95 },
];

const round5 = (n: number) => Math.round(n / 5) * 5;

export const PLACEHOLDER_PRODUCTS: Product[] = CUTS.flatMap((cut, cutIndex) =>
  GRADES.map(({ grade, key, estMult }, gradeIndex) => {
    const estTotalAmount = round5(cut.baseEst * estMult);
    const depositAmount = round5(estTotalAmount * 0.3); // ~30% deposit
    return {
      id: `${cut.slug}-${key}`,
      name: cut.name,
      description: cut.description,
      cuts: cut.cuts,
      grade,
      weightMinKg: cut.weightMinKg,
      weightMaxKg: cut.weightMaxKg,
      depositAmount,
      estTotalAmount,
      // imageUrl: `/cuts/${cut.slug}.jpg`, // ← uncomment per cut once the photo exists
      sort: cutIndex * 10 + gradeIndex,
      active: true,
    } satisfies Product;
  }),
);
