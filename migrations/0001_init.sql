-- Users sign in with Google only, so there are no passwords
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    google_sub TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TEXT NOT NULL,
    last_login_at TEXT,
    last_seen_at TEXT
);

-- Only a SHA-256 hash of each session token is stored, so a copy of the database cannot be used to sign in
CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expires ON sessions(expires_at);

-- Gallery metadata and ownership; the contents live in R2 under carousels/<id>/
CREATE TABLE carousels (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    slide_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    -- Set while a Gemini request for this carousel runs, so two requests cannot clobber its conversation
    chat_lock_until TEXT
);
CREATE INDEX carousels_owner ON carousels(owner_id, updated_at);

-- API keys etc. set on the admin page; Worker secrets are the fallback
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Fixed-window request counters (key = rule:subject, window = start of the window in ms)
CREATE TABLE rate_limits (
    key TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (key, window_start)
);

-- What each user used per UTC day: the basis for daily quotas, plan limits and cost tracking
CREATE TABLE usage_daily (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    chat_requests INTEGER NOT NULL DEFAULT 0,
    image_requests INTEGER NOT NULL DEFAULT 0,
    tokens INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day)
);
