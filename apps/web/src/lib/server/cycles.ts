import 'server-only';
import { adminDb } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { OrderCycle, OrderCycleStatus } from '../types';

function iso(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  return '';
}

function toCycle(id: string, d: FirebaseFirestore.DocumentData): OrderCycle {
  return {
    id,
    name: d.name ?? '',
    opensAt: iso(d.opensAt),
    closesAt: iso(d.closesAt),
    dispatchDate: iso(d.dispatchDate),
    status: (d.status ?? 'draft') as OrderCycleStatus,
  };
}

/** Dispatch date as epoch ms (Infinity if unset) — the sort key for "soonest out the door". */
function dispatchMillis(d: FirebaseFirestore.DocumentData): number {
  const v = d.dispatchDate;
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isNaN(t) ? Infinity : t;
  }
  return Infinity;
}

/**
 * The cycle NEW ORDERS attach to. Among all `open` cycles, the one dispatching
 * SOONEST wins — deterministic, and matches intuition (you take orders for the
 * next batch out the door). Returns null if none are open. To stop a cycle
 * taking new orders, set its status to `closed` in Firestore.
 *
 * NOTE: fetches all open cycles and sorts in memory (there are only a handful)
 * to avoid needing a composite Firestore index for where+orderBy.
 */
export async function getOpenCycle(): Promise<OrderCycle | null> {
  try {
    const snap = await adminDb().collection('orderCycles').where('status', '==', 'open').get();
    if (snap.empty) return null;
    const doc = [...snap.docs].sort((a, b) => dispatchMillis(a.data()) - dispatchMillis(b.data()))[0];
    return toCycle(doc.id, doc.data());
  } catch (e) {
    console.warn('[cycles] open cycle lookup failed:', (e as Error).message);
    return null;
  }
}

/**
 * Every cycle, for the admin switcher. Ordered: open cycles first (soonest
 * dispatch first — the active one leads), then closed/dispatched by most recent
 * dispatch. Returns [] on error so the admin page still renders.
 */
export async function listCycles(): Promise<OrderCycle[]> {
  try {
    const snap = await adminDb().collection('orderCycles').get();
    return snap.docs
      .map((d) => ({ cycle: toCycle(d.id, d.data()), dm: dispatchMillis(d.data()) }))
      .sort((a, b) => {
        const ao = a.cycle.status === 'open' ? 0 : 1;
        const bo = b.cycle.status === 'open' ? 0 : 1;
        if (ao !== bo) return ao - bo; // open cycles first
        return ao === 0 ? a.dm - b.dm : b.dm - a.dm; // open: soonest first · rest: newest first
      })
      .map((x) => x.cycle);
  } catch (e) {
    console.warn('[cycles] list failed:', (e as Error).message);
    return [];
  }
}

export async function getCycle(id: string): Promise<OrderCycle | null> {
  const doc = await adminDb().collection('orderCycles').doc(id).get();
  return doc.exists ? toCycle(doc.id, doc.data()!) : null;
}
