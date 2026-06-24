'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BoxCard, StickyOrderBar, SectionHeader, Wordmark } from '@beef-cartel/design-system';
import { PageShell } from './page-shell';
import { useCart } from './cart-provider';
import { weightRange, estBalance } from '@/lib/money';
import type { Product } from '@/lib/types';

const GRADES = ['6/7', '8/9', '9+'] as const;
type Grade = (typeof GRADES)[number];

export function Catalogue({ products }: { products: Product[] }) {
  const router = useRouter();
  const { setCatalog, quantities, setQty, itemCount, depositTotal } = useCart();
  const [grade, setGrade] = useState<Grade>('8/9');

  // Keep the cart's catalogue snapshot in sync with what the server served.
  useEffect(() => {
    setCatalog(products);
  }, [products, setCatalog]);

  const shown = useMemo(() => products.filter((p) => p.grade === grade), [products, grade]);

  return (
    <PageShell stickyBarSpace>
      {/* Hero */}
      <section
        style={{
          textAlign: 'center',
          padding: 'var(--bc-space-10) var(--bc-space-4) var(--bc-space-8)',
          borderBottom: '1px solid var(--bc-color-hairline)',
        }}
      >
        <Wordmark size="lg" showTagline />
        <p
          className="bc-body-lg bc-muted"
          style={{ maxWidth: '32ch', margin: 'var(--bc-space-5) auto 0' }}
        >
          Wholesale Wagyu cuts, by the box — MSA 6/7 through 9+. Reserve yours with a deposit, direct from the source.
        </p>
      </section>

      <div style={{ padding: 'var(--bc-space-8) var(--bc-space-4) 0' }}>
        <SectionHeader index="01" eyebrow="Wholesale Cuts" title="Choose your grade" />
      </div>

      {/* MSA grade filter */}
      <div style={{ padding: 'var(--bc-space-5) var(--bc-space-4) 0' }}>
        <div
          role="group"
          aria-label="MSA grade"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--bc-space-2)',
            padding: 'var(--bc-space-1)',
            background: 'var(--bc-color-surface)',
            border: '1px solid var(--bc-color-border)',
            borderRadius: 'var(--bc-radius-pill)',
          }}
        >
          {GRADES.map((g) => {
            const selected = g === grade;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={selected}
                onClick={() => setGrade(g)}
                className="bc-label bc-tnum"
                style={{
                  minHeight: 44,
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 'var(--bc-radius-pill)',
                  background: selected ? 'var(--bc-color-brand)' : 'transparent',
                  color: selected ? 'var(--bc-color-on-brand)' : 'var(--bc-color-text-muted)',
                  transition: 'background var(--bc-motion-base) var(--bc-ease), color var(--bc-motion-base) var(--bc-ease)',
                }}
              >
                MSA {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards for the selected grade */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--bc-space-5)',
          padding: 'var(--bc-space-5) var(--bc-space-4)',
        }}
      >
        {shown.map((p) => (
          <BoxCard
            key={p.id}
            name={p.name}
            image={p.imageUrl}
            grade={`MSA ${p.grade}`}
            weightRange={weightRange(p)}
            cut={p.cuts}
            deposit={p.depositAmount}
            balance={estBalance(p)}
            quantity={quantities[p.id] ?? 0}
            onQuantityChange={(n) => setQty(p.id, n)}
          />
        ))}
      </div>

      <StickyOrderBar
        itemCount={itemCount}
        total={depositTotal}
        onCheckout={() => router.push('/review')}
        hideWhenEmpty
      />
    </PageShell>
  );
}
