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

/** The currently open cycle, if any. v1 cycles are managed by hand in Firestore. */
export async function getOpenCycle(): Promise<OrderCycle | null> {
  try {
    const snap = await adminDb()
      .collection('orderCycles')
      .where('status', '==', 'open')
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return toCycle(doc.id, doc.data());
  } catch (e) {
    console.warn('[cycles] open cycle lookup failed:', (e as Error).message);
    return null;
  }
}

export async function getCycle(id: string): Promise<OrderCycle | null> {
  const doc = await adminDb().collection('orderCycles').doc(id).get();
  return doc.exists ? toCycle(doc.id, doc.data()!) : null;
}
