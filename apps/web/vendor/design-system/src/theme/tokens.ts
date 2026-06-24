/**
 * BEEF CARTEL — DESIGN TOKENS
 * ============================================================================
 * The single source of truth for the whole system. Values live here ONCE.
 *
 *  • Web      → cssVars.ts derives `:root { --bc-* }` custom properties from
 *               this object at runtime (see injectThemeVars()).
 *  • Flutter  → these same values seed a FlutterFlow theme later. That's why
 *               sizes are unitless numbers (logical px), line-heights are plain
 *               multipliers, and letter-spacing is in em — all portable.
 *
 * TO RESKIN THE BRAND: change the values in this file. Everything — every
 * component, the whole /preview — re-themes from these tokens. You should never
 * need to touch a component's .css to change a colour, size, or radius.
 *
 * Brand: premium, confident, a little dangerous. Speakeasy-meets-butcher.
 * Near-black charcoal + bone, oxblood red as the signature, aged brass accent.
 * ============================================================================
 */

/* --- Primitive ramps -------------------------------------------------------
 * Raw scales. Components should prefer the semantic `color` roles below, but
 * the ramps are exported (and emitted as --bc-neutral-*, --bc-brand-*,
 * --bc-accent-*) for the rare case you need an in-between step.
 * Higher number = lighter (Tailwind-style), running charcoal → bone.
 */
const neutral = {
  950: '#0E0C0A', // deepest pit-black (page inset / image letterbox)
  900: '#141210', // charcoal base — app background
  850: '#1C1814', // surface
  800: '#26201A', // surface raised (cards, sticky bar)
  700: '#332B22', // raised hover / inset wells
  600: '#3A322A', // border / hairline
  500: '#4E443A', // border strong
  400: '#6E6253', // disabled ink / faint dividers
  300: '#8C7F6C', // faint text (large / decorative only)
  200: '#B8AC98', // muted text (AA on bg)
  100: '#D8CFC0', // soft bone
  50: '#F4EFE6', // bone — primary ink on dark
} as const;

const brand = {
  900: '#3E0F0F',
  800: '#561515',
  700: '#6A1A1A', // active (pressed)
  600: '#7B1E1E', // BRAND — oxblood
  500: '#8E2525', // hover (brighter on dark UI)
  400: '#A33030',
  300: '#C25656', // tint ink on dark red
} as const;

const accent = {
  900: '#4A3A20',
  800: '#6E552F',
  700: '#8C6E3A', // strong brass — fills, filled badges
  600: '#B08D4F', // ACCENT — aged brass (lines, icons, borders)
  500: '#C9A86A', // luminous brass — brass *text* / labels (AA-safe)
  400: '#D9BE86',
  300: '#E6D2A6',
} as const;

/* --- Semantic colour roles -------------------------------------------------
 * What components actually reference. Swap the ramp above and these follow.
 * Contrast: every text role here is verified WCAG AA (≥4.5:1) on its surface.
 */
const color = {
  // surfaces (back → front)
  bg: neutral[900],
  bgInset: neutral[950],
  surface: neutral[850],
  surfaceRaised: neutral[800],
  surfaceHover: neutral[700],

  // lines
  border: neutral[600],
  borderStrong: neutral[500],
  hairline: 'rgba(176, 141, 79, 0.22)', // brass fine-line — the "premium thread"

  // ink
  text: neutral[50], // 16.3:1 on bg
  textMuted: neutral[200], // 8.4:1 on bg
  textFaint: neutral[300], // decorative / large only — NOT for body copy
  textInverse: neutral[950], // ink on bone/brass light surfaces

  // brand (oxblood)
  brand: brand[600],
  brandHover: brand[500],
  brandActive: brand[700],
  brandTint: '#241312', // near-black with a red undertone (washes, fills)
  onBrand: '#F8F4EC', // ink on brand fill — 9:1

  // accent (brass)
  accent: accent[600], // lines, icons, fills
  accentText: accent[500], // brass used as TEXT (badges, labels) — 8.3:1
  accentStrong: accent[700],
  accentTint: 'rgba(176, 141, 79, 0.12)', // brass wash (hover, badge bg)
  onAccent: neutral[950], // ink on a solid brass fill

  // focus
  focusRing: 'rgba(201, 168, 106, 0.55)', // brass glow

  // status
  success: '#7BA06B', // 6.3:1 — "Balance charged", in-stock
  warning: '#D8A53E', // 8.3:1 — low stock, attention
  danger: '#E2674B', // AA as text on every dark surface incl. raised
  onDanger: '#1A0E0C', // dark ink for a solid danger fill
} as const;

/* --- Typography ------------------------------------------------------------ */
const fontFamily = {
  // High-contrast display serif with attitude — headings & wordmark.
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  // Clean grotesque — all UI & body.
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900, // Fraunces display flourish (wordmark)
} as const;

// Unitless logical px (web emits as `px`, Flutter consumes raw).
const fontSize = {
  display: 52, // hero moments only; clamps down on mobile (see .bc-display)
  h1: 32,
  h2: 26,
  h3: 21,
  h4: 18,
  bodyLg: 18,
  body: 16,
  caption: 13,
  label: 12,
} as const;

// Plain multipliers (portable to Flutter `height`).
const lineHeight = {
  display: 1.02,
  tight: 1.1, // h1 / h2
  snug: 1.25, // h3 / h4
  normal: 1.5, // body
  relaxed: 1.6,
} as const;

// em units (portable to Flutter letterSpacing once multiplied by font size).
const letterSpacing = {
  tighter: '-0.03em', // display
  tight: '-0.015em', // headings
  normal: '0em',
  wide: '0.02em', // buttons
  wider: '0.12em', // labels / eyebrows (uppercase)
  widest: '0.2em', // wordmark
} as const;

/**
 * Role presets — the full recipe for each text style in one place.
 * Components use the .bc-* type utilities (global.css) which mirror these;
 * the object is here so the Flutter theme and any JS consumer get the same spec.
 */
const text = {
  display: { fontFamily: fontFamily.display, fontSize: fontSize.display, fontWeight: fontWeight.semibold, lineHeight: lineHeight.display, letterSpacing: letterSpacing.tighter },
  h1: { fontFamily: fontFamily.display, fontSize: fontSize.h1, fontWeight: fontWeight.semibold, lineHeight: lineHeight.tight, letterSpacing: letterSpacing.tight },
  h2: { fontFamily: fontFamily.display, fontSize: fontSize.h2, fontWeight: fontWeight.semibold, lineHeight: lineHeight.tight, letterSpacing: letterSpacing.tight },
  h3: { fontFamily: fontFamily.display, fontSize: fontSize.h3, fontWeight: fontWeight.medium, lineHeight: lineHeight.snug, letterSpacing: letterSpacing.tight },
  h4: { fontFamily: fontFamily.sans, fontSize: fontSize.h4, fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug, letterSpacing: letterSpacing.normal },
  bodyLg: { fontFamily: fontFamily.sans, fontSize: fontSize.bodyLg, fontWeight: fontWeight.regular, lineHeight: lineHeight.normal, letterSpacing: letterSpacing.normal },
  body: { fontFamily: fontFamily.sans, fontSize: fontSize.body, fontWeight: fontWeight.regular, lineHeight: lineHeight.normal, letterSpacing: letterSpacing.normal },
  caption: { fontFamily: fontFamily.sans, fontSize: fontSize.caption, fontWeight: fontWeight.regular, lineHeight: lineHeight.normal, letterSpacing: letterSpacing.normal },
  label: { fontFamily: fontFamily.sans, fontSize: fontSize.label, fontWeight: fontWeight.semibold, lineHeight: 1.2, letterSpacing: letterSpacing.wider, textTransform: 'uppercase' as const },
} as const;

/* --- Spacing (4-based) -----------------------------------------------------
 * Key === px / 4. So space[4] = 16px, space[8] = 32px. Unitless numbers.
 */
const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/* --- Radius ---------------------------------------------------------------- */
const radius = {
  sm: 6,
  md: 10, // buttons, inputs
  lg: 16, // cards
  xl: 22, // hero surfaces
  pill: 999, // badges, steppers
} as const;

/* --- Elevation (subtle on a matte dark UI) --------------------------------- */
const shadow = {
  e1: '0 1px 2px rgba(0, 0, 0, 0.45)',
  e2: '0 6px 20px rgba(0, 0, 0, 0.45)',
  e3: '0 18px 48px rgba(0, 0, 0, 0.55)', // sticky bar / overlays
} as const;

/* --- Motion ---------------------------------------------------------------- */
const motion = {
  duration: { fast: 120, base: 180, slow: 280 }, // ms
  ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)', // confident ease-out
  easeEmphasized: 'cubic-bezier(0.2, 0.9, 0.1, 1)',
} as const;

/* --- Breakpoints (mobile-first; design target ~390px) ----------------------
 * TS-only — CSS media queries can't read custom properties.
 */
const breakpoint = {
  sm: 390,
  md: 600,
  lg: 900,
  xl: 1200,
} as const;

/* --- Z-index --------------------------------------------------------------- */
const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100,
  overlay: 1000,
} as const;

export const tokens = {
  neutral,
  brand,
  accent,
  color,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  text,
  space,
  radius,
  shadow,
  motion,
  breakpoint,
  zIndex,
} as const;

export type Tokens = typeof tokens;
export type ColorRole = keyof typeof color;
export type SpaceStep = keyof typeof space;
export type TextRole = keyof typeof text;

export default tokens;
