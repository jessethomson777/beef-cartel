import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { getProductsByIds } from '@/lib/server/products';
import { getOpenCycle } from '@/lib/server/cycles';
import { writePendingOrder } from '@/lib/server/orders';
import { toCents } from '@/lib/money';
import type { OrderItem, PendingOrder } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  items: { productId: string; qty: number }[];
  customer: { name: string; email: string; phone: string; deliveryAddress: string };
  /** Client-generated id so retries of the same submission collapse to one intent. */
  requestId?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { items, customer } = body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Your order is empty.' }, { status: 400 });
  }
  if (!customer?.name || !customer?.email || !customer?.deliveryAddress) {
    return NextResponse.json({ error: 'Missing customer details.' }, { status: 400 });
  }

  try {
    // --- Recompute amounts server-side from product data. NEVER trust the client. ---
    const ids = items.map((i) => i.productId);
    const products = await getProductsByIds(ids);

    const orderItems: OrderItem[] = [];
    for (const { productId, qty } of items) {
      const p = products.get(productId);
      if (!p || !Number.isInteger(qty) || qty <= 0) continue;
      orderItems.push({
        productId,
        name: p.name,
        qty,
        unitDeposit: p.depositAmount,
        estUnitTotal: p.estTotalAmount,
      });
    }
    if (orderItems.length === 0) {
      return NextResponse.json({ error: 'No valid items in order.' }, { status: 400 });
    }

    const depositAmount = orderItems.reduce((s, i) => s + i.unitDeposit * i.qty, 0);
    if (depositAmount <= 0) {
      return NextResponse.json({ error: 'Deposit total must be positive.' }, { status: 400 });
    }

    const cycle = await getOpenCycle();
    // NOTE: if no cycle is "open", the order still records with cycleId=null.
    // Decide later whether to block checkout when there's no open cycle.

    const orderId = adminDb().collection('orders').doc().id;

    // Reuse an existing Stripe customer for this email (avoids proliferation);
    // the customer is reused later to charge the balance off-session.
    const found = await stripe().customers.list({ email: customer.email, limit: 1 });
    const stripeCustomer =
      found.data[0] ??
      (await stripe().customers.create({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || undefined,
      }));

    const intent = await stripe().paymentIntents.create(
      {
        amount: toCents(depositAmount),
        currency: 'aud',
        customer: stripeCustomer.id,
        // Vault the card so the balance can be charged later, customer not present.
        setup_future_usage: 'off_session',
        automatic_payment_methods: { enabled: true },
        receipt_email: customer.email,
        description: `Beef Cartel deposit — order ${orderId.slice(0, 8)}`,
        // Business is NOT GST-registered → no tax component; prices are final.
        metadata: { orderId, kind: 'deposit' },
      },
      body.requestId ? { idempotencyKey: `deposit-${body.requestId}` } : undefined,
    );

    const pending: PendingOrder = {
      orderId,
      cycleId: cycle?.id ?? null,
      customerName: customer.name,
      email: customer.email,
      phone: customer.phone ?? '',
      deliveryAddress: customer.deliveryAddress,
      stripeCustomerId: stripeCustomer.id,
      depositPiId: intent.id,
      depositAmount,
      items: orderItems,
      createdAt: Date.now(),
    };
    await writePendingOrder(pending);

    return NextResponse.json({
      clientSecret: intent.client_secret,
      orderId,
      depositAmount,
    });
  } catch (e) {
    console.error('[create-intent]', e);
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 500 },
    );
  }
}
