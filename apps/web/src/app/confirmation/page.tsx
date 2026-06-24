import Link from 'next/link';
import { Button, ListRow, OrderTimeline, SectionHeader } from '@beef-cartel/design-system';
import { PageShell, BrandHeader } from '@/components/page-shell';
import { ClearCartOnMount } from '@/components/clear-cart-on-mount';
import { getOrder, getPendingOrder, finalizeOrderFromPending } from '@/lib/server/orders';
import { stripe } from '@/lib/stripe';
import { sendDepositReceipt } from '@/lib/email';
import { formatAUD } from '@/lib/money';
import { PICKUP_ADDRESS } from '@/lib/fulfilment';
import type { Order, OrderItem, OrderStatus, PendingOrder } from '@/lib/types';

const PICKUP_STEPS = [
  { label: 'Ordered' },
  { label: 'Sent to supplier' },
  { label: 'Ready at Emerald' },
  { label: 'Balance charged' },
];

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order confirmed' };

function currentStep(status?: OrderStatus): number {
  switch (status) {
    case 'deposit_paid':
      return 0;
    case 'sent_to_supplier':
      return 1;
    case 'dispatched':
    case 'balance_failed':
      return 2;
    case 'balance_charged':
      return 4;
    default:
      return 0;
  }
}

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  let order: Order | null = orderId ? await safe(getOrder(orderId)) : null;
  let pending: PendingOrder | null = null;

  // Fallback: if the webhook hasn't finalised the order yet (lag or a
  // mis-subscribed endpoint), verify the payment with Stripe and finalise it
  // here. Idempotent with the webhook; the receipt emails exactly once.
  if (!order && orderId) {
    pending = await safe(getPendingOrder(orderId));
    if (pending?.depositPiId) {
      try {
        const pi = await stripe().paymentIntents.retrieve(pending.depositPiId);
        if (pi.status === 'succeeded') {
          const pmId =
            typeof pi.payment_method === 'string' ? pi.payment_method : (pi.payment_method?.id ?? null);
          const result = await finalizeOrderFromPending(orderId, pmId);
          if (result.order) {
            order = result.order;
            if (result.created) {
              try {
                await sendDepositReceipt(result.order);
              } catch (mailErr) {
                console.error('[confirmation] receipt email failed:', (mailErr as Error).message);
              }
            }
          }
        }
      } catch (e) {
        console.error('[confirmation] finalise fallback failed:', (e as Error).message);
      }
    }
  }

  const confirmed = !!order;
  const items: OrderItem[] = order?.items ?? pending?.items ?? [];
  const deposit = order?.depositAmount ?? pending?.depositAmount ?? 0;
  const email = order?.email ?? pending?.email ?? '';
  const status = order?.status;

  const estBalanceTotal = items.reduce((s, i) => s + (i.estUnitTotal - i.unitDeposit) * i.qty, 0);

  return (
    <PageShell>
      {confirmed && <ClearCartOnMount />}
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
                subtitle={
                  i.grade
                    ? `MSA ${i.grade}${i.weightRange ? ` · ${i.weightRange}` : ''}`
                    : undefined
                }
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

      {confirmed && (
        <div style={{ padding: 'var(--bc-space-8) var(--bc-space-4) 0' }}>
          <SectionHeader eyebrow="Pickup" title="Collect from Emerald" />
          <div
            style={{
              marginTop: 'var(--bc-space-4)',
              background: 'var(--bc-color-surface-raised)',
              border: '1px solid var(--bc-color-accent)',
              borderRadius: 'var(--bc-radius-lg)',
              padding: 'var(--bc-space-5)',
            }}
          >
            <p className="bc-label bc-muted">Laine’s cold room</p>
            <p className="bc-h3" style={{ fontFamily: 'var(--bc-font-sans)', marginTop: 'var(--bc-space-2)' }}>
              {PICKUP_ADDRESS}
            </p>
            <p className="bc-caption bc-muted" style={{ marginTop: 'var(--bc-space-3)' }}>
              Pickup only — we’ll email you the moment your boxes are weighed and ready to collect.
              Please don’t come by until you’ve had that email.
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: 'var(--bc-space-8) var(--bc-space-4) 0' }}>
        <SectionHeader eyebrow="What happens next" title="Your order timeline" />
        <div style={{ marginTop: 'var(--bc-space-5)' }}>
          <OrderTimeline current={currentStep(status)} steps={PICKUP_STEPS} />
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
