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

Without a Google OAuth client you can still sign in locally: with `DEV_LOGIN=true` in `.dev.vars` the login page
shows a "Dev login" form that takes just an email. The API refuses it unless `APP_URL` is localhost.

## Checks

- `npm test` runs the API tests (`worker/test/`) inside the Workers runtime against in-memory D1 and R2,
  with Gemini and Pollinations mocked.
- `npm run typecheck` checks the site, the Worker and the tests.
- GitHub Actions (`.github/workflows/ci.yml`) runs both plus the build on every push and pull request.

## Plans

Prices, limits and features live in `shared/plans.ts` (placeholder values for now). The API enforces the monthly
limits; an admin sets each user's plan on the Admin page until payments are connected.

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
