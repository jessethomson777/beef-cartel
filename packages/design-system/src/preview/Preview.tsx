import './Preview.css';
import { useState } from 'react';
import { tokens } from '../theme';
import {
  Button,
  Wordmark,
  GradeBadge,
  QuantityStepper,
  PriceBlock,
  BoxCard,
  StickyOrderBar,
  ListRow,
  Field,
  Input,
  OrderTimeline,
  SectionHeader,
} from '../components';
import { catalogue, initialCart } from './sampleData';

/* Pick legible ink for a swatch/ramp chip from its background luminance. */
function readableInk(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return tokens.color.text;
  const ch = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(ch[0]) + 0.7152 * lin(ch[1]) + 0.0722 * lin(ch[2]);
  return L > 0.4 ? '#0E0C0A' : '#F4EFE6';
}

/* ---- Colour ---------------------------------------------------------------- */
const ROLE_SWATCHES: Array<[string, keyof typeof tokens.color]> = [
  ['Background', 'bg'],
  ['Surface', 'surface'],
  ['Surface raised', 'surfaceRaised'],
  ['Surface hover', 'surfaceHover'],
  ['Border', 'border'],
  ['Text', 'text'],
  ['Text muted', 'textMuted'],
  ['Text faint', 'textFaint'],
  ['Brand · oxblood', 'brand'],
  ['Brand hover', 'brandHover'],
  ['Brand active', 'brandActive'],
  ['On brand', 'onBrand'],
  ['Accent · brass', 'accent'],
  ['Accent text', 'accentText'],
  ['Accent strong', 'accentStrong'],
  ['Success', 'success'],
  ['Warning', 'warning'],
  ['Danger', 'danger'],
];

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="pv-swatch">
      <div className="pv-swatch__chip" style={{ background: value }} />
      <div className="pv-swatch__meta">
        <span className="pv-swatch__name">{label}</span>
        <span className="pv-swatch__hex">{value}</span>
      </div>
    </div>
  );
}

function Ramp({ label, entries }: { label: string; entries: Array<[string, string]> }) {
  return (
    <div className="pv-block">
      <span className="pv-block__label bc-label">{label}</span>
      <div className="pv-ramp">
        {entries.map(([k, v]) => (
          <div key={k} className="pv-ramp__step" style={{ background: v, color: readableInk(v) }}>
            {k}
          </div>
        ))}
      </div>
    </div>
  );
}

const neutralEntries = Object.entries(tokens.neutral).sort((a, b) => Number(b[0]) - Number(a[0]));
const brandEntries = Object.entries(tokens.brand);
const accentEntries = Object.entries(tokens.accent);

/* ---- Type ------------------------------------------------------------------ */
const TYPE_ROLES = [
  { cls: 'bc-display', name: 'Display', meta: 'Fraunces · 52 (clamps on mobile)', sample: 'Cut above' },
  { cls: 'bc-h1', name: 'H1', meta: 'Fraunces · 32', sample: 'The Strip Loin' },
  { cls: 'bc-h2', name: 'H2', meta: 'Fraunces · 26', sample: 'Members only' },
  { cls: 'bc-h3', name: 'H3', meta: 'Fraunces · 21', sample: 'Eye Fillet, dry-aged' },
  { cls: 'bc-h4', name: 'H4', meta: 'Inter · 18 · semibold', sample: 'Order summary' },
  { cls: 'bc-body-lg', name: 'Body large', meta: 'Inter · 18', sample: 'Reserve your box with a deposit today.' },
  { cls: 'bc-body', name: 'Body', meta: 'Inter · 16', sample: 'Every box is MSA grade 6/7+ and weighed at dispatch.' },
  { cls: 'bc-caption', name: 'Caption', meta: 'Inter · 13', sample: 'Final price billed by actual weight.' },
  { cls: 'bc-label', name: 'Label', meta: 'Inter · 12 · uppercase tracked', sample: 'Est. weight' },
];

/* ---- Interactive stepper demo ---------------------------------------------- */
function StepperDemo() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(0);
  return (
    <div className="pv-row" style={{ gap: 'var(--bc-space-8)' }}>
      <QuantityStepper value={a} onChange={setA} min={0} max={9} aria-label="Demo quantity" />
      <QuantityStepper value={b} onChange={setB} size="compact" aria-label="Compact demo quantity" />
    </div>
  );
}

export function Preview() {
  const [cart, setCart] = useState<Record<string, number>>(initialCart);
  const setQty = (id: string, n: number) => setCart((c) => ({ ...c, [id]: n }));
  const itemCount = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const total = catalogue.reduce((sum, box) => sum + (cart[box.id] ?? 0) * box.deposit, 0);

  return (
    <div className="pv-page">
      <div className="pv-device">
        {/* ---------- Hero ---------- */}
        <header className="pv-hero">
          <Wordmark size="lg" showTagline />
          <p className="pv-hero__sub bc-body">
            Premium boxed beef, reserved on deposit. The design system — speakeasy meets high-end butcher.
          </p>
          <div className="pv-hero__meta">
            <GradeBadge grade="MSA 6" />
            <GradeBadge grade="MSA 7" />
            <GradeBadge grade="9+" variant="solid" />
          </div>
        </header>

        {/* ====================================================== 01 FOUNDATIONS */}
        <section className="pv-section">
          <SectionHeader index="01" eyebrow="Foundations" title="Tokens" />

          <div className="pv-block">
            <span className="pv-block__label bc-label">Semantic colour roles</span>
            <div className="pv-swatches">
              {ROLE_SWATCHES.map(([label, key]) => (
                <Swatch key={key} label={label} value={tokens.color[key]} />
              ))}
            </div>
          </div>

          <Ramp label="Neutral · charcoal → bone" entries={neutralEntries} />
          <Ramp label="Brand · oxblood" entries={brandEntries} />
          <Ramp label="Accent · aged brass" entries={accentEntries} />

          <div className="pv-block">
            <span className="pv-block__label bc-label">Type scale</span>
            <div className="pv-type">
              {TYPE_ROLES.map((t) => (
                <div key={t.name} className="pv-type__row">
                  <span className={t.cls}>{t.sample}</span>
                  <span className="pv-type__meta">
                    {t.name} — {t.meta}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">Spacing · 4-based</span>
            <div className="pv-specs">
              {Object.entries(tokens.space).map(([k, v]) => (
                <div key={k} className="pv-spec">
                  <span className="pv-spec__key">
                    space-{k} · {v}px
                  </span>
                  <div className="pv-spacebar" style={{ width: `${v}px` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">Radius</span>
            <div className="pv-radii">
              {(['sm', 'md', 'lg', 'xl', 'pill'] as const).map((r) => (
                <div key={r} className="pv-tile">
                  <div className="pv-radiusbox" style={{ borderRadius: `var(--bc-radius-${r})` }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">Elevation</span>
            <div className="pv-elevs">
              {(['e1', 'e2', 'e3'] as const).map((e) => (
                <div key={e} className="pv-tile">
                  <div className="pv-elevcard" style={{ boxShadow: `var(--bc-shadow-${e})` }} />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================== 02 COMPONENTS */}
        <section className="pv-section">
          <SectionHeader index="02" eyebrow="The Kit" title="Components" />

          <div className="pv-block">
            <span className="pv-block__label bc-label">Buttons</span>
            <div className="pv-stack">
              <div className="pv-row">
                <Button>Add to order</Button>
                <Button variant="secondary">View cut</Button>
                <Button variant="ghost">Details</Button>
              </div>
              <div className="pv-row">
                <Button disabled>Sold out</Button>
                <Button loading>Reserving</Button>
                <Button variant="secondary" trailingIcon={<span aria-hidden>→</span>}>
                  Continue
                </Button>
              </div>
              <Button size="large" fullWidth>
                Pay deposit · ${total}
              </Button>
            </div>
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">Grade badges</span>
            <div className="pv-row">
              <GradeBadge grade="MSA 6" />
              <GradeBadge grade="MSA 7" />
              <GradeBadge grade="9+" variant="solid" />
              <GradeBadge grade="MSA 7" size="md" />
            </div>
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">Quantity stepper</span>
            <StepperDemo />
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">Price block</span>
            <div className="pv-surface">
              <PriceBlock deposit={60} balance={185} />
            </div>
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">List rows</span>
            <div className="pv-surface" style={{ padding: 0, overflow: 'hidden' }}>
              <ListRow title="Strip Loin × 1" subtitle="MSA 7 · 1.2–1.5 kg" value="$60" />
              <ListRow title="Tomahawk × 2" subtitle="MSA 7 · 1.4–1.8 kg" value="$150" />
              <ListRow title="Deposit total" value="$210" />
              <ListRow
                title="Manage dispatch address"
                subtitle="Charged when your beef ships"
                interactive
                divider={false}
                onClick={() => {}}
              />
            </div>
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">Inputs &amp; fields</span>
            <div className="pv-surface pv-stack">
              <Field label="Email" helper="We'll send your order confirmation here.">
                <Input type="email" placeholder="you@example.com" />
              </Field>
              <Field label="Delivery postcode" error="Enter a valid 4-digit postcode." required>
                <Input inputMode="numeric" placeholder="2000" defaultValue="20" />
              </Field>
              <Field label="Max billed weight" helper="We won't exceed this at dispatch.">
                <Input affix="kg" defaultValue="6.0" inputMode="decimal" />
              </Field>
            </div>
          </div>

          <div className="pv-block">
            <span className="pv-block__label bc-label">Order timeline</span>
            <div className="pv-surface">
              <OrderTimeline current={2} />
            </div>
          </div>
        </section>

        {/* ====================================================== 03 IN CONTEXT */}
        <section className="pv-section">
          <SectionHeader
            index="03"
            eyebrow="The Cuts"
            title="In the cellar"
            action={<Button variant="ghost">Filter</Button>}
          />
          <p className="bc-caption" style={{ marginTop: 'var(--bc-space-3)' }}>
            A live catalogue — adjust steppers and watch the order bar below update.
          </p>
          <div className="pv-catalogue">
            {catalogue.map((box) => (
              <BoxCard
                key={box.id}
                name={box.name}
                cut={box.cut}
                grade={box.grade}
                weightRange={box.weightRange}
                deposit={box.deposit}
                balance={box.balance}
                quantity={cart[box.id] ?? 0}
                onQuantityChange={(n) => setQty(box.id, n)}
                soldOut={box.soldOut}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Fixed bottom bar — reflects the live cart. */}
      <StickyOrderBar itemCount={itemCount} total={total} onCheckout={() => {}} onClear={() => {}} hideWhenEmpty={false} />
    </div>
  );
}
