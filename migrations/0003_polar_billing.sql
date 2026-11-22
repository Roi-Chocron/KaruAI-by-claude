-- The plans are now free / basic / pro / vip (see shared/plans.ts). SQLite cannot change a CHECK constraint, so
-- the column is replaced: add the new one, copy the plans over (agency becomes vip), drop the old one, rename.
ALTER TABLE users ADD COLUMN plan_new TEXT NOT NULL DEFAULT 'free' CHECK (plan_new IN ('free', 'basic', 'pro', 'vip'));
UPDATE users SET plan_new = CASE plan WHEN 'pro' THEN 'pro' WHEN 'agency' THEN 'vip' ELSE 'free' END;
ALTER TABLE users DROP COLUMN plan;
ALTER TABLE users RENAME COLUMN plan_new TO plan;

-- Polar subscriptions, kept up to date by its webhooks (see worker/src/routes/billing.ts). The user's plan is the
-- best plan among their subscriptions that grant access.
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    -- Polar's modified_at of the version stored here, so a webhook that arrives late cannot undo a newer one
    modified_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX subscriptions_user ON subscriptions(user_id);

-- Webhook deliveries already handled (Polar retries, and may deliver the same event twice)
CREATE TABLE webhook_events (
    id TEXT PRIMARY KEY,
    received_at TEXT NOT NULL
);
