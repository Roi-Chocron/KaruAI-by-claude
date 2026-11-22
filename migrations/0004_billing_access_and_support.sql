-- When a renewal payment failed (Polar's past_due_at). The plan stays for POLAR_GRACE_DAYS after it while Polar
-- retries the card (see grantsAccess and EFFECTIVE_PLAN in worker/src/db.ts).
ALTER TABLE subscriptions ADD COLUMN past_due_at TEXT;

-- A plan an admin gives by hand (a "comp"), kept apart from Polar's subscriptions so webhooks and syncs can't undo
-- it. The user's plan is the better of the two while plan_override_until is empty or in the future.
ALTER TABLE users ADD COLUMN plan_override TEXT CHECK (plan_override IN ('basic', 'pro', 'vip'));
ALTER TABLE users ADD COLUMN plan_override_until TEXT;
ALTER TABLE users ADD COLUMN plan_override_reason TEXT;
-- Plans an admin set by hand before overrides existed (no subscription grants them) become overrides, so recomputing
-- plans keeps them
UPDATE users SET plan_override = plan, plan_override_reason = 'Set by an admin before comps were tracked'
    WHERE plan != 'free' AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = users.id AND s.status IN ('active', 'trialing'));

-- Signed webhook deliveries that could not be used (an unknown product or user), for the admin page. Only the latest
-- 20 are kept.
CREATE TABLE webhook_ignored (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    received_at TEXT NOT NULL,
    type TEXT NOT NULL,
    subscription_id TEXT,
    product_id TEXT,
    user_id TEXT,
    reason TEXT NOT NULL
);

-- Requests to support: cancellations from people who can't cancel in the app, and the contact form. An admin closes
-- them on the Admin page.
CREATE TABLE support_requests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cancellation', 'billing', 'bug', 'account', 'accessibility', 'privacy', 'idea', 'other')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT,
    email TEXT,
    -- Israeli ID number, which the law lets a seller ask for to identify who cancels
    id_number TEXT,
    plan TEXT,
    page TEXT,
    message TEXT,
    closed_at TEXT
);
CREATE INDEX support_requests_status ON support_requests(status, created_at);
