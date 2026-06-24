import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin, AdminError } from '@/lib/server/admin-auth';
import { adminDb } from '@/lib/firebase-admin';
import { PLACEHOLDER_PRODUCTS } from '@/lib/placeholder-products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

/**
 * One-time (idempotent) catalogue seed, run by an admin. Writes the placeholder
 * products into Firestore so every field becomes editable in the Firebase
 * console. Create-if-absent: existing docs are left untouched, so it never
 * clobbers manual edits on a re-run. Also ensures one open cycle exists.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const db = adminDb();

    const existing = await db.collection('products').get();
    const have = new Set(existing.docs.map((d) => d.id));

    const batch = db.batch();
    let created = 0;
    for (const p of PLACEHOLDER_PRODUCTS) {
      if (have.has(p.id)) continue;
      const { id, ...rest } = p;
      batch.set(db.collection('products').doc(id), rest);
      created++;
    }
    if (created > 0) await batch.commit();

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
      skipped: PLACEHOLDER_PRODUCTS.length - created,
      total: PLACEHOLDER_PRODUCTS.length,
      cycleCreated,
    });
  } catch (e) {
    if (e instanceof AdminError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[admin/seed-products]', e);
    return NextResponse.json({ error: 'Seed failed.' }, { status: 500 });
  }
}
