import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { finalizeOrderFromPending, setOrderFields, getOrder } from '@/lib/server/orders';
import { sendDepositReceipt } from '@/lib/email';
import { fromCents } from '@/lib/money';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature') ?? '';
  const raw = await req.text(); // raw body required for signature verification

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    console.error('[webhook] signature verification failed:', (e as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;

      if (pi.metadata?.kind === 'deposit' && orderId) {
        // Deposit succeeded → promote the staged order and email the receipt.
        const paymentMethodId =
          typeof pi.payment_method === 'string' ? pi.payment_method : (pi.payment_method?.id ?? null);
        const { order, created } = await finalizeOrderFromPending(orderId, paymentMethodId);
        if (created && order) {
          try {
            await sendDepositReceipt(order);
          } catch (mailErr) {
            // Don't fail the webhook over a receipt — the order is already saved.
            console.error('[webhook] receipt email failed:', (mailErr as Error).message);
          }
        }
      } else if (pi.metadata?.kind === 'balance' && orderId) {
        // Balance paid via the SCA fallback payment link → mark it charged once.
        const existing = await getOrder(orderId);
        if (existing && existing.status !== 'balance_charged') {
          await setOrderFields(orderId, {
            status: 'balance_charged',
            balanceAmount: fromCents(pi.amount),
            balancePiId: pi.id,
          });
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('[webhook] handler error:', e);
    // 500 → Stripe retries; finalize is idempotent so retries are safe.
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}
