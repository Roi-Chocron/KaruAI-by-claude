# Before launch

## Required

- [ ] **Accessibility statement: fill in the missing details** in `app/accessibility/page.tsx` and
      `app/he/accessibility/page.tsx` (marked in lime on the page). Required by Israeli Standard 5568.
  - [ ] Business name
  - [ ] Accessibility coordinator: name, email and phone
  - [ ] Business mailing address
- [ ] Deploy to production: create D1 and R2, put the real `database_id` and `APP_URL` in `wrangler.jsonc`, set the secrets
      (see "Deploying" in README.md).
- [ ] Confirm the prices and limits in `shared/plans.ts` (Basic ₪29, Pro ₪59, VIP ₪119). The sandbox products had
      ₪35/₪70/₪140 ("30/60/100 posts a month") before they were aligned with `shared/plans.ts`.
- [ ] Polar live setup (payments work end to end in the sandbox): live products, access token, webhook endpoint and
      secrets — the steps are under "Production setup (Polar live)" in README.md.

- [ ] A lawyer's review of the Terms, the refund policy and the privacy policy (drafted with the recommended defaults:
      18+, liability capped at 12 months' payments or ₪100, Tel Aviv-Jaffa courts, no cancellation fee).
- [ ] Production needs a Pollinations API key (every image request now requires one): Admin page or
      `npx wrangler secret put POLLINATIONS_API_KEY`.
- [ ] When the Gemini key moves to a paid tier, empty `AI_BLOCKED_COUNTRIES` in `wrangler.jsonc` and drop the free-tier
      paragraph from section 4 of the Terms.

## Improvements

- [ ] Editor: rows in the layers list can't be reached with the keyboard (the accessibility statement lists this as a
      known limitation; update the statement once it's fixed).
- [ ] API errors: send a `code` with every error from the Worker and translate it on the client. Today the editor
      translates the known messages by their English text (`HE_API_ERRORS` in `public/advanced_dashboard_editor.html`).
- [ ] The editor (`/carousel`) has no link to the accessibility statement (the other signed-in pages have one in their footer).
