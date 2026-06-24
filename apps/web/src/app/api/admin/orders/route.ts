import { NextResponse } from 'next/server';
import { requireAdmin, AdminError } from '@/lib/server/admin-auth';
import { getOpenCycle, getCycle } from '@/lib/server/cycles';
import { listCycleOrders, aggregatePO } from '@/lib/server/orders';
import { getProductsByIds } from '@/lib/server/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const url = new URL(req.url);
    const qpCycle = url.searchParams.get('cycleId');
    const cycle = qpCycle ? await getCycle(qpCycle) : await getOpenCycle();
    const cycleId = cycle?.id ?? qpCycle ?? null;

    const orders = await listCycleOrders(cycleId);
    const ids = [...new Set(orders.flatMap((o) => (o.items ?? []).map((i) => i.productId)))];
    const products = await getProductsByIds(ids);
    const po = aggregatePO(orders, products, cycleId);

    return NextResponse.json({ cycle, orders, po });
  } catch (e) {
    if (e instanceof AdminError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[admin/orders]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
