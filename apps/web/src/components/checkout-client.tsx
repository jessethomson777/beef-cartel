'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Appearance, StripeElementsOptions } from '@stripe/stripe-js';
import { Button, SectionHeader } from '@beef-cartel/design-system';
import { PageShell, BrandHeader } from '@/components/page-shell';
import { useCart } from '@/components/cart-provider';
import { getStripe } from '@/lib/stripe-client';
import { createDepositIntent } from '@/lib/api-client';
import { formatAUD, toCents } from '@/lib/money';
import type { CustomerDetails, Product } from '@/lib/types';

// Stripe Elements themed to the Beef Cartel palette.
const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#7B1E1E',
    colorBackground: '#1C1814',
    colorText: '#F4EFE6',
    colorTextSecondary: '#B8AC98',
    colorDanger: '#E2674B',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '10px',
    spacingUnit: '4px',
  },
};

// Stable singleton so <Elements> never re-initialises on re-render.
const stripePromise = getStripe();

interface CheckoutFormProps {
  items: { productId: string; qty: number }[];
  customer: CustomerDetails;
  requestId: string;
  depositAmount: number;
}

function CheckoutForm({ items, customer, requestId, depositAmount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setMessage(submitError.message ?? 'Please check your card details.');
      setSubmitting(false);
      return;
    }

    // Only NOW create the PaymentIntent + order (deferred) — server recomputes the amount.
    let clientSecret: string;
    let orderId: string;
    try {
      const r = await createDepositIntent({ items, customer, requestId });
      clientSecret = r.clientSecret;
      orderId = r.orderId;
    } catch (err) {
      setMessage((err as Error).message);
      setSubmitting(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: `${window.location.origin}/confirmation?order=${orderId}` },
    });
    setMessage(error.message ?? 'Payment could not be completed. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-5)' }}>
      <PaymentElement />
      {message && (
        <p className="bc-caption" role="alert" style={{ color: 'var(--bc-color-danger)' }}>
          {message}
        </p>
      )}
      <Button type="submit" size="large" fullWidth loading={submitting} disabled={!stripe}>
        Pay deposit · {formatAUD(depositAmount)}
      </Button>
      <p className="bc-caption" style={{ color: 'var(--bc-color-text-faint)', textAlign: 'center' }}>
        Secured by Stripe. Your card is saved to charge the balance at dispatch.
      </p>
    </form>
  );
}

export function CheckoutClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const { setCatalog, quantities, customer, hydrated } = useCart();

  // Keep the provider's catalogue fresh too (for the sticky bar elsewhere).
  useEffect(() => {
    setCatalog(products);
  }, [products, setCatalog]);

  // Compute the order from the SERVER products + cart quantities directly, so the
  // checkout never depends on the provider's in-memory catalogue surviving navigation.
  const lines = useMemo(
    () => products.filter((p) => (quantities[p.id] ?? 0) > 0).map((p) => ({ product: p, qty: quantities[p.id] })),
    [products, quantities],
  );
  const depositTotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.depositAmount * l.qty, 0),
    [lines],
  );
  const items = useMemo(() => lines.map((l) => ({ productId: l.product.id, qty: l.qty })), [lines]);

  // Stable per-attempt id so a double-click / retry collapses to one PaymentIntent.
  const requestId = useRef<string>('');
  if (!requestId.current) {
    requestId.current =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Math.round(performance.now()));
  }

  // Only bounce to /review once we're hydrated AND genuinely have no order / details.
  useEffect(() => {
    if (hydrated && (lines.length === 0 || !customer)) router.replace('/review');
  }, [hydrated, lines.length, customer, router]);

  const options = useMemo<StripeElementsOptions>(
    () => ({
      mode: 'payment',
      amount: toCents(depositTotal || 1),
      currency: 'aud',
      setupFutureUsage: 'off_session',
      appearance,
    }),
    [depositTotal],
  );

  return (
    <PageShell>
      <BrandHeader back={{ href: '/review', label: 'Review' }} />
      <div style={{ padding: 'var(--bc-space-6) var(--bc-space-4) 0' }}>
        <SectionHeader index="03" eyebrow="Payment" title="Pay your deposit" />
      </div>

      <div style={{ padding: 'var(--bc-space-5) var(--bc-space-4)' }}>
        {hydrated && lines.length > 0 && customer && depositTotal > 0 ? (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              items={items}
              customer={customer}
              requestId={requestId.current}
              depositAmount={depositTotal}
            />
          </Elements>
        ) : (
          <p className="bc-body bc-muted">Preparing secure checkout…</p>
        )}
      </div>
    </PageShell>
  );
}
