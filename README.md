# Beef Cartel

Premium boxed-beef preorder app for the Australian market. Mobile-first, installable
PWA. Customers reserve fixed beef boxes with a **deposit**; the **balance** is charged
on dispatch once real carcass weights are known. A cycle's orders aggregate into one
supplier PO.

**Monorepo (npm workspaces):**

```
beef-cartel/
├─ packages/design-system/   @beef-cartel/design-system — the brand kit (tokens + React
│                            components). Standalone /preview + /design-sync still work here.
└─ apps/web/                 @beef-cartel/web — Next.js (App Router) on Firebase App Hosting.
```

The web app consumes the design system from source via `transpilePackages` — every screen
is built from the real brand components. (If the App Hosting build ever fails resolving the
workspace package, vendor it: copy `packages/design-system/src` → `apps/web/src/ds` and
repoint imports. See `apps/web/next.config.ts`.)

**Stack:** Next.js 15 · Firebase App Hosting (Cloud Run) · Cloud Firestore · Firebase Auth
(email magic-link, admin only) · Firebase Admin SDK (ADC) · Stripe (AUD, deposit + off-session
balance) · Resend (email) · PWA.

---

## Run it locally

```bash
# from the repo root
npm install
gcloud auth application-default login        # lets the Admin SDK reach Firestore locally
cp apps/web/.env.example apps/web/.env.local  # then fill it in (see below)
npm run seed                                  # writes 6 placeholder boxes + an open cycle
npm run dev                                   # → http://localhost:3000
```

Before Firebase/Stripe are configured the catalogue still renders with **placeholder**
boxes (server reads fall back), so you can see the UI immediately. Checkout/admin need real
keys.

Other commands: `npm run build`, `npm run typecheck`, `npm run dev:ds` (design-system preview).

---

## 1) Accounts you must create

| # | Account | Why |
|---|---------|-----|
| 1 | **Firebase / Google Cloud** project | Hosting (App Hosting), Firestore, Auth |
| 2 | **Stripe** account | Deposit + balance payments (AUD) |
| 3 | **Resend** account | Transactional email (receipts, supplier PO) |
| 4 | Domain **beefcartel.com.au** (you have it) | Custom domain + Resend sender verification |

## 2) Keys/values you must supply, and exactly where each goes

Local dev → `apps/web/.env.local`. Production → `apps/web/apphosting.yaml` (plain values) and
**Cloud Secret Manager** (the 3 secrets). The publishable Stripe key is public → plain env.

| Value | Where to get it | Local (`.env.local`) | Production |
|-------|-----------------|----------------------|------------|
| `NEXT_PUBLIC_FIREBASE_*` (6) | Firebase console → Project settings → Your apps → Web app config | set all 6 | set all 6 in `apphosting.yaml` (`env`, `availability: [BUILD, RUNTIME]`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys (`pk_test_…`) | set | `apphosting.yaml` (plain env) |
| `STRIPE_SECRET_KEY` | Stripe → API keys (`sk_test_…`) | set | **secret** → `firebase apphosting:secrets:set STRIPE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → your endpoint → signing secret (`whsec_…`) | set | **secret** → `firebase apphosting:secrets:set STRIPE_WEBHOOK_SECRET` |
| `RESEND_API_KEY` | Resend → API Keys (`re_…`) | set | **secret** → `firebase apphosting:secrets:set RESEND_API_KEY` |
| `NEXT_PUBLIC_APP_URL` | Your live URL | `http://localhost:3000` | `https://beefcartel.com.au` in `apphosting.yaml` |
| `FIREBASE_PROJECT_ID` | Firebase project id | set | `apphosting.yaml` (`env`, RUNTIME) |
| `ADMIN_EMAILS` | Your brother's email(s), comma-separated | set | `apphosting.yaml` (`env`, RUNTIME) |
| `SUPPLIER_EMAIL` | Supplier's email | set | `apphosting.yaml` (`env`, RUNTIME) |
| `EMAIL_FROM` | A Resend-verified sender, e.g. `Beef Cartel <orders@beefcartel.com.au>` | set | `apphosting.yaml` (`env`, RUNTIME) |

Create the 3 production secrets (one-time), then deploy:

```bash
firebase apphosting:secrets:set STRIPE_SECRET_KEY
firebase apphosting:secrets:set STRIPE_WEBHOOK_SECRET
firebase apphosting:secrets:set RESEND_API_KEY
# grant the backend access when prompted (or: firebase apphosting:secrets:grantaccess … )
```

## 3) Console steps (paste-where)

**Firebase console**
- **Firestore** → Create database → pick location **australia-southeast1** (or -southeast2). *Location is permanent.*
- **Authentication** → Sign-in method → enable **Email/Password → Email link (passwordless)**. Add authorized domains: `localhost` and `beefcartel.com.au`.
- **App Hosting** → Create backend → connect this GitHub repo, branch `main`, **root directory `apps/web`** (also in `firebase.json` as `backendId: "beef-cartel"` — match it). → add the **custom domain** `beefcartel.com.au` (+ `www`) and follow the DNS instructions.

**Stripe dashboard**
- Developers → **Webhooks** → Add endpoint: `https://beefcartel.com.au/api/stripe/webhook`. Subscribe to **`payment_intent.succeeded`**. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
  *(Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use the printed `whsec_…`.)*

**Firestore data (`firebase.json` already wires rules + indexes)**
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 4) Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes   # rules + the products index
git push origin main                                       # App Hosting builds & rolls out
```

App Hosting deploys on **git push to the connected branch** — there's no `firebase deploy`
step for the app itself. Watch the rollout in the console.

## 5) Go live (Stripe test → live)

When you're ready: swap **both** Stripe keys to live mode —
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`) and `STRIPE_SECRET_KEY` (`sk_live_…`,
re-set the secret) — then **re-create the webhook in live mode** and update
`STRIPE_WEBHOOK_SECRET`. That's the whole switch.

---

## How it works

- **Catalogue → review → checkout → confirmation.** The deposit is **recomputed server-side**
  from product data (the client amount is never trusted). Stripe vaults the card
  (`setup_future_usage: 'off_session'`); the webhook promotes a staged order to a real one and
  emails the receipt.
- **Admin** (`/admin`, magic-link, allowlisted email): aggregated supplier PO + "email PO",
  and per-order "enter final weight/amount → charge balance" (off-session; if the card needs
  authentication, it emails a Stripe payment link instead).
- **Cycles are managed by hand in Firestore** for v1 (no cycle CRUD UI). The seed script
  creates one open cycle.

## Notes & things to confirm
- **GST**: the business is **not GST-registered**, so there is no tax component — prices are
  final and receipts show no GST line. (If that changes, add Stripe Tax / Stripe Invoices.)
- **Admin gate** is an email allowlist (`ADMIN_EMAILS`) for v1; harden later with a custom claim
  (`// NOTE` in `lib/server/admin-auth.ts`).
- **PWA icons**: `public/icon.svg` is a maskable SVG (installable). Add raster PNGs (192/512) for
  the widest device support.
