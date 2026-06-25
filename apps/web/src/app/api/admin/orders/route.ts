import { NextResponse } from 'next/server';
import { requireAdmin, AdminError } from '@/lib/server/admin-auth';
import { getOpenCycle, getCycle, listCycles } from '@/lib/server/cycles';
import { listCycleOrders, aggregatePO, countOrdersByCycle } from '@/lib/server/orders';
import { getProductsByIds } from '@/lib/server/products';
import type { OrderCycle } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const url = new URL(req.url);
    const qpCycle = url.searchParams.get('cycleId');
    const activeCycle = await getOpenCycle();

    // Resolve the view. Modes:
    //   'all'        → every order across every cycle
    //   'unassigned' → orders with no cycle (cycleId null)
    //   'cycle'      → one concrete, resolved cycle
    // Anything that does NOT resolve to a concrete cycle (no open cycle on the
    // default load, or an unknown/deleted id) falls back to 'all' — so a
    // multi-cycle set is never mislabeled as a single cycle, and the response
    // `scope` always matches a selectable option in the UI.
    let cycle: OrderCycle | null = null;
    let mode: 'all' | 'unassigned' | 'cycle';
    if (qpCycle === 'all') {
      mode = 'all';
    } else if (qpCycle === 'unassigned') {
      mode = 'unassigned';
    } else if (qpCycle) {
      cycle = await getCycle(qpCycle);
      mode = cycle ? 'cycle' : 'all';
    } else {
      cycle = activeCycle;
      mode = cycle ? 'cycle' : 'all';
    }

    const listArg = mode === 'cycle' ? cycle!.id : mode === 'unassigned' ? 'unassigned' : null;

    const [orders, allCycles, counts] = await Promise.all([
      listCycleOrders(listArg),
      listCycles(),
      countOrdersByCycle(),
    ]);

    const ids = [...new Set(orders.flatMap((o) => (o.items ?? []).map((i) => i.productId)))];
    const products = await getProductsByIds(ids);
    const po = aggregatePO(orders, products, mode === 'cycle' ? cycle!.id : null);

    const cycles: (OrderCycle & { orderCount: number })[] = allCycles.map((c) => ({
      ...c,
      orderCount: counts[c.id] ?? 0,
    }));
    // Surface orders with no cycle as a real, selectable switcher entry so the
    // per-cycle counts reconcile with the All-cycles total and they're viewable.
    const unassignedCount = counts[''] ?? 0;
    if (unassignedCount > 0) {
      cycles.push({
        id: 'unassigned',
        name: 'Unassigned',
        status: 'draft',
        opensAt: '',
        closesAt: '',
        dispatchDate: '',
        orderCount: unassignedCount,
      });
    }

    return NextResponse.json({
      cycle,
      cycles,
      activeCycleId: activeCycle?.id ?? null,
      scope: mode,
      orders,
      po,
    });
  } catch (e) {
    if (e instanceof AdminError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[admin/orders]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
