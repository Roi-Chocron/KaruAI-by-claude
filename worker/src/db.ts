import type { CarouselRow, MonthlyUsage, PublicUser, Role, SettingKey, User } from '../../types';
import { PAID_PLAN_IDS, type PaidPlanId, type PlanId } from '../../shared/plans';

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
    plan: row.plan ?? 'free',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
    lastSeenAt: row.last_seen_at ?? null,
    suspendedAt: row.suspended_at ?? null,
    planOverride: row.plan_override ?? null,
    planOverrideUntil: row.plan_override_until ?? null,
    planOverrideReason: row.plan_override_reason ?? null,
});

export const publicUser = (user: User): PublicUser =>
    ({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, plan: user.plan });

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

// Local development only (see routes/auth.ts): signs in by email alone, creating the account if needed
export async function upsertDevUser(db: D1Database, email: string, adminEmail: string | undefined): Promise<User> {
    const normalized = normalizeEmail(email);
    const time = now();
    const makeAdmin = !!adminEmail && normalizeEmail(adminEmail) === normalized;
    const existing: any = await db.prepare('SELECT id FROM users WHERE email = ?').bind(normalized).first();
    const id = existing?.id ?? crypto.randomUUID();
    if (existing) {
        await db.prepare("UPDATE users SET role = CASE WHEN ? THEN 'admin' ELSE role END, last_login_at = ?, last_seen_at = ? WHERE id = ?")
            .bind(makeAdmin ? 1 : 0, time, time, id).run();
    } else {
        await db.prepare(`INSERT INTO users (id, email, name, role, created_at, last_login_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .bind(id, normalized, normalized.split('@')[0], makeAdmin ? 'admin' : 'user', time, time, time).run();
    }
    return (await getUserById(db, id))!;
}

export async function updateUserName(db: D1Database, id: string, name: string) {
    await db.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name.trim().slice(0, 100), id).run();
}

export async function countAdmins(db: D1Database): Promise<number> {
    return Number((await db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").first<{ count: number }>())?.count ?? 0);
}

export type AdminUserRow = User & {
    carouselCount: number;
    usage: Omit<MonthlyUsage, 'month'>;
    // This month's estimated AI cost, in millionths of a dollar
    monthCostMicroUsd: number;
    // Their latest Polar subscription, for the admin's badges
    subscription: { plan: PaidPlanId; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
};

// Every user with their carousel count, this month's usage and latest subscription
export async function listUsersWithStats(db: D1Database): Promise<AdminUserRow[]> {
    const latest = (column: string) => `(SELECT ${column} FROM subscriptions s WHERE s.user_id = users.id ORDER BY s.modified_at DESC LIMIT 1)`;
    const { results } = await db.prepare(`
        SELECT users.*,
            ${latest('plan')} AS sub_plan, ${latest('status')} AS sub_status, ${latest('current_period_end')} AS sub_period_end,
            ${latest('cancel_at_period_end')} AS sub_cancel,
            (SELECT COUNT(*) FROM carousels WHERE carousels.owner_id = users.id) AS carousel_count,
            COALESCE(SUM(usage_daily.carousels_created), 0) AS month_carousels,
            COALESCE(SUM(usage_daily.chat_requests), 0) AS month_messages,
            COALESCE(SUM(usage_daily.image_requests), 0) AS month_images,
            COALESCE(SUM(usage_daily.tokens), 0) AS month_tokens,
            COALESCE(SUM(usage_daily.cost_micro_usd), 0) AS month_cost
        FROM users LEFT JOIN usage_daily ON usage_daily.user_id = users.id AND usage_daily.day >= ?
        GROUP BY users.id ORDER BY users.created_at DESC
    `).bind(monthStart()).all();
    return results.map((row: any) => ({
        ...toUser(row),
        carouselCount: Number(row.carousel_count),
        usage: {
            carousels: Number(row.month_carousels),
            messages: Number(row.month_messages),
            images: Number(row.month_images),
            tokens: Number(row.month_tokens),
        },
        monthCostMicroUsd: Number(row.month_cost),
        subscription: row.sub_plan
            ? { plan: row.sub_plan, status: row.sub_status, currentPeriodEnd: row.sub_period_end ?? null, cancelAtPeriodEnd: !!row.sub_cancel }
            : null,
    }));
}

export async function setUserRole(db: D1Database, id: string, role: Role) {
    await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run();
}

// A suspended user is signed out everywhere and cannot sign in again until unsuspended
export async function setUserSuspended(db: D1Database, id: string, suspended: boolean) {
    await db.batch([
        db.prepare('UPDATE users SET suspended_at = ? WHERE id = ?').bind(suspended ? now() : null, id),
        ...(suspended ? [db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id)] : []),
    ]);
}

export async function deleteUserSessions(db: D1Database, userId: string) {
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

// Deletes the user with their sessions and carousel rows; returns the carousel ids so their files can go too
export async function deleteUser(db: D1Database, id: string): Promise<string[]> {
    const { results } = await db.prepare('SELECT id FROM carousels WHERE owner_id = ?').bind(id).all<{ id: string }>();
    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return results.map(row => row.id);
}

// --- Subscriptions (Polar, see routes/billing.ts) ---

// Subscription statuses that keep the plan's benefits. A past_due subscription (a renewal payment failed) keeps them
// too until the grace period after past_due_at ends, while Polar retries the card.
export const ACCESS_STATUSES = ['active', 'trialing'];

// "Now" and the start of the grace period (now minus the grace days), as ISO times
export interface AccessTimes {
    now: string;
    graceStart: string;
}

export interface SubscriptionRow {
    id: string;
    userId: string;
    productId: string;
    plan: PaidPlanId;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    pastDueAt: string | null;
    modifiedAt: string;
}

const toSubscription = (row: any): SubscriptionRow => ({
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end ?? null,
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
    pastDueAt: row.past_due_at ?? null,
    modifiedAt: row.modified_at,
});

// Whether the subscription grants its plan at `at`
export const grantsAccess = (subscription: Pick<SubscriptionRow, 'status' | 'pastDueAt' | 'modifiedAt'>, at: AccessTimes) =>
    ACCESS_STATUSES.includes(subscription.status)
    || (subscription.status === 'past_due' && (subscription.pastDueAt ?? subscription.modifiedAt) >= at.graceStart);

const rank = (column: string) => `CASE ${column} ${PAID_PLAN_IDS.map((id, index) => `WHEN '${id}' THEN ${index + 1}`).join(' ')} ELSE 0 END`;

// SQL for a user's plan (inside UPDATE users): the better of their best subscription that grants access and an
// admin's unexpired override, else free. Binds graceStart, then now.
const EFFECTIVE_PLAN = `CASE MAX(
        COALESCE((SELECT MAX(${rank('s.plan')}) FROM subscriptions s WHERE s.user_id = users.id
            AND (s.status IN (${ACCESS_STATUSES.map(status => `'${status}'`).join(', ')})
                OR (s.status = 'past_due' AND COALESCE(s.past_due_at, s.modified_at) >= ?))), 0),
        CASE WHEN users.plan_override IS NOT NULL AND (users.plan_override_until IS NULL OR users.plan_override_until > ?)
            THEN ${rank('users.plan_override')} ELSE 0 END)
    ${PAID_PLAN_IDS.map((id, index) => `WHEN ${index + 1} THEN '${id}'`).join(' ')} ELSE 'free' END`;

// Sets the user's plan from their subscriptions and override
export async function refreshPlan(db: D1Database, userId: string, at: AccessTimes) {
    await db.prepare(`UPDATE users SET plan = ${EFFECTIVE_PLAN} WHERE id = ?`).bind(at.graceStart, at.now, userId).run();
}

// The daily job: plans whose grace period or override ran out drop to what is left, and expired overrides are cleared
export async function refreshAllPlans(db: D1Database, at: AccessTimes) {
    await db.batch([
        db.prepare(`UPDATE users SET plan = ${EFFECTIVE_PLAN} WHERE plan != ${EFFECTIVE_PLAN}`).bind(at.graceStart, at.now, at.graceStart, at.now),
        db.prepare(`UPDATE users SET plan_override = NULL, plan_override_until = NULL, plan_override_reason = NULL
            WHERE plan_override_until IS NOT NULL AND plan_override_until <= ?`).bind(at.now),
    ]);
}

// Stores the subscription unless the stored version is newer (webhooks can arrive out of order), then refreshes the
// user's plan. False when a newer version was already stored.
export async function saveSubscription(db: D1Database, subscription: SubscriptionRow, at: AccessTimes): Promise<boolean> {
    const [stored] = await db.batch([
        db.prepare(`INSERT INTO subscriptions (id, user_id, product_id, plan, status, current_period_end, cancel_at_period_end, past_due_at,
                modified_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET product_id = excluded.product_id, plan = excluded.plan, status = excluded.status,
                current_period_end = excluded.current_period_end, cancel_at_period_end = excluded.cancel_at_period_end,
                past_due_at = excluded.past_due_at, modified_at = excluded.modified_at
            WHERE excluded.modified_at >= subscriptions.modified_at`)
            .bind(subscription.id, subscription.userId, subscription.productId, subscription.plan, subscription.status,
                subscription.currentPeriodEnd, subscription.cancelAtPeriodEnd ? 1 : 0, subscription.pastDueAt, subscription.modifiedAt, now()),
        db.prepare(`UPDATE users SET plan = ${EFFECTIVE_PLAN} WHERE id = ?`).bind(at.graceStart, at.now, subscription.userId),
    ]);
    return stored.meta.changes > 0;
}

// The user's subscription that gives them their plan, else their latest one
export async function getCurrentSubscription(db: D1Database, userId: string, at: AccessTimes): Promise<SubscriptionRow | null> {
    const subscriptions = await getSubscriptions(db, userId);
    return subscriptions.find(subscription => grantsAccess(subscription, at)) ?? subscriptions[0] ?? null;
}

// All of the user's stored subscriptions, newest first
export async function getSubscriptions(db: D1Database, userId: string): Promise<SubscriptionRow[]> {
    const { results } = await db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY modified_at DESC').bind(userId).all();
    return results.map(toSubscription);
}

// Users with a subscription that still grants access although its paid period ended before `before`: Polar renews or
// ends a subscription at the end of its period and tells us by webhook, so these may have missed one. Oldest first.
export async function listOverdueSubscriptionUsers(db: D1Database, before: string, limit: number): Promise<string[]> {
    const statuses = [...ACCESS_STATUSES, 'past_due'];
    const { results } = await db.prepare(`SELECT user_id FROM subscriptions
        WHERE status IN (${statuses.map(() => '?').join(', ')}) AND current_period_end IS NOT NULL AND current_period_end < ?
        GROUP BY user_id ORDER BY MIN(current_period_end) LIMIT ?`).bind(...statuses, before, limit).all<{ user_id: string }>();
    return results.map(row => row.user_id);
}

// --- Plan overrides ("comps" an admin gives) ---

export async function setPlanOverride(db: D1Database, userId: string, override: { plan: PaidPlanId; until: string | null; reason: string | null } | null, at: AccessTimes) {
    await db.batch([
        db.prepare('UPDATE users SET plan_override = ?, plan_override_until = ?, plan_override_reason = ? WHERE id = ?')
            .bind(override?.plan ?? null, override?.until ?? null, override?.reason ?? null, userId),
        db.prepare(`UPDATE users SET plan = ${EFFECTIVE_PLAN} WHERE id = ?`).bind(at.graceStart, at.now, userId),
    ]);
}

// --- Support requests (cancellations, the contact form; see migrations/0004) ---

export type SupportCategory = 'cancellation' | 'billing' | 'bug' | 'account' | 'accessibility' | 'privacy' | 'idea' | 'other';

export interface SupportRequest {
    id: string;
    createdAt: string;
    category: SupportCategory;
    status: 'open' | 'done';
    userId: string | null;
    name: string | null;
    email: string | null;
    idNumber: string | null;
    plan: string | null;
    page: string | null;
    message: string | null;
    closedAt: string | null;
}

export async function createSupportRequest(
    db: D1Database,
    request: Pick<SupportRequest, 'id' | 'category'> & Partial<Omit<SupportRequest, 'id' | 'category' | 'createdAt' | 'closedAt'>>
) {
    const time = now();
    await db.prepare(`INSERT INTO support_requests (id, created_at, category, status, user_id, name, email, id_number, plan, page, message, closed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(request.id, time, request.category, request.status ?? 'open', request.userId ?? null, request.name ?? null, request.email ?? null,
            request.idNumber ?? null, request.plan ?? null, request.page ?? null, request.message ?? null, request.status === 'done' ? time : null)
        .run();
}

const toSupportRequest = (row: any): SupportRequest => ({
    id: row.id, createdAt: row.created_at, category: row.category, status: row.status, userId: row.user_id, name: row.name,
    email: row.email, idNumber: row.id_number, plan: row.plan, page: row.page, message: row.message, closedAt: row.closed_at,
});

// Open requests first, then the latest closed ones
export async function listSupportRequests(db: D1Database, limit = 100): Promise<SupportRequest[]> {
    const { results } = await db.prepare(`SELECT * FROM support_requests ORDER BY status = 'open' DESC, created_at DESC LIMIT ?`).bind(limit).all();
    return results.map(toSupportRequest);
}

export async function closeSupportRequest(db: D1Database, id: string): Promise<boolean> {
    const result = await db.prepare(`UPDATE support_requests SET status = 'done', closed_at = ? WHERE id = ? AND status = 'open'`).bind(now(), id).run();
    return result.meta.changes > 0;
}

// --- Webhook deliveries we could not use (shown on the admin page) ---

export interface IgnoredWebhook {
    receivedAt: string;
    type: string;
    subscriptionId: string | null;
    productId: string | null;
    userId: string | null;
    reason: string;
}

export async function recordIgnoredWebhook(db: D1Database, event: Omit<IgnoredWebhook, 'receivedAt'>) {
    await db.batch([
        db.prepare('INSERT INTO webhook_ignored (received_at, type, subscription_id, product_id, user_id, reason) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(now(), event.type, event.subscriptionId, event.productId, event.userId, event.reason),
        db.prepare('DELETE FROM webhook_ignored WHERE id NOT IN (SELECT id FROM webhook_ignored ORDER BY id DESC LIMIT 20)'),
    ]);
}

export async function listIgnoredWebhooks(db: D1Database): Promise<IgnoredWebhook[]> {
    const { results } = await db.prepare('SELECT * FROM webhook_ignored ORDER BY id DESC').all<any>();
    return results.map(row => ({
        receivedAt: row.received_at, type: row.type, subscriptionId: row.subscription_id, productId: row.product_id, userId: row.user_id, reason: row.reason,
    }));
}

// The time of the latest webhook delivery we handled, for the admin's billing health card
export async function lastWebhookAt(db: D1Database): Promise<string | null> {
    const row = await db.prepare('SELECT MAX(received_at) AS at FROM webhook_events').first<{ at: string | null }>();
    return row?.at ?? null;
}

// Records a webhook delivery; false when it was already handled
export async function markWebhookEvent(db: D1Database, id: string): Promise<boolean> {
    const result = await db.prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?) ON CONFLICT(id) DO NOTHING').bind(id, now()).run();
    return result.meta.changes > 0;
}

export async function unmarkWebhookEvent(db: D1Database, id: string) {
    await db.prepare('DELETE FROM webhook_events WHERE id = ?').bind(id).run();
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
    pollinations_model: 'POLLINATIONS_MODEL',
    image_moderation: 'IMAGE_MODERATION',
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

export type UsageColumn = 'carousels_created' | 'chat_requests' | 'image_requests' | 'blocked_requests' | 'exports' | 'quota_hits';

// The first day of this calendar month (UTC), as stored in usage_daily.day
export const monthStart = () => `${today().slice(0, 7)}-01`;

export async function getMonthlyUsage(db: D1Database, userId: string): Promise<MonthlyUsage> {
    const row: any = await db.prepare(`SELECT COALESCE(SUM(carousels_created), 0) AS carousels, COALESCE(SUM(chat_requests), 0) AS messages,
        COALESCE(SUM(image_requests), 0) AS images, COALESCE(SUM(tokens), 0) AS tokens
        FROM usage_daily WHERE user_id = ? AND day >= ?`).bind(userId, monthStart()).first();
    return {
        month: today().slice(0, 7),
        carousels: Number(row?.carousels ?? 0),
        messages: Number(row?.messages ?? 0),
        images: Number(row?.images ?? 0),
        tokens: Number(row?.tokens ?? 0),
    };
}

// Every usage row of the user, for the data export
export async function listUsage(db: D1Database, userId: string) {
    return (await db.prepare('SELECT day, carousels_created, chat_requests, image_requests, tokens FROM usage_daily WHERE user_id = ? ORDER BY day')
        .bind(userId).all()).results;
}

// The numbers on the admin dashboard
export async function getAdminStats(db: D1Database, at: AccessTimes) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const twoWeeksAgo = new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const [totals, plans, month, daily, top, payingCost] = await db.batch([
        db.prepare(`SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM users WHERE last_seen_at >= ?) AS active_week,
            (SELECT COUNT(*) FROM users WHERE suspended_at IS NOT NULL) AS suspended, (SELECT COUNT(*) FROM carousels) AS carousels,
            (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status IN (${ACCESS_STATUSES.map(status => `'${status}'`).join(', ')})
                OR (status = 'past_due' AND COALESCE(past_due_at, modified_at) >= ?)) AS paying,
            (SELECT COUNT(*) FROM users WHERE plan_override IS NOT NULL AND (plan_override_until IS NULL OR plan_override_until > ?)) AS comped`)
            .bind(weekAgo, at.graceStart, at.now),
        db.prepare('SELECT plan, COUNT(*) AS count FROM users GROUP BY plan'),
        db.prepare(`SELECT COALESCE(SUM(carousels_created), 0) AS carousels, COALESCE(SUM(chat_requests), 0) AS messages,
            COALESCE(SUM(image_requests), 0) AS images, COALESCE(SUM(tokens), 0) AS tokens, COALESCE(SUM(cost_micro_usd), 0) AS cost
            FROM usage_daily WHERE day >= ?`).bind(monthStart()),
        db.prepare(`SELECT day, SUM(chat_requests) AS messages, SUM(image_requests) AS images, SUM(tokens) AS tokens, SUM(cost_micro_usd) AS cost
            FROM usage_daily WHERE day >= ? GROUP BY day ORDER BY day`).bind(twoWeeksAgo),
        // The 20 users whose AI use cost the most this month
        db.prepare(`SELECT users.id, users.email, users.plan, SUM(usage_daily.cost_micro_usd) AS cost, SUM(usage_daily.chat_requests) AS messages,
            SUM(usage_daily.image_requests) AS images FROM usage_daily JOIN users ON users.id = usage_daily.user_id
            WHERE usage_daily.day >= ? GROUP BY users.id HAVING cost > 0 ORDER BY cost DESC LIMIT 20`).bind(monthStart()),
        db.prepare(`SELECT COALESCE(SUM(usage_daily.cost_micro_usd), 0) AS cost, COUNT(DISTINCT users.id) AS users FROM users
            LEFT JOIN usage_daily ON usage_daily.user_id = users.id AND usage_daily.day >= ? WHERE users.plan != 'free'`).bind(monthStart()),
    ]);
    const t: any = totals.results[0];
    const m: any = month.results[0];
    return {
        users: Number(t.users),
        activeLast7Days: Number(t.active_week),
        suspended: Number(t.suspended),
        carousels: Number(t.carousels),
        // Users whose subscription grants a plan, and users with a comp from an admin
        paying: Number(t.paying),
        comped: Number(t.comped),
        plans: Object.fromEntries(plans.results.map((row: any) => [row.plan, Number(row.count)])),
        month: { carousels: Number(m.carousels), messages: Number(m.messages), images: Number(m.images), tokens: Number(m.tokens), costMicroUsd: Number(m.cost) },
        daily: daily.results.map((row: any) => ({
            day: row.day, messages: Number(row.messages), images: Number(row.images), tokens: Number(row.tokens), costMicroUsd: Number(row.cost),
        })),
        topCost: top.results.map((row: any) => ({
            id: row.id, email: row.email, plan: row.plan, costMicroUsd: Number(row.cost), messages: Number(row.messages), images: Number(row.images),
        })),
        // This month's AI cost per user on a paid plan
        costPerPayingUserMicroUsd: (() => {
            const row: any = payingCost.results[0];
            return Number(row?.users) ? Math.round(Number(row.cost) / Number(row.users)) : 0;
        })(),
    };
}

// Counts one request of today's usage and returns today's total for that column
export async function addUsage(db: D1Database, userId: string, column: UsageColumn): Promise<number> {
    const row = await db.prepare(`INSERT INTO usage_daily (user_id, day, ${column}) VALUES (?, ?, 1)
        ON CONFLICT(user_id, day) DO UPDATE SET ${column} = ${column} + 1 RETURNING ${column} AS total`)
        .bind(userId, today()).first<{ total: number }>();
    return Number(row?.total ?? 1);
}

// Counts one use only while this month's total is under `limit`, in one statement: D1 runs statements one at a time,
// so parallel requests can't both take the last one. Returns the day it was counted on (to refund it), or null when
// the limit is used up.
export async function reserveUsage(db: D1Database, userId: string, column: UsageColumn, limit: number): Promise<string | null> {
    const day = today();
    const used = `(SELECT COALESCE(SUM(${column}), 0) FROM usage_daily WHERE user_id = ? AND day >= ?)`;
    const row = await db.prepare(`INSERT INTO usage_daily (user_id, day, ${column}) SELECT ?, ?, 1 WHERE ${used} < ?
        ON CONFLICT(user_id, day) DO UPDATE SET ${column} = ${column} + 1 WHERE ${used} < ?
        RETURNING ${column} AS total`)
        .bind(userId, day, userId, monthStart(), limit, userId, monthStart(), limit).first();
    return row ? day : null;
}

// Gives back a use counted on `day`, when the request it was for failed
export async function refundUsage(db: D1Database, userId: string, column: UsageColumn, day: string) {
    await db.prepare(`UPDATE usage_daily SET ${column} = MAX(${column} - 1, 0) WHERE user_id = ? AND day = ?`).bind(userId, day).run();
}

// What an AI call used: its tokens and estimated cost (see shared/ai-pricing.ts)
export async function addAiUsage(db: D1Database, userId: string, usage: { input: number; output: number; cached: number; costMicroUsd: number }) {
    await db.prepare(`INSERT INTO usage_daily (user_id, day, tokens, input_tokens, output_tokens, cached_tokens, cost_micro_usd)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, day) DO UPDATE SET tokens = tokens + excluded.tokens, input_tokens = input_tokens + excluded.input_tokens,
            output_tokens = output_tokens + excluded.output_tokens, cached_tokens = cached_tokens + excluded.cached_tokens,
            cost_micro_usd = cost_micro_usd + excluded.cost_micro_usd`)
        .bind(userId, today(), usage.input + usage.output, usage.input, usage.output, usage.cached, usage.costMicroUsd).run();
}

// The daily cron job: drops expired sessions, finished rate-limit windows, usage older than a year and old webhook ids
export async function cleanUp(db: D1Database) {
    const yearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await db.batch([
        db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now()),
        db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(Date.now() - 2 * 24 * 3600 * 1000),
        db.prepare('DELETE FROM usage_daily WHERE day < ?').bind(yearAgo),
        db.prepare('DELETE FROM webhook_events WHERE received_at < ?').bind(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
    ]);
}
