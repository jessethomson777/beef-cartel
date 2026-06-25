import { NextResponse } from 'next/server';
import { requireAdmin, AdminError } from '@/lib/server/admin-auth';
import { getOpenCycle, getCycle } from '@/lib/server/cycles';
import { listCycleOrders, aggregatePO, markCycleSentToSupplier } from '@/lib/server/orders';
import { getProductsByIds } from '@/lib/server/products';
import { sendSupplierPO } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const body = (await req.json().catch(() => ({}))) as { cycleId?: string };
    const requested = body.cycleId;
    // A PO is always sent for ONE concrete cycle. 'all'/'unassigned' aren't
    // PO-able; a missing id falls back to the open cycle. If nothing resolves to
    // a real cycle, reject — never let a null cycleId fan out to every order
    // (which would mark the whole database sent_to_supplier).
    const cycle =
      requested && requested !== 'all' && requested !== 'unassigned'
        ? await getCycle(requested)
        : requested
          ? null
          : await getOpenCycle();
    const cycleId = cycle?.id ?? null;
    if (!cycleId) {
      return NextResponse.json(
        { error: 'Pick a specific cycle to email its PO — no cycle resolved.' },
        { status: 400 },
      );
    }

    const orders = await listCycleOrders(cycleId);
    if (orders.length === 0) {
      return NextResponse.json({ error: 'No orders in this cycle to send.' }, { status: 400 });
    }

    const ids = [...new Set(orders.flatMap((o) => (o.items ?? []).map((i) => i.productId)))];
    const products = await getProductsByIds(ids);
    const po = aggregatePO(orders, products, cycleId);

    await sendSupplierPO(po, cycle?.name ?? 'Current cycle');
    const marked = await markCycleSentToSupplier(cycleId);

    return NextResponse.json({ ok: true, totalBoxes: po.totalBoxes, orderCount: po.orderCount, marked });
  } catch (e) {
    if (e instanceof AdminError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[admin/email-po]', e);
    return NextResponse.json({ error: 'Could not send PO.' }, { status: 500 });
  }
}
