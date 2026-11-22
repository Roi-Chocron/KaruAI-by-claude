# KaruAI

AI Instagram carousel generator. Runs entirely on Cloudflare's free tier:

| Part | Where | Code |
|---|---|---|
| Pages (landing, gallery, editor, admin) | Static files served by Cloudflare (Next.js `output: 'export'`) | `app/`, `components/`, `public/` |
| API (`/api/*`) | A Cloudflare Worker (Hono) | `worker/src/` |
| Users, sessions, carousel list, settings, usage | D1 (SQLite) | `migrations/`, `worker/src/db.ts` |
| Carousel documents, images, thumbnails, histories | R2 | `worker/src/storage.ts` |

Sign-in is with Google only. Static page requests don't run the Worker and don't count against the
100,000 requests/day of the free plan; only `/api/*` calls do.

## Local development

1. `npm install`
2. Copy `.dev.vars.example` to `.dev.vars` and fill it in (Google OAuth client, Gemini key, `ADMIN_EMAIL`).
   In the Google Cloud console, add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI.
3. Optional: copy `.env.example` to `.env.local` for analytics keys.
4. `npm run dev` — applies the D1 migrations locally, then starts the Worker on :8787 and Next.js on
   http://localhost:3000 (which forwards `/api/*` to the Worker). Local D1/R2 data lives in `.wrangler/`.

The editor (`public/advanced_dashboard_editor.html`) is a standalone page. Its Tailwind styles are prebuilt into
`public/editor.css` (gitignored) by `npm run build:editor-css` from `editor/tailwind.config.js`, which scans only that
page; `npm run dev` rebuilds it on every change and `npm run build` before the site build. Its scripts (Lucide,
JSZip, jsPDF) are pinned with integrity hashes: after changing a version, update its hash too.

Without a Google OAuth client you can still sign in locally: with `DEV_LOGIN=true` in `.dev.vars` the login page
shows a "Dev login" form that takes just an email. The API refuses it unless `APP_URL` is localhost.

## Checks

- `npm test` runs the API tests (`worker/test/`) inside the Workers runtime against in-memory D1 and R2,
  with Gemini and Pollinations mocked.
- `npm run typecheck` checks the site, the Worker and the tests.
- GitHub Actions (`.github/workflows/ci.yml`) runs both plus the build on every push and pull request.

## Plans and payments

Prices, limits and features live in `shared/plans.ts`; the API enforces the monthly limits. The paid plans (Basic
₪29, Pro ₪59, VIP ₪119, monthly) are Polar products, sold through Polar's hosted checkout
(`worker/src/polar.ts`, `worker/src/routes/billing.ts`):

- `POST /api/billing/checkout` opens a checkout for a plan, charged in ILS; `POST /api/billing/portal` opens Polar's
  customer portal (change plan, card, cancel, invoices). Users who already pay change plans in the portal.
- The `subscriptions` table follows Polar, and each user's plan is the best plan among their subscriptions that are
  `active` or `trialing` (free without one). It is kept up to date two ways, so a missed webhook only delays a change:
  - Polar's webhook `POST /api/billing/webhook` (signed, Standard Webhooks).
  - Asking Polar's API: the billing page calls `POST /api/billing/sync` when it loads and while it waits after a
    checkout, and the daily cron looks up subscriptions whose paid period ended without an update.
- An admin can still set a plan by hand on the Admin page; it stays until something changes on Polar for that user.
- An account (or, for an admin, a user) can't be deleted while its subscription still renews: Polar would go on
  charging it. Canceling first (it then ends at the end of the period) is enough.
- Polar sends buyers back with a `customer_session_token` in the address; `app/layout.tsx` removes it before any
  other script runs, so analytics and error reports never see it.

### Local development (Polar sandbox)

`.dev.vars` points at the sandbox (https://sandbox.polar.sh, organization "Karu AI"): `POLAR_SERVER=sandbox`, an
access token, the webhook secret and the three sandbox product ids. Pay with the test card 4242 4242 4242 4242, any
future date, any CVC. Polar can't reach `localhost`, so locally the plan changes through the sync alone (when the
billing page loads, and right after the checkout); the webhook is covered by `worker/test/billing.test.ts`.

### Production setup (Polar live)

1. In the live Polar dashboard (https://polar.sh), create three monthly products priced in ILS, matching
   `shared/plans.ts`: Basic ₪29, Pro ₪59, VIP ₪119 (the sandbox products are the model). Put their ids in
   `POLAR_PRODUCT_BASIC`, `POLAR_PRODUCT_PRO` and `POLAR_PRODUCT_VIP` in `wrangler.jsonc` (`POLAR_SERVER` is already
   `production`). Until then the site says online payments are not set up.
2. Settings → Access Tokens → Create token with exactly the scopes `checkouts:write`, `customer_sessions:write` and
   `subscriptions:read`, then `npx wrangler secret put POLAR_ACCESS_TOKEN`.
3. Settings → Webhooks → Add endpoint `<APP_URL>/api/billing/webhook`, format Raw, API version 2026-10, events
   `subscription.created`, `subscription.updated`, `subscription.active`, `subscription.canceled`,
   `subscription.uncanceled`, `subscription.revoked`, `subscription.past_due`; then
   `npx wrangler secret put POLAR_WEBHOOK_SECRET` with its secret.
4. If the site is behind Cloudflare's Bot Fight Mode, turn it off for `/api/billing/webhook`, or Polar's calls get a 403.

Keep the prices in `shared/plans.ts` equal to the Polar prices: the site shows them, Polar charges its own.

The Polar API version is pinned to 2026-10 (`POLAR_VERSION` in `worker/src/polar.ts`, and the webhook endpoint's API
version). Polar deprecates it in January 2027 and removes it in April 2027: move both to the next version before then
and run the tests.

## Deploying (first time)

```bash
npx wrangler login
npx wrangler d1 create karuai          # put the printed database_id in wrangler.jsonc
npx wrangler r2 bucket create karuai-files
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ADMIN_EMAIL
```

Set `APP_URL` in `wrangler.jsonc` to the public address, add `<APP_URL>/api/auth/google/callback` to the Google
OAuth client, then `npm run deploy` (builds the site, applies D1 migrations remotely, deploys the Worker).

## Database changes

Add a new numbered file in `migrations/` (never edit an applied one). `npm run dev` applies it locally and
`npm run deploy` applies it in production.
