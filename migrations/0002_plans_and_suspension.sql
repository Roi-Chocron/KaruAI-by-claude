-- The user's subscription plan (see shared/plans.ts); set by an admin until payments are connected
ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency'));
-- Set while an admin has suspended the account: it cannot sign in or use the API
ALTER TABLE users ADD COLUMN suspended_at TEXT;
-- New carousels count against the monthly plan limit
ALTER TABLE usage_daily ADD COLUMN carousels_created INTEGER NOT NULL DEFAULT 0;
