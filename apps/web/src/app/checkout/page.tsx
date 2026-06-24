'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { Appearance } from '@stripe/stripe-js';
import { Button, SectionHeader } from '@beef-cartel/design-system';
import { PageShell, BrandHeader } from '@/components/page-shell';
import { useCart } from '@/components/cart-provider';
import { getStripe } from '@/lib/stripe-client';
import { createDepositIntent } from '@/lib/api-client';
import { formatAUD } from '@/lib/money';

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

function CheckoutForm({ orderId, depositAmount }: { orderId: string; depositAmount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation?order=${orderId}`,
      },
    });
    // If we get here, confirmation failed (success redirects to return_url).
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

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, customer, hydrated } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  // Stable per-attempt id so a retried create-intent collapses to one PaymentIntent.
  const requestId = useRef<string>('');
  if (!requestId.current) {
    requestId.current =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Math.round(performance.now()));
  }

  useEffect(() => {
    if (!hydrated || started.current) return;
    if (lines.length === 0 || !customer) {
      router.replace('/review');
      return;
    }
    started.current = true;
    createDepositIntent({
      items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
      customer,
      requestId: requestId.current,
    })
      .then((r) => {
        setClientSecret(r.clientSecret);
        setOrderId(r.orderId);
        setDepositAmount(r.depositAmount);
      })
      .catch((e) => setError(e.message));
  }, [hydrated, lines, customer, router]);

  return (
    <PageShell>
      <BrandHeader back={{ href: '/review', label: 'Review' }} />
      <div style={{ padding: 'var(--bc-space-6) var(--bc-space-4) 0' }}>
        <SectionHeader index="03" eyebrow="Payment" title="Pay your deposit" />
      </div>

      <div style={{ padding: 'var(--bc-space-5) var(--bc-space-4)' }}>
        {error && (
          <p className="bc-body" role="alert" style={{ color: 'var(--bc-color-danger)' }}>
            {error}
          </p>
        )}

        {!error && !clientSecret && (
          <p className="bc-body bc-muted">Preparing secure checkout…</p>
        )}

        {clientSecret && orderId && (
          <Elements stripe={getStripe()} options={{ clientSecret, appearance }}>
            <CheckoutForm orderId={orderId} depositAmount={depositAmount} />
          </Elements>
        )}
      </div>
    </PageShell>
  );
}
