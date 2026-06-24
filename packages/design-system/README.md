# Beef Cartel — Design System

A self-contained **React + TypeScript** design system for the Beef Cartel premium
boxed-beef preorder app. Mobile-first (designed at ~390px). Built from scratch — no
UI library — so the components carry the brand, not someone else's defaults.

> **Brand:** premium, confident, a little dangerous. Speakeasy-meets-high-end-butcher,
> "contraband-luxe". Near-black charcoal + bone, **oxblood red** signature, **aged brass**
> accent. Matte and tactile, high contrast, restrained luxury with an outlaw wink.

---

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default <http://localhost:5173/preview>). The `/preview` route shows
the full colour ramp, the type scale, and a live example of every component — including a
working faux catalogue (BoxCards + a sticky order bar) so you can see it all in context.

Other scripts: `npm run typecheck`, `npm run build`, `npm run preview`.

---

## How the tokens are structured

Everything starts in **one file**: [`src/theme/tokens.ts`](src/theme/tokens.ts). It exports a
single, deeply-typed `tokens` object. Values live there **once** and are deliberately kept
**platform-agnostic** so the same numbers can seed a FlutterFlow theme later:

- sizes are **unitless logical px** (`fontSize.h1 = 32`),
- line-heights are plain **multipliers** (`1.5`),
- letter-spacing is in **em**,
- colours are hex / rgba strings.

```
tokens
├─ neutral / brand / accent   ← raw colour ramps (charcoal→bone, oxblood, brass)
├─ color                      ← SEMANTIC ROLES — what components actually use
│                                (bg, surface, surfaceRaised, text, textMuted, border,
│                                 brand, accent, success, warning, danger, onBrand, …)
├─ fontFamily / fontWeight / fontSize / lineHeight / letterSpacing
├─ text                       ← ready-made role presets (display, h1–h4, body, caption, label)
├─ space (4-based) / radius / shadow / motion / breakpoint / zIndex
```

### One source, two outputs

[`src/theme/cssVars.ts`](src/theme/cssVars.ts) **derives** CSS custom properties from the
token object at runtime — so the TS object stays the single source of truth. `main.tsx` calls
`injectThemeVars()` once before render, which writes a `:root { --bc-* }` block into `<head>`.

| Consumer | Reads |
| --- | --- |
| React components | the generated `var(--bc-*)` custom properties (in each component's `.css`) |
| Claude Design `/design-sync` | the TS `tokens` object **and** the components directly |
| Future FlutterFlow theme | the same `tokens` values (unitless, portable) |

CSS variable naming (what component CSS relies on):

```
--bc-color-<role>     e.g. --bc-color-surface-raised, --bc-color-accent-text
--bc-neutral-700 / --bc-brand-600 / --bc-accent-500   (raw ramp steps)
--bc-font-* --bc-text-* --bc-weight-* --bc-leading-* --bc-tracking-*
--bc-space-4 (=16px)  --bc-radius-md  --bc-shadow-e2  --bc-motion-base  --bc-ease  --bc-z-sticky
```

Need a static stylesheet (e.g. for a non-JS build step)? `rootCssString()` returns the whole
`:root` block as a string.

---

## Reskinning the brand (the whole point)

**Change values in `src/theme/tokens.ts` — nothing else.** Because every component styles itself
with `var(--bc-*)` and never hardcodes a colour or size, editing a token re-themes the entire
system and the whole `/preview`.

- **New primary colour?** Edit the `brand` ramp (`600` is the base; `500` is hover, `700` is
  active) and `color.onBrand`. Every primary button, the brand wash, `::selection`, etc. follow.
- **Different accent?** Edit the `accent` ramp. `accent[600]` = lines/icons/fills,
  `accent[500]` = brass-as-text (kept lighter so it stays AA on dark). Badges, fine lines,
  focus ring, timeline nodes all update.
- **Lighter/darker base?** Edit the `neutral` ramp and the `color.bg/surface/...` roles.
- **Type?** Swap `fontFamily.display` / `fontFamily.sans` (and the matching `<link>` in
  `index.html`). Resize the whole scale via `fontSize`.
- **Tighter/looser layout?** `space`, `radius`, `shadow` flow everywhere.

### Accessibility guardrails baked in

- Every **text** colour role is verified **WCAG AA (≥4.5:1)** on the surfaces it's used on.
- Brand rule enforced in components: **never brass text on bone.** Brass-as-text only appears on
  dark surfaces via `--bc-color-accent-text`; solid brass *fills* use `--bc-color-accent` with
  `--bc-color-on-accent` ink (also AA).
- All interactive controls meet the **44px** minimum tap target; focus shows a brass ring.

If you reskin, keep that AA contract: re-check `textMuted`, `accentText`, and the status colours
against your new surfaces.

---

## Project layout

```
src/
├─ theme/
│  ├─ tokens.ts      ← single source of truth (edit here to reskin)
│  ├─ cssVars.ts     ← derives :root --bc-* from tokens; injectThemeVars()
│  ├─ global.css     ← reset, base, type-utility classes (.bc-h1, .bc-label, …)
│  └─ index.ts
├─ lib/cx.ts         ← tiny classnames joiner
├─ components/       ← one folder per component: <Name>.tsx + <Name>.css + index.ts
│  ├─ Button/ Wordmark/ GradeBadge/ QuantityStepper/ PriceBlock/ BoxCard/
│  ├─ StickyOrderBar/ ListRow/ Field/ (Input + Field) OrderTimeline/ SectionHeader/
│  └─ index.ts       ← barrel: `import { Button, BoxCard, … } from './components'`
├─ preview/          ← the /preview showcase (demo only, prefix pv-*)
├─ App.tsx · main.tsx
```

### Components

| Component | What it's for |
| --- | --- |
| `Button` | primary / secondary / ghost · default / large (sticky CTA) · disabled / loading |
| `Wordmark` | Beef Cartel logotype placeholder in the display serif |
| `GradeBadge` | brass MSA-grade tag (outline / solid) |
| `QuantityStepper` | −/value/+ controlled stepper — the core catalogue interaction |
| `PriceBlock` | deposit-now + est. balance + variable-weight fine print |
| `BoxCard` | beef-box product card (image, grade, weight, price, embedded stepper) |
| `StickyOrderBar` | fixed bottom bar: item count + running total + checkout CTA |
| `ListRow` | generic row for review/admin screens |
| `Input` + `Field` | text input with label / helper / error wiring |
| `OrderTimeline` | Ordered → Sent to supplier → Dispatched → Balance charged |
| `SectionHeader` | chaptered eyebrow/number + title |

Every component takes `className` and forwards sensible props. See each component's `.tsx` for
its full prop interface.

---

## Conventions (if you add a component)

1. New folder `src/components/<Name>/` with `<Name>.tsx`, `<Name>.css`, `index.ts`.
2. `import './<Name>.css'` and use **`var(--bc-*)` only** for colour/space/radius/type/shadow.
3. Named export + an exported `Props` interface; pass through `className` (merge via `cx`).
4. BEM-ish classes: `.bc-<name>`, `.bc-<name>__part`, `.bc-<name>--<modifier>`, `is-<state>`.
5. 44px tap targets on anything interactive; lean on the global focus ring.
6. Re-export it from `src/components/index.ts`.
