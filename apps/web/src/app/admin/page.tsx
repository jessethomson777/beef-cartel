'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import { Button, Field, Input, SectionHeader, ListRow } from '@beef-cartel/design-system';
import { PageShell, BrandHeader } from '@/components/page-shell';
import { clientAuth } from '@/lib/firebase-client';
import { formatAUD } from '@/lib/money';
import type { Order, OrderCycle, OrderStatus, PurchaseOrder } from '@/lib/types';

const EMAIL_KEY = 'bc-admin-email';

interface AdminData {
  cycle: OrderCycle | null;
  orders: Order[];
  po: PurchaseOrder;
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  deposit_paid: 'var(--bc-color-accent-text)',
  sent_to_supplier: 'var(--bc-color-accent-text)',
  dispatched: 'var(--bc-color-warning)',
  balance_charged: 'var(--bc-color-success)',
  balance_failed: 'var(--bc-color-danger)',
};

function StatusTag({ status }: { status: OrderStatus }) {
  return (
    <span className="bc-label" style={{ color: STATUS_COLOR[status] }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminPage() {
  const [phase, setPhase] = useState<'loading' | 'signed-out' | 'signed-in'>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};
    try {
      const auth = clientAuth();

      // Complete a magic-link sign-in if we arrived from the email.
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const stored = window.localStorage.getItem(EMAIL_KEY) || window.prompt('Confirm your email') || '';
        if (stored) {
          signInWithEmailLink(auth, stored, window.location.href)
            .then(() => {
              window.localStorage.removeItem(EMAIL_KEY);
              window.history.replaceState({}, '', '/admin');
            })
            .catch((e) => setAuthError(e.message));
        }
      }

      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setPhase(u ? 'signed-in' : 'signed-out');
      });
    } catch (e) {
      setAuthError((e as Error).message);
      setPhase('signed-out');
    }
    return () => unsub();
  }, []);

  return (
    <PageShell>
      <BrandHeader
        right={
          user ? (
            <button
              onClick={() => signOut(clientAuth())}
              className="bc-label bc-accent-ink"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sign out
            </button>
          ) : undefined
        }
      />
      <div style={{ padding: 'var(--bc-space-6) var(--bc-space-4) 0' }}>
        <SectionHeader eyebrow="Brother only" title="Admin" />
      </div>

      {authError && (
        <p className="bc-caption" role="alert" style={{ color: 'var(--bc-color-danger)', padding: '0 var(--bc-space-4)' }}>
          {authError}
        </p>
      )}

      {phase === 'loading' && <p className="bc-body bc-muted" style={{ padding: 'var(--bc-space-4)' }}>Loading…</p>}
      {phase === 'signed-out' && <SignIn />}
      {phase === 'signed-in' && user && <Dashboard user={user} />}
    </PageShell>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await sendSignInLinkToEmail(clientAuth(), email, {
        url: `${window.location.origin}/admin`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_KEY, email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (sent) {
    return (
      <p className="bc-body bc-muted" style={{ padding: 'var(--bc-space-4)' }}>
        Check your inbox — a one-time sign-in link is on its way to <strong>{email}</strong>.
      </p>
    );
  }

  return (
    <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-4)', padding: 'var(--bc-space-4)' }}>
      <Field label="Admin email" error={error ?? ''} helper="We’ll email you a passwordless sign-in link.">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
      </Field>
      <Button type="submit" fullWidth disabled={!email}>
        Send magic link
      </Button>
    </form>
  );
}

function Dashboard({ user }: { user: User }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [poBusy, setPoBusy] = useState(false);
  const [poMsg, setPoMsg] = useState<string | null>(null);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [seedBusy, setSeedBusy] = useState(false);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await user.getIdToken();
      return fetch(url, {
        ...init,
        headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
      });
    },
    [user],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await authedFetch('/api/admin/orders');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load orders');
      setData(json as AdminData);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const emailPO = async () => {
    setPoBusy(true);
    setPoMsg(null);
    try {
      const res = await authedFetch('/api/admin/email-po', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send PO');
      setPoMsg(`PO emailed — ${json.totalBoxes} boxes, ${json.marked} orders marked sent.`);
      load();
    } catch (e) {
      setPoMsg((e as Error).message);
    } finally {
      setPoBusy(false);
    }
  };

  const seedCatalogue = async () => {
    setSeedBusy(true);
    setSeedMsg(null);
    try {
      const res = await authedFetch('/api/admin/seed-products', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Seed failed');
      setSeedMsg(`Catalogue synced — ${json.created} added, ${json.refreshed} refreshed${json.cycleCreated ? ', open cycle created' : ''}. Names/cuts/weights updated; prices preserved. Edit further in Firebase → Firestore → products.`);
      load();
    } catch (e) {
      setSeedMsg((e as Error).message);
    } finally {
      setSeedBusy(false);
    }
  };

  if (error) {
    return (
      <p className="bc-body" role="alert" style={{ color: 'var(--bc-color-danger)', padding: 'var(--bc-space-4)' }}>
        {error}
      </p>
    );
  }
  if (!data) {
    return <p className="bc-body bc-muted" style={{ padding: 'var(--bc-space-4)' }}>Loading orders…</p>;
  }

  const { cycle, orders, po } = data;

  return (
    <div style={{ padding: 'var(--bc-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-6)' }}>
      <p className="bc-caption bc-muted">
        Cycle: <strong style={{ color: 'var(--bc-color-text)' }}>{cycle?.name ?? '— (no open cycle)'}</strong>
        {' · '}
        {po.orderCount} orders
      </p>

      {/* Catalogue sync → seeds new products and refreshes copy/weights in Firestore (prices preserved). */}
      <div>
        <Button variant="ghost" onClick={seedCatalogue} loading={seedBusy}>
          Sync catalogue to Firestore
        </Button>
        {seedMsg && (
          <p className="bc-caption" style={{ marginTop: 'var(--bc-space-2)', color: 'var(--bc-color-text-muted)' }}>
            {seedMsg}
          </p>
        )}
      </div>

      {/* Supplier PO */}
      <section
        style={{
          background: 'var(--bc-color-surface-raised)',
          border: '1px solid var(--bc-color-hairline)',
          borderRadius: 'var(--bc-radius-lg)',
          padding: 'var(--bc-space-5)',
        }}
      >
        <SectionHeader eyebrow="Aggregated" title="Supplier PO" />
        <div style={{ marginTop: 'var(--bc-space-4)' }}>
          {po.lines.length === 0 && <p className="bc-caption bc-muted">No boxes ordered yet.</p>}
          {po.lines.map((l) => (
            <div
              key={l.productId}
              style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--bc-space-2) 0', borderBottom: '1px solid var(--bc-color-border)' }}
            >
              <span className="bc-body">
                {l.name} <span className="bc-muted">({l.grade})</span>
              </span>
              <span className="bc-body bc-tnum">
                {l.qty} · {l.estWeightKg.toFixed(1)} kg
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--bc-space-3)' }}>
            <span className="bc-label">Total</span>
            <span className="bc-body bc-tnum" style={{ fontWeight: 700 }}>
              {po.totalBoxes} boxes · {po.totalEstWeightKg.toFixed(1)} kg
            </span>
          </div>
        </div>
        <div style={{ marginTop: 'var(--bc-space-5)' }}>
          <Button onClick={emailPO} loading={poBusy} disabled={po.totalBoxes === 0} fullWidth>
            Email PO to supplier
          </Button>
          {poMsg && <p className="bc-caption" style={{ marginTop: 'var(--bc-space-3)', color: 'var(--bc-color-text-muted)' }}>{poMsg}</p>}
        </div>
      </section>

      {/* Orders */}
      <section>
        <SectionHeader eyebrow={`${orders.length} orders`} title="This cycle" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bc-space-4)', marginTop: 'var(--bc-space-4)' }}>
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} authedFetch={authedFetch} onChanged={load} />
          ))}
        </div>
      </section>
    </div>
  );
}

function OrderCard({
  order,
  authedFetch,
  onChanged,
}: {
  order: Order;
  authedFetch: (url: string, init?: RequestInit) => Promise<Response>;
  onChanged: () => void;
}) {
  const [finalTotal, setFinalTotal] = useState('');
  const [weight, setWeight] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // Two-step charge: the first click previews the computed balance; the second
  // confirms and fires. Editing either input cancels a pending confirmation so a
  // stale amount can never be charged by mistake.
  const [pendingBalance, setPendingBalance] = useState<number | null>(null);

  const firstName = order.customerName.split(' ')[0] || 'this customer';

  const editTotal = (v: string) => {
    setFinalTotal(v);
    setPendingBalance(null);
    setMsg(null);
  };
  const editWeight = (v: string) => {
    setWeight(v);
    setPendingBalance(null);
  };

  const sendCharge = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await authedFetch('/api/admin/charge-balance', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          finalTotalAmount: Number(finalTotal),
          finalWeightKg: weight ? Number(weight) : undefined,
        }),
      });
      const json = await res.json();
      if (json.status === 'charged') setMsg(`Charged ${formatAUD(json.balanceAmount)} ✓`);
      else if (json.status === 'sca_required') setMsg('Card needs authentication — payment link emailed to customer.');
      else setMsg(json.error || 'Charge failed.');
      onChanged();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
      setPendingBalance(null);
    }
  };

  const onChargeClick = () => {
    // Second click on an armed confirmation → fire.
    if (pendingBalance != null) {
      void sendCharge();
      return;
    }
    // First click → validate and preview the math (no money moves yet).
    const amount = Number(finalTotal);
    if (!finalTotal.trim() || !Number.isFinite(amount) || amount <= 0) {
      setMsg('Enter the final total price.');
      return;
    }
    const balance = Math.round((amount - order.depositAmount) * 100) / 100;
    if (balance <= 0) {
      setMsg(`Final total must be more than the ${formatAUD(order.depositAmount)} deposit already paid.`);
      return;
    }
    setPendingBalance(balance);
    setMsg(
      `${formatAUD(amount)} total − ${formatAUD(order.depositAmount)} deposit = charge ${formatAUD(balance)} to ${firstName}’s card. Tap Confirm to charge.`,
    );
  };

  const done = order.status === 'balance_charged';

  return (
    <div
      style={{
        background: 'var(--bc-color-surface)',
        border: '1px solid var(--bc-color-border)',
        borderRadius: 'var(--bc-radius-lg)',
        padding: 'var(--bc-space-4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--bc-space-3)' }}>
        <div>
          <div className="bc-h4">{order.customerName}</div>
          <div className="bc-caption bc-muted">{order.email}</div>
        </div>
        <StatusTag status={order.status} />
      </div>

      <div style={{ margin: 'var(--bc-space-3) 0' }}>
        {(order.items ?? []).map((i) => (
          <ListRow key={i.productId} title={`${i.name} × ${i.qty}`} value={formatAUD(i.unitDeposit * i.qty)} divider={false} />
        ))}
      </div>
      <div className="bc-caption bc-muted">
        Pickup · Emerald{order.phone ? ` · ${order.phone}` : ''}
      </div>

      <div className="bc-caption" style={{ marginTop: 'var(--bc-space-2)' }}>
        Deposit paid: <span className="bc-tnum">{formatAUD(order.depositAmount)}</span>
        {order.balanceAmount != null && (
          <>
            {' · '}Balance: <span className="bc-tnum">{formatAUD(order.balanceAmount)}</span>
          </>
        )}
      </div>

      {!done && (
        <div style={{ display: 'flex', gap: 'var(--bc-space-3)', alignItems: 'flex-end', marginTop: 'var(--bc-space-4)' }}>
          <div style={{ flex: 1 }}>
            <Field label="Final total $">
              <Input value={finalTotal} onChange={(e) => editTotal(e.target.value)} inputMode="decimal" placeholder="0.00" />
            </Field>
          </div>
          <div style={{ width: 96 }}>
            <Field label="Weight kg">
              <Input value={weight} onChange={(e) => editWeight(e.target.value)} inputMode="decimal" placeholder="kg" />
            </Field>
          </div>
          <Button
            onClick={onChargeClick}
            loading={busy}
            variant={pendingBalance != null ? 'primary' : 'secondary'}
          >
            {pendingBalance != null ? `Confirm · ${formatAUD(pendingBalance)}` : 'Charge balance'}
          </Button>
        </div>
      )}
      {msg && <p className="bc-caption" style={{ marginTop: 'var(--bc-space-3)', color: 'var(--bc-color-text-muted)' }}>{msg}</p>}
    </div>
  );
}
