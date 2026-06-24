import type { ReactNode } from 'react';
import Link from 'next/link';
import { Wordmark } from '@beef-cartel/design-system';

/** Mobile-first centred column (design target ~390px). */
export function PageShell({
  children,
  stickyBarSpace = false,
}: {
  children: ReactNode;
  stickyBarSpace?: boolean;
}) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bc-color-bg)', display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          paddingBottom: stickyBarSpace ? 132 : 'var(--bc-space-8)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Top bar: wordmark (or a back link) on the left, optional slot on the right. */
export function BrandHeader({
  right,
  back,
}: {
  right?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--bc-space-4)',
        padding: 'var(--bc-space-5) var(--bc-space-4)',
        borderBottom: '1px solid var(--bc-color-hairline)',
      }}
    >
      {back ? (
        <Link href={back.href} className="bc-label bc-accent-ink" style={{ textDecoration: 'none' }}>
          ← {back.label}
        </Link>
      ) : (
        <Link href="/" aria-label="Beef Cartel home" style={{ textDecoration: 'none' }}>
          <Wordmark size="sm" />
        </Link>
      )}
      {right}
    </header>
  );
}
