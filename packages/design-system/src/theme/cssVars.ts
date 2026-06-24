/**
 * CSS CUSTOM PROPERTY GENERATOR
 * ============================================================================
 * Derives `:root { --bc-* }` from tokens.ts so the TS object stays the ONE
 * source of truth. Component .css files reference these var() names; changing
 * a value in tokens.ts updates both the JS-consumed token and the CSS variable.
 *
 * Naming convention (what component CSS relies on):
 *   colour roles → --bc-color-<kebab-role>      e.g. --bc-color-surface-raised
 *   ramps        → --bc-neutral-700 / --bc-brand-600 / --bc-accent-500
 *   type         → --bc-font-*, --bc-text-*, --bc-weight-*, --bc-leading-*,
 *                  --bc-tracking-*
 *   space        → --bc-space-4  (== 16px)
 *   radius       → --bc-radius-md
 *   elevation    → --bc-shadow-e2
 *   motion       → --bc-motion-base, --bc-ease
 *   z-index      → --bc-z-sticky
 *
 * `injectThemeVars()` is called once in main.tsx before render.
 * `rootCssString()` lets a build step emit a static .css file if ever needed.
 * ============================================================================
 */
import { tokens, type Tokens } from './tokens';

const px = (n: number) => `${n}px`;
const ms = (n: number) => `${n}ms`;
const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

export function buildThemeVars(t: Tokens = tokens): Record<string, string> {
  const v: Record<string, string> = {};

  // Primitive ramps
  for (const [k, val] of Object.entries(t.neutral)) v[`--bc-neutral-${k}`] = val;
  for (const [k, val] of Object.entries(t.brand)) v[`--bc-brand-${k}`] = val;
  for (const [k, val] of Object.entries(t.accent)) v[`--bc-accent-${k}`] = val;

  // Semantic colour roles (camelCase role -> --bc-color-kebab)
  for (const [role, val] of Object.entries(t.color)) {
    v[`--bc-color-${kebab(role)}`] = val as string;
  }

  // Type — families
  v['--bc-font-display'] = t.fontFamily.display;
  v['--bc-font-sans'] = t.fontFamily.sans;

  // Type — sizes (emit px for web)
  for (const [k, val] of Object.entries(t.fontSize)) {
    v[`--bc-text-${kebab(k)}`] = px(val);
  }
  // Type — weights
  for (const [k, val] of Object.entries(t.fontWeight)) {
    v[`--bc-weight-${kebab(k)}`] = String(val);
  }
  // Type — line-heights (unitless)
  for (const [k, val] of Object.entries(t.lineHeight)) {
    v[`--bc-leading-${kebab(k)}`] = String(val);
  }
  // Type — tracking
  for (const [k, val] of Object.entries(t.letterSpacing)) {
    v[`--bc-tracking-${kebab(k)}`] = val;
  }

  // Spacing (px)
  for (const [k, val] of Object.entries(t.space)) v[`--bc-space-${k}`] = px(val);

  // Radius (px; pill stays large)
  for (const [k, val] of Object.entries(t.radius)) v[`--bc-radius-${k}`] = px(val);

  // Elevation
  for (const [k, val] of Object.entries(t.shadow)) v[`--bc-shadow-${k}`] = val;

  // Motion
  v['--bc-motion-fast'] = ms(t.motion.duration.fast);
  v['--bc-motion-base'] = ms(t.motion.duration.base);
  v['--bc-motion-slow'] = ms(t.motion.duration.slow);
  v['--bc-ease'] = t.motion.ease;
  v['--bc-ease-emphasized'] = t.motion.easeEmphasized;

  // Z-index
  for (const [k, val] of Object.entries(t.zIndex)) v[`--bc-z-${k}`] = String(val);

  return v;
}

/** Full `:root { ... }` block as a string (for static emission or SSR). */
export function rootCssString(t: Tokens = tokens): string {
  const vars = buildThemeVars(t);
  const body = Object.entries(vars)
    .map(([k, val]) => `  ${k}: ${val};`)
    .join('\n');
  return `:root {\n${body}\n}`;
}

/** Inject/refresh the theme variables into <head>. Call once before render. */
export function injectThemeVars(t: Tokens = tokens): void {
  if (typeof document === 'undefined') return;
  const id = 'bc-theme-vars';
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.prepend(el); // prepend so component CSS can still override if needed
  }
  el.textContent = rootCssString(t);
}
