import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin, AdminError } from '@/lib/server/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { PLACEHOLDER_PRODUCTS } from '@/lib/placeholder-products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

// Pricing levers: seeded once onto a doc, then PRESERVED so console edits stick.
// depositAmount/estTotalAmount are never written — they're derived from pricePerKg.
const PRICING_KEYS = new Set(['pricePerKg', 'weightMinKg', 'weightMaxKg']);

/**
 * Idempotent catalogue seed, run by an admin. Writes the placeholder products
 * into Firestore so every field is editable in the Firebase console.
 *
 * - New docs: created in full (incl. $/kg + weights).
 * - Existing docs: DISPLAY fields (name, cuts, grade, description, sort, active,
 *   image) are refreshed so re-seeding pushes copy changes. PRICING levers
 *   (pricePerKg, weights) are seeded only if ABSENT — so the first sync after the
 *   $/kg switch migrates old docs to real rates, but later manual edits in the
 *   console are never clobbered. depositAmount/estTotalAmount are derived on read
 *   and never stored.
 *
 * Also ensures one open cycle exists.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const db = adminDb();

    const existing = await db.collection('products').get();
    const existingData = new Map(existing.docs.map((d) => [d.id, d.data()]));

    const batch = db.batch();
    let created = 0;
    let refreshed = 0;
    for (const p of PLACEHOLDER_PRODUCTS) {
      const { id, depositAmount: _d, estTotalAmount: _e, ...fields } = p;
      const ref = db.collection('products').doc(id);
      const cur = existingData.get(id);
      if (cur) {
        // Refresh display fields; seed pricing levers only when absent.
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

    const open = await db.collection('orderCycles').where('status', '==', 'open').limit(1).get();
    let cycleCreated = false;
    if (open.empty) {
      const now = new Date();
      await db.collection('orderCycles').add({
        name: `Cycle ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        opensAt: Timestamp.fromDate(now),
        closesAt: Timestamp.fromDate(new Date(now.getTime() + 14 * DAY)),
        dispatchDate: Timestamp.fromDate(new Date(now.getTime() + 21 * DAY)),
        status: 'open',
      });
      cycleCreated = true;
    }

    return NextResponse.json({
      ok: true,
      created,
      refreshed,
      total: PLACEHOLDER_PRODUCTS.length,
      cycleCreated,
    });
  } catch (e) {
    if (e instanceof AdminError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[admin/seed-products]', e);
    return NextResponse.json({ error: 'Seed failed.' }, { status: 500 });
  }
}
