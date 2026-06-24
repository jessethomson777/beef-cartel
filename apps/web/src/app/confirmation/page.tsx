import Link from 'next/link';
import { Button, ListRow, OrderTimeline, SectionHeader } from '@beef-cartel/design-system';
import { PageShell, BrandHeader } from '@/components/page-shell';
import { ClearCartOnMount } from '@/components/clear-cart-on-mount';
import { getOrder, getPendingOrder } from '@/lib/server/orders';
import { formatAUD } from '@/lib/money';
import type { OrderItem, OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order confirmed' };

// Maps a status to the active step in [Ordered, Sent to supplier, Dispatched,
// Balance charged]. Each status lights ITS OWN step as current; balance_charged
// uses 4 (out of range) so all four read as done — the terminal "complete" look.
function currentStep(status?: OrderStatus): number {
  switch (status) {
    case 'deposit_paid':
      return 0; // Ordered
    case 'sent_to_supplier':
      return 1;
    case 'dispatched':
    case 'balance_failed':
      return 2; // at/awaiting the balance step (failed shows here, not "charged")
    case 'balance_charged':
      return 4; // all steps done
    default:
      return 0; // payment still confirming
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  let items: OrderItem[] = [];
  let deposit = 0;
  let email = '';
  let status: OrderStatus | undefined;
  let confirmed = false;
  let found = false;

  if (orderId) {
    try {
      const order = await getOrder(orderId);
      if (order) {
        found = true;
        confirmed = true;
        items = order.items ?? [];
        deposit = order.depositAmount;
        email = order.email;
        status = order.status;
      }
    } catch {
      /* admin SDK unavailable locally — fall through to optimistic view */
    }
    if (!found) {
      try {
        const pending = await getPendingOrder(orderId);
        if (pending) {
          found = true;
          items = pending.items;
          deposit = pending.depositAmount;
          email = pending.email;
        }
      } catch {
        /* ignore */
      }
    }
  }

  const estBalanceTotal = items.reduce((s, i) => s + (i.estUnitTotal - i.unitDeposit) * i.qty, 0);

  return (
    <PageShell>
      <ClearCartOnMount />
      <BrandHeader />

      <div style={{ padding: 'var(--bc-space-8) var(--bc-space-4) 0' }}>
        <SectionHeader
          eyebrow={confirmed ? 'Confirmed' : 'Almost there'}
          title={confirmed ? 'Deposit received' : 'Confirming your payment'}
        />
        <p className="bc-body bc-muted" style={{ marginTop: 'var(--bc-space-4)' }}>
          {confirmed
            ? `Your boxes are reserved. A receipt is on its way${email ? ` to ${email}` : ''}.`
            : 'Hang tight — we’re confirming your deposit. Your receipt will arrive by email shortly.'}
        </p>
      </div>

      {items.length > 0 && (
        <div style={{ padding: 'var(--bc-space-5) var(--bc-space-4) 0' }}>
          <div
            style={{
              background: 'var(--bc-color-surface)',
              border: '1px solid var(--bc-color-border)',
              borderRadius: 'var(--bc-radius-lg)',
              overflow: 'hidden',
            }}
          >
            {items.map((i, idx) => (
              <ListRow
                key={i.productId}
                title={`${i.name} × ${i.qty}`}
                value={formatAUD(i.unitDeposit * i.qty)}
                divider={idx < items.length - 1}
              />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'var(--bc-space-4) var(--bc-space-2) 0',
            }}
          >
            <span className="bc-label bc-muted">Deposit paid</span>
            <span className="bc-body bc-tnum" style={{ fontWeight: 700 }}>
              {formatAUD(deposit)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--bc-space-2)' }}>
            <span className="bc-caption">Est. balance on dispatch</span>
            <span className="bc-caption bc-tnum">{formatAUD(estBalanceTotal)}</span>
          </div>
        </div>
      )}

      <div style={{ padding: 'var(--bc-space-8) var(--bc-space-4) 0' }}>
        <SectionHeader eyebrow="What happens next" title="Your order timeline" />
        <div style={{ marginTop: 'var(--bc-space-5)' }}>
          <OrderTimeline current={currentStep(status)} />
        </div>
      </div>

      <div style={{ padding: 'var(--bc-space-8) var(--bc-space-4)' }}>
        <Link href="/">
          <Button variant="secondary" fullWidth>
            Back to the catalogue
          </Button>
        </Link>
      </div>
    </PageShell>
  );
}
