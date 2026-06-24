import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin, AdminError } from '@/lib/server/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { PLACEHOLDER_PRODUCTS } from '@/lib/placeholder-products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

/**
 * Idempotent catalogue seed, run by an admin. Writes the placeholder products
 * into Firestore so every field is editable in the Firebase console.
 *
 * - New docs: created in full.
 * - Existing docs: DISPLAY fields are refreshed (name, cuts, grade, weights,
 *   description, image, sort, active) so re-seeding pushes copy changes — but
 *   PRICING (depositAmount, estTotalAmount) is preserved so manual price edits
 *   in the console are never clobbered.
 *
 * Also ensures one open cycle exists.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const db = adminDb();

    const existing = await db.collection('products').get();
    const have = new Set(existing.docs.map((d) => d.id));

    const batch = db.batch();
    let created = 0;
    let refreshed = 0;
    for (const p of PLACEHOLDER_PRODUCTS) {
      const { id, depositAmount, estTotalAmount, ...display } = p;
      const ref = db.collection('products').doc(id);
      if (have.has(id)) {
        // Refresh only display fields; keep console-edited prices intact.
        batch.set(ref, display, { merge: true });
        refreshed++;
      } else {
        batch.set(ref, { ...display, depositAmount, estTotalAmount });
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
