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
    const cycle = body.cycleId ? await getCycle(body.cycleId) : await getOpenCycle();
    const cycleId = cycle?.id ?? body.cycleId ?? null;

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
