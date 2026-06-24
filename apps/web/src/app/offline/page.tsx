import { Wordmark, SectionHeader } from '@beef-cartel/design-system';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--bc-space-6)',
        padding: 'var(--bc-space-6)',
        textAlign: 'center',
      }}
    >
      <Wordmark size="lg" />
      <SectionHeader eyebrow="No connection" title="You're offline" align="center" />
      <p className="bc-body bc-muted" style={{ maxWidth: '32ch' }}>
        The cellar door is shut for now. Reconnect and your boxes will be right where you left them.
      </p>
    </main>
  );
}
