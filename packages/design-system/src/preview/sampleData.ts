/**
 * Faux catalogue used by the /preview "in context" section. Images are left
 * undefined on purpose so BoxCard's matte brass-monogram fallback renders —
 * it's offline-safe and on-brand. Drop a real URL into `image` to swap in art.
 */
export interface BeefBox {
  id: string;
  name: string;
  cut: string;
  grade: string;
  weightRange: string;
  deposit: number;
  balance: number;
  image?: string;
  soldOut?: boolean;
}

export const catalogue: BeefBox[] = [
  { id: 'strip', name: 'Strip Loin', cut: 'Grain-fed · 200-day', grade: 'MSA 7', weightRange: '1.2–1.5 kg', deposit: 60, balance: 185 },
  { id: 'fillet', name: 'Eye Fillet', cut: 'Grain-fed · 300-day', grade: '9+', weightRange: '0.9–1.1 kg', deposit: 90, balance: 245 },
  { id: 'tomahawk', name: 'Tomahawk', cut: 'Dry-aged · 35-day', grade: 'MSA 7', weightRange: '1.4–1.8 kg', deposit: 75, balance: 210 },
  { id: 'brisket', name: 'Whole Brisket', cut: 'Grain-fed · 200-day', grade: 'MSA 6', weightRange: '4.5–6.0 kg', deposit: 80, balance: 160 },
  { id: 'shortrib', name: 'Beef Short Rib', cut: 'Grain-fed · 200-day', grade: 'MSA 6', weightRange: '1.8–2.4 kg', deposit: 55, balance: 130, soldOut: true },
  { id: 'picanha', name: 'Rump Cap · Picanha', cut: 'Grass-fed · select', grade: 'MSA 6', weightRange: '1.0–1.3 kg', deposit: 45, balance: 120 },
];

export const initialCart: Record<string, number> = {
  strip: 1,
  tomahawk: 2,
};
