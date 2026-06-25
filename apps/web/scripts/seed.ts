/**
 * Seed placeholder products + an open cycle so you can see the app working.
 * Run from apps/web (or repo root): `npm run seed`.
 * Requires Application Default Credentials locally:
 *   gcloud auth application-default login
 * and FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) in .env.local.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { PLACEHOLDER_PRODUCTS } from '../src/lib/placeholder-products';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DAY = 86_400_000;

// Minimal .env.local loader (no dotenv dependency).
function loadEnv() {
  try {
    const txt = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env.local — rely on the real environment */
  }
}
loadEnv();

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('✗ Set FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) in apps/web/.env.local');
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({ projectId });
const db = getFirestore(app);

// Mirror api/admin/seed-products: pricePerKg + weights are seeded ONCE then
// preserved (so console edits stick); depositAmount/estTotalAmount are derived
// on read and never written.
const PRICING_KEYS = new Set(['pricePerKg', 'weightMinKg', 'weightMaxKg']);
const ALWAYS_OMIT = new Set(['id', 'depositAmount', 'estTotalAmount']);

async function main() {
  console.log(`Seeding Firestore project "${projectId}"…`);

  const existing = await db.collection('products').get();
  const existingData = new Map(existing.docs.map((d) => [d.id, d.data()]));

  const batch = db.batch();
  let created = 0;
  let refreshed = 0;
  for (const p of PLACEHOLDER_PRODUCTS) {
    const fields = Object.fromEntries(Object.entries(p).filter(([k]) => !ALWAYS_OMIT.has(k)));
    const ref = db.collection('products').doc(p.id);
    const cur = existingData.get(p.id);
    if (cur) {
      const update: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (PRICING_KEYS.has(k)) {
          if (cur[k] == null) update[k] = v; // migrate once; preserve manual edits
        } else {
          update[k] = v;
        }
      }
      batch.set(ref, update, { merge: true });
      refreshed++;
    } else {
      batch.set(ref, fields);
      created++;
    }
  }
  await batch.commit();
  console.log(`✓ products: ${created} created, ${refreshed} refreshed ($/kg seeded once, preserved if edited)`);

  const open = await db.collection('orderCycles').where('status', '==', 'open').limit(1).get();
  if (open.empty) {
    const now = new Date();
    const ref = await db.collection('orderCycles').add({
      name: `Cycle ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      opensAt: Timestamp.fromDate(now),
      closesAt: Timestamp.fromDate(new Date(now.getTime() + 14 * DAY)),
      dispatchDate: Timestamp.fromDate(new Date(now.getTime() + 21 * DAY)),
      status: 'open',
    });
    console.log(`✓ open cycle created: ${ref.id}`);
  } else {
    console.log('✓ an open cycle already exists — left as-is');
  }

  console.log('Done. Start the app with `npm run dev`.');
  process.exit(0);
}

main().catch((e) => {
  console.error('✗ Seed failed:', e);
  process.exit(1);
});
