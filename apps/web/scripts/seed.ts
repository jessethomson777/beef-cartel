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

async function main() {
  console.log(`Seeding Firestore project "${projectId}"…`);

  const batch = db.batch();
  for (const p of PLACEHOLDER_PRODUCTS) {
    const { id, ...rest } = p;
    batch.set(db.collection('products').doc(id), rest, { merge: true });
  }
  await batch.commit();
  console.log(`✓ ${PLACEHOLDER_PRODUCTS.length} placeholder products written`);

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
