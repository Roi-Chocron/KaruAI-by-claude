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

## Plans

Prices, limits and features live in `shared/plans.ts`; the API enforces the monthly limits. The paid plans (Basic,
Pro, VIP) are Polar products, sold through Polar's hosted checkout (`worker/src/routes/billing.ts`):

- `POST /api/billing/checkout` opens a checkout for a plan; `POST /api/billing/portal` opens Polar's customer portal
  (change plan, card, cancel, invoices).
- Polar's webhook `POST /api/billing/webhook` keeps the `subscriptions` table up to date, and each user's plan is the
  best plan among their active subscriptions (free without one). An admin can still set a plan by hand on the Admin
  page; the next webhook for that user overrides it.
- `POLAR_SERVER` and the `POLAR_PRODUCT_*` ids are in `wrangler.jsonc` (production) and `.dev.vars` (sandbox).

Setting up Polar for production: in the Polar dashboard, Settings → Developers → New token (scopes
`checkouts:write`, `customer_sessions:write`), and Settings → Webhooks → Add endpoint
`<APP_URL>/api/billing/webhook`, format Raw, all `subscription.*` events. Then:

```bash
npx wrangler secret put POLAR_ACCESS_TOKEN
npx wrangler secret put POLAR_WEBHOOK_SECRET
```

If the site is behind Cloudflare's Bot Fight Mode, turn it off for `/api/billing/webhook`, or Polar's calls get a 403.
Keep the prices in `shared/plans.ts` equal to the Polar prices: the site shows them, Polar charges its own.

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
