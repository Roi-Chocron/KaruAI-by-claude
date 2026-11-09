import type { CarouselRow, PublicUser, Role, SettingKey, User } from '../../types';

// D1 queries for users, sessions, carousel ownership, settings, rate limits and usage.
// Carousel contents (slides, images, histories) live in R2 (see storage.ts).

export const now = () => new Date().toISOString();
export const today = () => new Date().toISOString().slice(0, 10);

// --- Users ---

const toUser = (row: any): User => ({
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url ?? null,
    role: row.role,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
    lastSeenAt: row.last_seen_at ?? null,
});

export const publicUser = (user: User): PublicUser =>
    ({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role });

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
    const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    return row ? toUser(row) : null;
}

// Signs in the Google account: finds it by its Google id, else links the account with the same (verified) email,
// else creates one. The account named by ADMIN_EMAIL is made an admin.
export async function upsertGoogleUser(
    db: D1Database,
    profile: { sub: string; email: string; name: string; picture: string | null },
    adminEmail: string | undefined
): Promise<User> {
    const email = normalizeEmail(profile.email);
    const time = now();
    const makeAdmin = !!adminEmail && normalizeEmail(adminEmail) === email;
    const existing: any = await db.prepare('SELECT * FROM users WHERE google_sub = ? OR email = ? ORDER BY google_sub = ? DESC LIMIT 1')
        .bind(profile.sub, email, profile.sub).first();
    if (existing) {
        await db.prepare(`UPDATE users SET google_sub = ?, email = ?, name = CASE WHEN name = '' THEN ? ELSE name END,
            avatar_url = ?, role = CASE WHEN ? THEN 'admin' ELSE role END, last_login_at = ?, last_seen_at = ? WHERE id = ?`)
            .bind(profile.sub, email, profile.name.slice(0, 100), profile.picture, makeAdmin ? 1 : 0, time, time, existing.id).run();
        return (await getUserById(db, existing.id))!;
    }
    const id = crypto.randomUUID();
    await db.prepare(`INSERT INTO users (id, google_sub, email, name, avatar_url, role, created_at, last_login_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, profile.sub, email, profile.name.slice(0, 100), profile.picture, makeAdmin ? 'admin' : 'user', time, time, time).run();
    return (await getUserById(db, id))!;
}

export async function listUsersWithStats(db: D1Database): Promise<(User & { carouselCount: number })[]> {
    const { results } = await db.prepare(`
        SELECT users.*, COUNT(carousels.id) AS carousel_count
        FROM users LEFT JOIN carousels ON carousels.owner_id = users.id
        GROUP BY users.id ORDER BY users.created_at DESC
    `).all();
    return results.map((row: any) => ({ ...toUser(row), carouselCount: Number(row.carousel_count) }));
}

export async function setUserRole(db: D1Database, id: string, role: Role) {
    await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run();
}

// Deletes the user with their sessions and carousel rows; returns the carousel ids so their files can go too
export async function deleteUser(db: D1Database, id: string): Promise<string[]> {
    const { results } = await db.prepare('SELECT id FROM carousels WHERE owner_id = ?').bind(id).all<{ id: string }>();
    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return results.map(row => row.id);
}

// --- Sessions ---

export const SESSION_DAYS = 30;

export async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function randomToken(bytes = 32): string {
    const data = crypto.getRandomValues(new Uint8Array(bytes));
    return btoa(String.fromCharCode(...data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createSession(db: D1Database, userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = randomToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
    await db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .bind(await sha256Hex(token), userId, now(), expiresAt.toISOString()).run();
    return { token, expiresAt };
}

export async function getUserBySession(db: D1Database, token: string): Promise<User | null> {
    const row: any = await db.prepare(`
        SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `).bind(await sha256Hex(token), now()).first();
    if (!row) return null;
    // "Last active" is refreshed at most once a minute
    if (!row.last_seen_at || Date.now() - Date.parse(row.last_seen_at) > 60_000) {
        row.last_seen_at = now();
        await db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').bind(row.last_seen_at, row.id).run();
    }
    return toUser(row);
}

export async function deleteSession(db: D1Database, token: string) {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
}

// --- Carousels (ownership and gallery metadata) ---

const toCarousel = (row: any): CarouselRow => ({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    slideCount: Number(row.slide_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const CAROUSEL_COLUMNS = 'id, owner_id, title, slide_count, created_at, updated_at';

export async function insertCarousel(db: D1Database, id: string, ownerId: string): Promise<CarouselRow> {
    const time = now();
    const row = await db.prepare(`INSERT INTO carousels (id, owner_id, title, slide_count, created_at, updated_at)
        VALUES (?, ?, '', 0, ?, ?) RETURNING ${CAROUSEL_COLUMNS}`).bind(id, ownerId, time, time).first();
    return toCarousel(row);
}

export async function getCarouselRow(db: D1Database, id: string): Promise<CarouselRow | null> {
    const row = await db.prepare(`SELECT ${CAROUSEL_COLUMNS} FROM carousels WHERE id = ?`).bind(id).first();
    return row ? toCarousel(row) : null;
}

export async function listCarouselRows(db: D1Database, ownerId: string): Promise<CarouselRow[]> {
    const { results } = await db.prepare(`SELECT ${CAROUSEL_COLUMNS} FROM carousels WHERE owner_id = ? ORDER BY updated_at DESC`)
        .bind(ownerId).all();
    return results.map(toCarousel);
}

export async function updateCarouselRow(db: D1Database, id: string, update: { title: string; slideCount: number }) {
    const row = await db.prepare(`UPDATE carousels SET title = ?, slide_count = ?, updated_at = ? WHERE id = ?
        RETURNING ${CAROUSEL_COLUMNS}`).bind(update.title, update.slideCount, now(), id).first();
    return toCarousel(row);
}

export async function deleteCarouselRow(db: D1Database, id: string) {
    await db.prepare('DELETE FROM carousels WHERE id = ?').bind(id).run();
}

export async function countCarousels(db: D1Database): Promise<number> {
    return Number((await db.prepare('SELECT COUNT(*) AS count FROM carousels').first<{ count: number }>())?.count ?? 0);
}

// Takes the carousel's chat lock for up to `seconds`; false while another request holds it
export async function lockCarouselChat(db: D1Database, id: string, seconds: number): Promise<boolean> {
    const time = now();
    const until = new Date(Date.now() + seconds * 1000).toISOString();
    const result = await db.prepare('UPDATE carousels SET chat_lock_until = ? WHERE id = ? AND (chat_lock_until IS NULL OR chat_lock_until < ?)')
        .bind(until, id, time).run();
    return result.meta.changes > 0;
}

export async function unlockCarouselChat(db: D1Database, id: string) {
    await db.prepare('UPDATE carousels SET chat_lock_until = NULL WHERE id = ?').bind(id).run();
}

// --- Settings (API keys etc.), set on the admin page; Worker secrets are the fallback ---

export const SETTING_ENV = {
    gemini_api_key: 'GEMINI_API_KEY',
    pollinations_api_key: 'POLLINATIONS_API_KEY',
    gemini_model: 'GEMINI_MODEL',
} as const satisfies Record<SettingKey, keyof Env>;

export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';

export async function getStoredSetting(db: D1Database, key: SettingKey): Promise<{ value: string; updatedAt: string } | null> {
    const row: any = await db.prepare('SELECT value, updated_at FROM settings WHERE key = ?').bind(key).first();
    return row ? { value: row.value, updatedAt: row.updated_at } : null;
}

export async function setSetting(db: D1Database, key: SettingKey, value: string | null) {
    if (value === null || value.trim() === '') {
        await db.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
    } else {
        await db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
            .bind(key, value.trim(), now()).run();
    }
}

// The value in effect: the admin page's setting, else the Worker secret / variable
export async function getSetting(env: Env, key: SettingKey): Promise<string | undefined> {
    return (await getStoredSetting(env.DB, key))?.value || env[SETTING_ENV[key]] || undefined;
}

// --- Rate limits and usage ---

// Counts a hit in the current fixed window and returns the new count
export async function hitRateWindow(db: D1Database, key: string, windowMs: number): Promise<{ count: number; resetsAt: number }> {
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const row = await db.prepare(`INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
        ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1 RETURNING count`)
        .bind(key, windowStart).first<{ count: number }>();
    return { count: Number(row?.count ?? 1), resetsAt: windowStart + windowMs };
}

export type UsageColumn = 'chat_requests' | 'image_requests';

// Counts one request of today's usage and returns today's total for that column
export async function addUsage(db: D1Database, userId: string, column: UsageColumn): Promise<number> {
    const row = await db.prepare(`INSERT INTO usage_daily (user_id, day, ${column}) VALUES (?, ?, 1)
        ON CONFLICT(user_id, day) DO UPDATE SET ${column} = ${column} + 1 RETURNING ${column} AS total`)
        .bind(userId, today()).first<{ total: number }>();
    return Number(row?.total ?? 1);
}

export async function addTokens(db: D1Database, userId: string, tokens: number) {
    await db.prepare(`INSERT INTO usage_daily (user_id, day, tokens) VALUES (?, ?, ?)
        ON CONFLICT(user_id, day) DO UPDATE SET tokens = tokens + excluded.tokens`)
        .bind(userId, today(), tokens).run();
}

// The daily cron job: drops expired sessions, finished rate-limit windows and usage older than a year
export async function cleanUp(db: D1Database) {
    const yearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await db.batch([
        db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now()),
        db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(Date.now() - 2 * 24 * 3600 * 1000),
        db.prepare('DELETE FROM usage_daily WHERE day < ?').bind(yearAgo),
    ]);
}
