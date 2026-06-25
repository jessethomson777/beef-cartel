import 'server-only';
import { adminDb } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type {
  Order,
  OrderItem,
  OrderStatus,
  PendingOrder,
  Product,
  PurchaseOrder,
  POLine,
} from '../types';
import { estWeightKg } from '../money';

const db = () => adminDb();
const millis = (v: unknown): number => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : 0);

/* ---- Pending (pre-payment staging) --------------------------------------- */

export async function writePendingOrder(p: PendingOrder): Promise<void> {
  await db()
    .collection('pendingOrders')
    .doc(p.orderId)
    .set({ ...p, createdAt: Timestamp.fromMillis(p.createdAt) });
}

export async function getPendingOrder(orderId: string): Promise<PendingOrder | null> {
  const doc = await db().collection('pendingOrders').doc(orderId).get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  return {
    orderId,
    cycleId: d.cycleId ?? null,
    customerName: d.customerName,
    email: d.email,
    phone: d.phone,
    deliveryAddress: d.deliveryAddress,
    stripeCustomerId: d.stripeCustomerId,
    depositPiId: d.depositPiId,
    depositAmount: d.depositAmount,
    items: (d.items ?? []) as OrderItem[],
    createdAt: millis(d.createdAt) || Date.now(),
  };
}

/* ---- Orders -------------------------------------------------------------- */

function toOrder(id: string, d: FirebaseFirestore.DocumentData, items?: OrderItem[]): Order {
  return {
    id,
    cycleId: d.cycleId ?? null,
    customerName: d.customerName,
    email: d.email,
    phone: d.phone,
    deliveryAddress: d.deliveryAddress,
    stripeCustomerId: d.stripeCustomerId,
    stripePaymentMethodId: d.stripePaymentMethodId ?? null,
    depositAmount: d.depositAmount,
    depositPiId: d.depositPiId,
    balanceAmount: d.balanceAmount ?? null,
    balancePiId: d.balancePiId ?? null,
    balancePaymentLink: d.balancePaymentLink ?? null,
    status: (d.status ?? 'deposit_paid') as OrderStatus,
    createdAt: millis(d.createdAt),
    items,
    finalTotalAmount: d.finalTotalAmount ?? undefined,
    finalWeightKg: d.finalWeightKg ?? undefined,
    lineWeights: d.lineWeights ?? undefined,
  };
}

async function readItems(orderId: string): Promise<OrderItem[]> {
  const snap = await db().collection('orders').doc(orderId).collection('items').get();
  return snap.docs.map((d) => d.data() as OrderItem);
}

/**
 * Promote a pending order to a real order once the deposit succeeds.
 * Idempotent: a duplicate webhook delivery is a no-op.
 */
export async function finalizeOrderFromPending(
  orderId: string,
  paymentMethodId: string | null,
): Promise<{ order: Order | null; created: boolean }> {
  const orderRef = db().collection('orders').doc(orderId);
  const pendingRef = db().collection('pendingOrders').doc(orderId);

  // Atomic: a duplicate/concurrent webhook delivery can't double-create the order.
  const outcome = await db().runTransaction(async (tx) => {
    const existing = await tx.get(orderRef);
    if (existing.exists) return { kind: 'existed' as const };

    const pendingSnap = await tx.get(pendingRef);
    if (!pendingSnap.exists) return { kind: 'missing' as const };

    const d = pendingSnap.data()!;
    const items = (d.items ?? []) as OrderItem[];
    const createdAtMs = millis(d.createdAt) || Date.now();
    const data = {
      cycleId: d.cycleId ?? null,
      customerName: d.customerName,
      email: d.email,
      phone: d.phone,
      deliveryAddress: d.deliveryAddress,
      stripeCustomerId: d.stripeCustomerId,
      stripePaymentMethodId: paymentMethodId,
      depositAmount: d.depositAmount,
      depositPiId: d.depositPiId,
      balanceAmount: null,
      balancePiId: null,
      status: 'deposit_paid' as OrderStatus,
      createdAt: Timestamp.fromMillis(createdAtMs),
    };

    tx.set(orderRef, data);
    for (const item of items) {
      tx.set(orderRef.collection('items').doc(item.productId), item);
    }
    tx.delete(pendingRef);

    const order: Order = { id: orderId, ...data, createdAt: createdAtMs, items };
    return { kind: 'created' as const, order };
  });

  if (outcome.kind === 'existed') return { order: await getOrder(orderId), created: false };
  if (outcome.kind === 'missing') return { order: null, created: false };
  return { order: outcome.order, created: true };
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const doc = await db().collection('orders').doc(orderId).get();
  if (!doc.exists) return null;
  return toOrder(orderId, doc.data()!, await readItems(orderId));
}

/**
 * Orders for a view. `null` → every order; a cycle id → that cycle; the literal
 * `'unassigned'` → orders with no cycle (cycleId null, e.g. placed when nothing
 * was open).
 */
export async function listCycleOrders(cycleId: string | null): Promise<Order[]> {
  const col = db().collection('orders');
  const snap =
    cycleId === 'unassigned'
      ? await col.where('cycleId', '==', null).get()
      : cycleId
        ? await col.where('cycleId', '==', cycleId).get()
        : await col.get();
  const orders = await Promise.all(
    snap.docs.map(async (d) => toOrder(d.id, d.data(), await readItems(d.id))),
  );
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Order counts grouped by cycleId, for the admin switcher. Unassigned orders
 * (cycleId null) bucket under the '' key. Cheap: reads the orders collection
 * once and skips the item subcollections.
 */
export async function countOrdersByCycle(): Promise<Record<string, number>> {
  const snap = await db().collection('orders').get();
  const counts: Record<string, number> = {};
  for (const d of snap.docs) {
    const key = (d.data().cycleId as string | null) ?? '';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export async function setOrderFields(
  orderId: string,
  fields: Partial<Order> & Record<string, unknown>,
): Promise<void> {
  await db().collection('orders').doc(orderId).update(fields);
}

/** Mark every deposit_paid order in a cycle as sent_to_supplier (after PO email). */
export async function markCycleSentToSupplier(cycleId: string | null): Promise<number> {
  const orders = await listCycleOrders(cycleId);
  const batch = db().batch();
  let n = 0;
  for (const o of orders) {
    if (o.status === 'deposit_paid') {
      batch.update(db().collection('orders').doc(o.id), { status: 'sent_to_supplier' });
      n++;
    }
  }
  if (n > 0) await batch.commit();
  return n;
}

/* ---- Supplier PO aggregation --------------------------------------------- */

export function aggregatePO(
  orders: Order[],
  products: Map<string, Product>,
  cycleId: string | null,
): PurchaseOrder {
  const byProduct = new Map<string, POLine>();
  for (const o of orders) {
    for (const it of o.items ?? []) {
      const prod = products.get(it.productId);
      const w = prod ? estWeightKg(prod) : 0;
      const cur = byProduct.get(it.productId);
      if (cur) {
        cur.qty += it.qty;
        cur.estWeightKg += w * it.qty;
      } else {
        byProduct.set(it.productId, {
          productId: it.productId,
          name: it.name,
          grade: prod?.grade ?? '',
          qty: it.qty,
          estWeightKg: w * it.qty,
        });
      }
    }
  }
  const lines = [...byProduct.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    cycleId,
    lines,
    totalBoxes: lines.reduce((s, l) => s + l.qty, 0),
    totalEstWeightKg: lines.reduce((s, l) => s + l.estWeightKg, 0),
    orderCount: orders.length,
  };
}
