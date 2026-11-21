# Before launch

## Required

- [ ] **Accessibility statement: fill in the missing details** in `app/accessibility/page.tsx` and
      `app/he/accessibility/page.tsx` (marked in lime on the page). Required by Israeli Standard 5568.
  - [ ] Business name
  - [ ] Accessibility coordinator: name, email and phone
  - [ ] Business mailing address
- [ ] Deploy to production: create D1 and R2, put the real `database_id` and `APP_URL` in `wrangler.jsonc`, set the secrets
      (see "Deploying" in README.md).
- [ ] Real prices and limits in `shared/plans.ts` (the current ones are placeholders).
- [ ] Connect a payment provider (today an admin changes a user's plan by hand).

## Improvements

- [ ] Editor: rows in the layers list can't be reached with the keyboard (the accessibility statement lists this as a
      known limitation; update the statement once it's fixed).
