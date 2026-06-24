import { NextResponse } from 'next/server';
import { requireAdmin, AdminError } from '@/lib/server/admin-auth';
import { getOrder, setOrderFields } from '@/lib/server/orders';
import { stripe } from '@/lib/stripe';
import { sendBalancePaymentLink } from '@/lib/email';
import { toCents } from '@/lib/money';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  orderId: string;
  /** The FINAL full price (AUD dollars) after weighing. Balance = this − deposit. */
  finalTotalAmount: number;
  finalWeightKg?: number;
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const { orderId, finalTotalAmount, finalWeightKg } = (await req.json()) as Body;
    if (!orderId || typeof finalTotalAmount !== 'number' || finalTotalAmount <= 0) {
      return NextResponse.json({ error: 'orderId and a positive finalTotalAmount are required.' }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    // Already settled → no-op (prevents a double charge from a retry / stale tab).
    if (order.status === 'balance_charged') {
      return NextResponse.json({
        status: 'charged',
        balanceAmount: order.balanceAmount,
        balancePiId: order.balancePiId,
        alreadyCharged: true,
      });
    }
    if (!order.stripeCustomerId || !order.stripePaymentMethodId) {
      return NextResponse.json({ error: 'No saved card on this order.' }, { status: 400 });
    }

    const balance = Math.round((finalTotalAmount - order.depositAmount) * 100) / 100;
    if (balance <= 0) {
      return NextResponse.json({ error: 'Balance must be greater than zero.' }, { status: 400 });
    }

    const common = { finalTotalAmount, ...(finalWeightKg != null ? { finalWeightKg } : {}) };

    try {
      // Charge the saved card without the customer present.
      // Idempotency key scoped to (order, amount): collapses double-clicks /
      // concurrent requests into one charge, while a corrected amount can retry.
      const pi = await stripe().paymentIntents.create(
        {
          amount: toCents(balance),
          currency: 'aud',
          customer: order.stripeCustomerId,
          payment_method: order.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          description: `Beef Cartel balance — order ${orderId.slice(0, 8)}`,
          metadata: { orderId, kind: 'balance' },
        },
        { idempotencyKey: `balance-${orderId}-${toCents(balance)}` },
      );

      await setOrderFields(orderId, {
        status: 'balance_charged',
        balanceAmount: balance,
        balancePiId: pi.id,
        ...common,
      });
      return NextResponse.json({ status: 'charged', balanceAmount: balance, balancePiId: pi.id });
    } catch (err) {
      const code = (err as { code?: string; raw?: { code?: string } })?.code ?? (err as { raw?: { code?: string } })?.raw?.code;

      if (code === 'authentication_required') {
        // SCA fallback — the card needs the customer to authenticate. Email a link.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        const price = await stripe().prices.create({
          unit_amount: toCents(balance),
          currency: 'aud',
          product_data: { name: `Beef Cartel balance — order ${orderId.slice(0, 8)}` },
        });
        const link = await stripe().paymentLinks.create({
          line_items: [{ price: price.id, quantity: 1 }],
          payment_intent_data: { metadata: { orderId, kind: 'balance' } },
          // Single-use: the customer can complete this balance payment exactly once.
          restrictions: { completed_sessions: { limit: 1 } },
          ...(appUrl
            ? { after_completion: { type: 'redirect' as const, redirect: { url: `${appUrl}/confirmation?order=${orderId}` } } }
            : {}),
        });

        await setOrderFields(orderId, {
          status: 'balance_failed',
          balanceAmount: balance,
          balancePaymentLink: link.url,
          ...common,
        });
        try {
          await sendBalancePaymentLink(order, link.url, balance);
        } catch (mailErr) {
          console.error('[charge-balance] link email failed:', (mailErr as Error).message);
        }
        return NextResponse.json({ status: 'sca_required', paymentLink: link.url, balanceAmount: balance });
      }

      console.error('[charge-balance] charge failed:', err);
      await setOrderFields(orderId, { status: 'balance_failed', balanceAmount: balance, ...common });
      return NextResponse.json(
        { status: 'failed', error: (err as Error).message || 'Charge failed' },
        { status: 402 },
      );
    }
  } catch (e) {
    if (e instanceof AdminError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[charge-balance]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
