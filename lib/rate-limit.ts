import { NextResponse } from 'next/server';

// In-memory sliding-window rate limiter. The app runs as one Node process (SQLite on local disk), so a
// per-process Map is enough; counts reset on a restart. Kept on globalThis so dev hot reloads keep them.

type Limit = { limit: number; windowMs: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Each rule is checked separately; a request must pass all of the rules it is checked against
export const LIMITS = {
    loginIp: { limit: 20, windowMs: 15 * MINUTE },
    loginEmail: { limit: 10, windowMs: 15 * MINUTE },
    registerIp: { limit: 5, windowMs: HOUR },
    forgotIp: { limit: 5, windowMs: 15 * MINUTE },
    forgotEmail: { limit: 3, windowMs: HOUR },
    resetIp: { limit: 10, windowMs: 15 * MINUTE },
    chatUserMinute: { limit: 20, windowMs: MINUTE },
    chatUserDay: { limit: 500, windowMs: DAY },
    imagesUserMinute: { limit: 30, windowMs: MINUTE },
    imagesUserDay: { limit: 500, windowMs: DAY },
} satisfies Record<string, Limit>;

type RuleName = keyof typeof LIMITS;

const store = (() => {
    const cache = globalThis as { __karuRateLimits?: Map<string, number[]> };
    cache.__karuRateLimits ??= new Map();
    return cache.__karuRateLimits;
})();

let lastSweep = Date.now();

// Drops keys with no hits left in their window, so the map does not grow without bound
function sweep(time: number) {
    if (time - lastSweep < 5 * MINUTE) return;
    lastSweep = time;
    for (const [key, hits] of store) {
        const rule = LIMITS[key.slice(0, key.indexOf(':')) as RuleName];
        if (!rule || hits.length === 0 || hits[hits.length - 1] <= time - rule.windowMs) store.delete(key);
    }
}

// Records a hit for every check and returns the longest wait (in seconds) among the rules that are over
// their limit, or 0 when the request may go ahead. A refused request is not counted.
export function checkRateLimits(checks: [RuleName, string][]): number {
    const time = Date.now();
    sweep(time);
    let retryAfterMs = 0;
    const windows = checks.map(([rule, id]) => {
        const { limit, windowMs } = LIMITS[rule];
        const key = `${rule}:${id}`;
        const hits = (store.get(key) ?? []).filter(hit => hit > time - windowMs);
        store.set(key, hits);
        if (hits.length >= limit) retryAfterMs = Math.max(retryAfterMs, hits[0] + windowMs - time);
        return hits;
    });
    if (retryAfterMs > 0) return Math.max(1, Math.ceil(retryAfterMs / 1000));
    for (const hits of windows) hits.push(time);
    return 0;
}

// The client's IP. Assumes the app sits behind a proxy that sets X-Real-IP / X-Forwarded-For
// (Vercel, nginx, ...); without one these headers are client-controlled, which is why the login and
// password-reset limits are also keyed by email.
export function clientIp(request: Request): string {
    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded || 'unknown';
}

export function tooManyRequests(retryAfterSeconds: number) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    const wait = retryAfterSeconds < 90 ? `${retryAfterSeconds} seconds` : `${minutes} minutes`;
    return NextResponse.json(
        { error: `Too many requests. Please try again in ${wait}.`, retryable: false, retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
}
