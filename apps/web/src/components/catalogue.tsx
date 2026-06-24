'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BoxCard, StickyOrderBar, SectionHeader, Wordmark, GradeBadge } from '@beef-cartel/design-system';
import { PageShell } from './page-shell';
import { useCart } from './cart-provider';
import { weightRange, estBalance } from '@/lib/money';
import type { Product } from '@/lib/types';

export function Catalogue({ products }: { products: Product[] }) {
  const router = useRouter();
  const { setCatalog, quantities, setQty, itemCount, depositTotal } = useCart();

  // Keep the cart's catalogue snapshot in sync with what the server served.
  useEffect(() => {
    setCatalog(products);
  }, [products, setCatalog]);

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
          style={{ maxWidth: '30ch', margin: 'var(--bc-space-5) auto 0' }}
        >
          Premium boxed beef, reserved on deposit. MSA 6/7+, weighed and dispatched at peak.
        </p>
        <div style={{ display: 'inline-flex', gap: 'var(--bc-space-2)', marginTop: 'var(--bc-space-5)' }}>
          <GradeBadge grade="MSA 6" />
          <GradeBadge grade="MSA 7" />
          <GradeBadge grade="9+" variant="solid" />
        </div>
      </section>

      <div style={{ padding: 'var(--bc-space-8) var(--bc-space-4) 0' }}>
        <SectionHeader index="01" eyebrow="The Cuts" title="This month’s boxes" />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--bc-space-5)',
          padding: 'var(--bc-space-5) var(--bc-space-4)',
        }}
      >
        {products.map((p) => (
          <BoxCard
            key={p.id}
            name={p.name}
            image={p.imageUrl}
            grade={p.grade}
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
