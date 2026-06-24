'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, ListRow, Field, Input, SectionHeader } from '@beef-cartel/design-system';
import { PageShell, BrandHeader } from '@/components/page-shell';
import { useCart } from '@/components/cart-provider';
import { formatAUD, estBalance, weightRange } from '@/lib/money';
import type { CustomerDetails, Product } from '@/lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ReviewClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const { setCatalog, lines, depositTotal, estBalanceTotal, customer, setCustomer, hydrated } = useCart();

  // Refresh the catalogue to live, server-served prices (never trust a stale snapshot).
  useEffect(() => {
    setCatalog(products);
  }, [products, setCatalog]);

  const [form, setForm] = useState<CustomerDetails>(
    customer ?? { name: '', email: '', phone: '', deliveryAddress: '' },
  );
  const [touched, setTouched] = useState(false);

  const errors = {
    name: !form.name.trim() ? 'Enter your name.' : '',
    email: !EMAIL_RE.test(form.email) ? 'Enter a valid email.' : '',
    deliveryAddress: !form.deliveryAddress.trim() ? 'Enter a delivery address.' : '',
  };
  const valid = !errors.name && !errors.email && !errors.deliveryAddress;

  const set = (k: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onContinue = () => {
    setTouched(true);
    if (!valid) return;
    setCustomer(form);
    router.push('/checkout');
  };

  if (hydrated && lines.length === 0) {
    return (
      <PageShell>
        <BrandHeader back={{ href: '/', label: 'Catalogue' }} />
        <div style={{ padding: 'var(--bc-space-10) var(--bc-space-4)', textAlign: 'center' }}>
          <SectionHeader eyebrow="Your order" title="Nothing reserved yet" align="center" />
          <p className="bc-body bc-muted" style={{ margin: 'var(--bc-space-5) 0' }}>
            Add a box or two from the catalogue to get started.
          </p>
          <Link href="/">
            <Button variant="secondary">Browse the cuts</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell stickyBarSpace>
      <BrandHeader back={{ href: '/', label: 'Catalogue' }} />

      <div style={{ padding: 'var(--bc-space-6) var(--bc-space-4) 0' }}>
        <SectionHeader index="02" eyebrow="Review" title="Your order" />
      </div>

      {/* Line items */}
      <div style={{ padding: 'var(--bc-space-4)' }}>
        <div
          style={{
            background: 'var(--bc-color-surface)',
            border: '1px solid var(--bc-color-border)',
            borderRadius: 'var(--bc-radius-lg)',
            overflow: 'hidden',
          }}
        >
          {lines.map((l, i) => (
            <ListRow
              key={l.product.id}
              title={`${l.product.name} × ${l.qty}`}
              subtitle={`${l.product.grade} · ${weightRange(l.product)}`}
              value={formatAUD(l.product.depositAmount * l.qty)}
              divider={i < lines.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Totals + caveat */}
      <div style={{ padding: '0 var(--bc-space-4)' }}>
        <div
          style={{
            background: 'var(--bc-color-surface-raised)',
            border: '1px solid var(--bc-color-hairline)',
            borderRadius: 'var(--bc-radius-lg)',
            padding: 'var(--bc-space-5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="bc-label bc-muted">Deposit today</span>
            <span className="bc-h3 bc-tnum" style={{ fontFamily: 'var(--bc-font-sans)', fontWeight: 700 }}>
              {formatAUD(depositTotal)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'var(--bc-space-2)',
              color: 'var(--bc-color-text-muted)',
            }}
          >
            <span className="bc-caption">Est. balance on dispatch</span>
            <span className="bc-caption bc-tnum">{formatAUD(estBalanceTotal)}</span>
          </div>
          <p className="bc-caption" style={{ color: 'var(--bc-color-text-faint)', marginTop: 'var(--bc-space-3)' }}>
            <span style={{ color: 'var(--bc-color-accent)' }}>*</span> Final price is billed by the
            actual weight of your box at dispatch. We save your card today and charge the balance then.
          </p>
        </div>
      </div>

      {/* Customer details */}
      <div style={{ padding: 'var(--bc-space-6) var(--bc-space-4) 0' }}>
        <SectionHeader eyebrow="Delivery" title="Your details" />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onContinue();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-4)', padding: 'var(--bc-space-4)' }}
      >
        <Field label="Full name" required error={touched ? errors.name : ''}>
          <Input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Jane Smith" />
        </Field>
        <Field label="Email" required error={touched ? errors.email : ''} helper="Receipts and dispatch updates go here.">
          <Input value={form.email} onChange={set('email')} type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={set('phone')} type="tel" autoComplete="tel" placeholder="04xx xxx xxx" />
        </Field>
        <Field label="Delivery address" required error={touched ? errors.deliveryAddress : ''}>
          <Input
            value={form.deliveryAddress}
            onChange={set('deliveryAddress')}
            autoComplete="street-address"
            placeholder="Street, suburb, state, postcode"
          />
        </Field>

        <Button type="submit" size="large" fullWidth>
          Continue to payment · {formatAUD(depositTotal)}
        </Button>
      </form>
    </PageShell>
  );
}
