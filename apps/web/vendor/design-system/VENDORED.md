# Vendored design system (do not hand-edit)

This is a **copy** of `packages/design-system/src` (+ its `package.json`), linked into
`apps/web` via `"@beef-cartel/design-system": "file:vendor/design-system"`.

**Why it exists:** Firebase App Hosting builds `apps/web` in isolation and requires a
dependency lockfile *inside* `apps/web`. As an npm-workspace member, the lockfile lived
at the monorepo root, which App Hosting's buildpack couldn't see ("Missing dependency
lock file at path '/workspace/apps/web'"). Vendoring makes `apps/web` self-contained
while still consuming the design system through `node_modules` (so component CSS imports
and `transpilePackages` both work).

**Source of truth** is still `packages/design-system` — that's what runs the `/preview`
and what `/design-sync` reads. This `vendor/` copy is a build artifact.

**To re-sync after editing the real design system:**
1. Copy `packages/design-system/src/{index.ts,theme,components,lib}` over
   `apps/web/vendor/design-system/src/` (exclude `preview/`, `App.tsx`, `main.tsx`,
   `vite-env.d.ts`).
2. `cd apps/web && npm install` (refreshes the link), then commit.
