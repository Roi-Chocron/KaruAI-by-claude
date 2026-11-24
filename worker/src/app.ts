import { Hono, type Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { User } from '../../types';
import { PLANS, type PlanLimits } from '../../shared/plans';
import { addUsage, createSession, deleteSession, getUserBySession, hitRateWindow, refundUsage, reserveUsage, SESSION_DAYS, today, type UsageColumn } from './db';

export type AppEnv = { Bindings: Env; Variables: { user: User; quotaDay?: string } };
export type AppContext = Context<AppEnv>;
export const createApp = () => new Hono<AppEnv>();

export const errorJson = (c: AppContext, message: string, status: 400 | 401 | 402 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 451 | 500 | 502 | 503, extra?: Record<string, unknown>) =>
    c.json({ error: message, ...extra }, status);

// --- Sessions ---
// The session cookie is HttpOnly. A second, readable cookie only tells the static pages that someone is signed in
// (so the landing page can go straight to the dashboard without asking the API); it grants nothing.

export const SESSION_COOKIE = 'karu_session';
export const SIGNED_IN_COOKIE = 'karu_signed_in';

export const isSecure = (env: Env) => env.APP_URL.startsWith('https://');

export async function startSession(c: AppContext, userId: string) {
    const { token } = await createSession(c.env.DB, userId);
    const options = { path: '/', secure: isSecure(c.env), sameSite: 'Lax' as const, maxAge: SESSION_DAYS * 24 * 3600 };
    setCookie(c, SESSION_COOKIE, token, { ...options, httpOnly: true });
    setCookie(c, SIGNED_IN_COOKIE, '1', options);
}

export function clearSessionCookies(c: AppContext) {
    deleteCookie(c, SESSION_COOKIE, { path: '/', secure: isSecure(c.env) });
    deleteCookie(c, SIGNED_IN_COOKIE, { path: '/', secure: isSecure(c.env) });
}

export async function endSession(c: AppContext) {
    const token = getCookie(c, SESSION_COOKIE);
    if (token) await deleteSession(c.env.DB, token);
    clearSessionCookies(c);
}

export async function currentUser(c: AppContext): Promise<User | null> {
    const token = getCookie(c, SESSION_COOKIE);
    return token ? getUserBySession(c.env.DB, token) : null;
}

export const SUSPENDED_MESSAGE = 'This account is suspended. Please contact support.';

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
    const user = await currentUser(c);
    if (!user || user.suspendedAt) {
        clearSessionCookies(c);
        return user ? errorJson(c, SUSPENDED_MESSAGE, 403, { code: 'suspended' }) : errorJson(c, 'Please sign in.', 401);
    }
    c.set('user', user);
    await next();
});

// The "Dev login" form works only on a local address with DEV_LOGIN=true, so a forgotten flag cannot open
// production to anyone who types an email
export function devLoginEnabled(env: Env): boolean {
    const hostname = new URL(env.APP_URL).hostname;
    return (env as { DEV_LOGIN?: string }).DEV_LOGIN === 'true' && (hostname === 'localhost' || hostname === '127.0.0.1');
}

// Use after requireUser
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
    if (c.get('user').role !== 'admin') return errorJson(c, 'Only admins can do that.', 403);
    await next();
});

// Requests that change something must come from the app's own pages. SameSite=Lax cookies already stop most
// cross-site requests; this also covers sibling subdomains, which count as "same site".
export const sameOrigin = createMiddleware<AppEnv>(async (c, next) => {
    const origin = c.req.header('origin');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) && origin && origin !== new URL(c.env.APP_URL).origin) {
        return errorJson(c, 'Cross-origin request refused.', 403);
    }
    await next();
});

// The body's size from Content-Length, or null when it is missing or over `max`
export function bodySize(c: AppContext, max: number): number | null {
    const length = Number(c.req.header('content-length'));
    return Number.isInteger(length) && length > 0 && length <= max ? length : null;
}

// --- Rate limits and daily quotas ---

const MINUTE = 60_000;

// Fixed windows counted in D1, so they hold across all of Cloudflare's servers
export const LIMITS = {
    authIp: { limit: 30, windowMs: 15 * MINUTE },
    chatUser: { limit: 20, windowMs: MINUTE },
    imagesUser: { limit: 30, windowMs: MINUTE },
    // Asking Polar for the user's subscriptions (the billing page, and its polling after a checkout)
    billingSync: { limit: 40, windowMs: 10 * MINUTE },
    // Checkouts, portal sessions and cancellations
    billingUser: { limit: 10, windowMs: MINUTE },
    // Support requests and cancellation requests sent without signing in
    supportIp: { limit: 5, windowMs: 60 * MINUTE },
} as const;


// Cloudflare sets this header itself, so a client cannot fake it
export const clientIp = (c: AppContext) => c.req.header('cf-connecting-ip') ?? 'unknown';

export function tooManyRequests(c: AppContext, retryAfterSeconds: number, message?: string) {
    const wait = retryAfterSeconds < 90 ? `${retryAfterSeconds} seconds` : `${Math.ceil(retryAfterSeconds / 60)} minutes`;
    c.header('Retry-After', String(retryAfterSeconds));
    return errorJson(c, message ?? `Too many requests. Please try again in ${wait}.`, 429, { retryable: false, retryAfterSeconds });
}

// A 429 response when `subject` is over the rule's limit, else null
export async function rateLimit(c: AppContext, rule: keyof typeof LIMITS, subject: string): Promise<Response | null> {
    const { limit, windowMs } = LIMITS[rule];
    const { count, resetsAt } = await hitRateWindow(c.env.DB, `${rule}:${subject}`, windowMs);
    if (count <= limit) return null;
    return tooManyRequests(c, Math.max(1, Math.ceil((resetsAt - Date.now()) / 1000)));
}

// --- Plan quotas (monthly, see shared/plans.ts) ---

const QUOTAS = {
    carousels: { column: 'carousels_created', usage: 'carousels', limit: 'carouselsPerMonth', noun: 'new carousels' },
    messages: { column: 'chat_requests', usage: 'messages', limit: 'aiMessagesPerMonth', noun: 'AI messages' },
    images: { column: 'image_requests', usage: 'images', limit: 'aiImagesPerMonth', noun: 'AI images' },
} as const satisfies Record<string, { column: UsageColumn; usage: string; limit: keyof PlanLimits; noun: string }>;

export type QuotaKind = keyof typeof QUOTAS;

// Takes one `kind` from the user's plan for this month, or answers 402 when none is left. The check and the count are
// one database statement, so parallel requests can't overrun the limit. A request that then fails gives the use back
// with refundQuota(). Admins are counted but never limited.
export async function useQuota(c: AppContext, kind: QuotaKind): Promise<Response | null> {
    const user = c.get('user');
    const quota = QUOTAS[kind];
    const plan = PLANS[user.plan] ?? PLANS.free;
    const limit = plan.limits[quota.limit];
    if (limit === null || user.role === 'admin') {
        await addUsage(c.env.DB, user.id, quota.column);
        c.set('quotaDay', today());
        return null;
    }
    const day = await reserveUsage(c.env.DB, user.id, quota.column, limit);
    if (day) {
        c.set('quotaDay', day);
        return null;
    }
    c.executionCtx.waitUntil(addUsage(c.env.DB, user.id, 'quota_hits').then(() => undefined));
    return errorJson(c,
        `You used all ${limit} ${quota.noun} of the ${plan.name} plan this month. Upgrade your plan or wait for next month.`,
        402, { code: 'quota_exceeded', kind, limit, upgradeUrl: '/billing', retryable: false });
}

// Gives back the use useQuota() took, when the request failed or was refused
export async function refundQuota(c: AppContext, kind: QuotaKind) {
    const day = c.get('quotaDay');
    if (day) await refundUsage(c.env.DB, c.get('user').id, QUOTAS[kind].column, day);
}
