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
₪29, Pro ₪59, VIP ₪119, monthly, VAT included) are Polar products, sold through Polar's hosted checkout. Polar is the
reseller and merchant of record. Code: `worker/src/polar.ts` (the API client) and `worker/src/routes/billing.ts`.

- **Buying and changing plans:** `POST /api/billing/checkout` opens a checkout (in ILS, with the buyer's IP so Polar
  places them for tax); `POST /api/billing/portal` opens Polar's customer portal (plan changes, card, invoices).
  People who already pay change plans in the portal, never through a second checkout.
- **Who gets which plan:** the `subscriptions` table follows Polar. A user's plan is the better of their best
  subscription that grants access and an admin's comp. Access means `active` or `trialing`, or `past_due` for
  `POLAR_GRACE_DAYS` (7) after the renewal failed, while Polar retries the card (2, 7, 14 and 21 days after).
- **Staying in sync:** Polar's webhook (`POST /api/billing/webhook`, Standard Webhooks signatures, subscription.*,
  order.refunded and refund.* events) and Polar's API: the billing page syncs when it loads and after a checkout,
  and the daily cron re-checks subscriptions that started, were canceled or failed to renew in the last two days,
  those whose period ended without an update, and drops plans whose grace period or comp ran out. Either path alone
  is enough. Deliveries we can't use are listed on the Admin page and reported to Sentry.
- **Cancelling** (Consumer Protection Law 14ט): `/cancel` is linked from every footer. Subscribers cancel at the end
  of the period, undo that, or end now with the unused days refunded (`POST /api/billing/cancel`). Anyone else
  (signed out, suspended) sends a request (`POST /api/support`), which the Admin page lists under Requests.
- **Refunds:** a fully refunded subscription order ends the subscription (Polar itself does not); partial refunds are
  only logged. The policy is on `/refund` (Hebrew binding for Israeli consumers).
- **Deleting an account** ends a renewing subscription now with the unused days refunded, then deletes and anonymizes
  the Polar customer; if Polar fails nothing is deleted. Suspending a payer can also end their subscription at the
  period end.
- **Comps:** on the Admin page, "Change plan" gives a plan by hand (optionally until a date). Webhooks and syncs keep
  it, and a plan below what the user pays for is refused.
- Polar sends buyers back with a `customer_session_token` in the address; `app/layout.tsx` removes it before any
  other script runs, so analytics and error reports never see it.

| | Sandbox (local) | Live (production) |
|---|---|---|
| Dashboard | https://sandbox.polar.sh | https://polar.sh |
| API | sandbox-api.polar.sh (`POLAR_SERVER=sandbox`) | api.polar.sh (`POLAR_SERVER=production`, in `wrangler.jsonc`) |
| Settings | `.dev.vars` | `wrangler.jsonc` vars and `wrangler secret put` |
| Webhooks | can't reach localhost; the sync does the work | `<APP_URL>/api/billing/webhook` |
| Cards | 4242 4242 4242 4242 (paid), 4000 0000 0000 0002 (declined), 4000 0000 0000 0341 (charges fail later) | real cards |

### Production setup (Polar live)

1. Organization settings: default currency ILS; tax behavior Inclusive; "Allow multiple subscriptions" off;
   proration "Invoice" (upgrades are charged right away); Subscriptions → grace period for benefit revocation 7 days
   (equal to `POLAR_GRACE_DAYS`); customer portal plan changes on.
2. Create three monthly products priced in ILS, matching `shared/plans.ts`: Basic ₪29, Pro ₪59, VIP ₪119 (the sandbox
   products are the model). Put their ids in `POLAR_PRODUCT_BASIC`, `POLAR_PRODUCT_PRO` and `POLAR_PRODUCT_VIP` in
   `wrangler.jsonc`. Until then the site says online payments are not set up.
3. Settings → Access Tokens → Create token with the scopes `checkouts:read`, `checkouts:write`,
   `customer_sessions:write`, `subscriptions:read`, `subscriptions:write`, `customers:write`, `orders:read`,
   `refunds:write` and `products:read`, then `npx wrangler secret put POLAR_ACCESS_TOKEN`.
4. Settings → Webhooks → Add endpoint `<APP_URL>/api/billing/webhook`, format Raw, API version 2026-10, events
   `subscription.*` (created, updated, active, canceled, uncanceled, revoked, past_due), `order.refunded`,
   `refund.created` and `refund.updated`; then `npx wrangler secret put POLAR_WEBHOOK_SECRET` with its secret.
5. Keep Cloudflare's Bot Fight Mode off: it blocks Polar's webhook calls, and on the Free plan it can't exempt a path.
6. Open the Admin page: the Payments card checks the token, the products and their prices, and the webhook secret.

Keep the prices in `shared/plans.ts` equal to the Polar prices: the site shows them, Polar charges its own (the
Payments card flags a difference).

**Refund by hand:** Polar → Sales → Orders → the order → Refund. A full refund of a subscription order ends that
subscription through the webhook; check the user's plan on the Admin page, and revoke the subscription in Polar if
it is still active (for example when the webhook could not be delivered).

**API version:** pinned to 2026-10 (`POLAR_VERSION` in `worker/src/polar.ts`, and the webhook endpoint's API
version). Polar deprecates it in January 2027 and removes it in April 2027. Before then: read the new version's
changes, change `POLAR_VERSION`, run `npm test` and a sandbox checkout, then move the webhook endpoint to the same
version.

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
