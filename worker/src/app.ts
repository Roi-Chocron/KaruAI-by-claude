import { Hono, type Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { User } from '../../types';
import { createSession, deleteSession, getUserBySession, hitRateWindow, addUsage, SESSION_DAYS, type UsageColumn } from './db';

export type AppEnv = { Bindings: Env; Variables: { user: User } };
export type AppContext = Context<AppEnv>;
export const createApp = () => new Hono<AppEnv>();

export const errorJson = (c: AppContext, message: string, status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 429 | 500 | 502 | 503, extra?: Record<string, unknown>) =>
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

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
    const user = await currentUser(c);
    if (!user) {
        clearSessionCookies(c);
        return errorJson(c, 'Please sign in.', 401);
    }
    c.set('user', user);
    await next();
});

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

// --- Rate limits and daily quotas ---

const MINUTE = 60_000;

// Fixed windows counted in D1, so they hold across all of Cloudflare's servers
export const LIMITS = {
    authIp: { limit: 30, windowMs: 15 * MINUTE },
    chatUser: { limit: 20, windowMs: MINUTE },
    imagesUser: { limit: 30, windowMs: MINUTE },
} as const;

// Requests per user per UTC day. Plan-specific limits will come from the user's subscription.
export const DAILY_LIMITS: Record<UsageColumn, number> = {
    chat_requests: 500,
    image_requests: 500,
};

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

// Counts the request against today's quota; a 429 response when the quota is used up, else null
export async function dailyQuota(c: AppContext, column: UsageColumn): Promise<Response | null> {
    const total = await addUsage(c.env.DB, c.get('user').id, column);
    if (total <= DAILY_LIMITS[column]) return null;
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const seconds = Math.ceil((midnight.getTime() - Date.now()) / 1000);
    return tooManyRequests(c, seconds, `You reached today's limit of ${DAILY_LIMITS[column]} requests. It resets at midnight UTC.`);
}
