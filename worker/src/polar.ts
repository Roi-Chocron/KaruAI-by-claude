import { PAID_PLAN_IDS, type PaidPlanId } from '../../shared/plans';

// Polar (https://polar.sh/docs) over plain fetch: checkouts, customer portal sessions, subscriptions and webhook
// signatures. The user's KaruAI id is their Polar "external customer id", so no Polar ids need to be stored up front.
// The access token needs the scopes checkouts:write, customer_sessions:write and subscriptions:read.

// API version pinned, so Polar's quarterly changes reach us only when we choose to move. Polar keeps a version for
// about nine months: 2026-10 is deprecated in January 2027 and removed in April 2027 (move the webhook endpoint too).
const POLAR_VERSION = '2026-10';

// Charged in shekels, as the site shows the prices; without this Polar picks a currency from the buyer's location
const CURRENCY = 'ils';

export class PolarError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
    }
}

export type PolarEnv = Pick<Env, 'POLAR_SERVER' | 'POLAR_ACCESS_TOKEN' | 'POLAR_PRODUCT_BASIC' | 'POLAR_PRODUCT_PRO' | 'POLAR_PRODUCT_VIP'>;

const apiBase = (env: PolarEnv) => (env.POLAR_SERVER === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh');

export function productId(env: PolarEnv, plan: PaidPlanId): string | undefined {
    return { basic: env.POLAR_PRODUCT_BASIC, pro: env.POLAR_PRODUCT_PRO, vip: env.POLAR_PRODUCT_VIP }[plan] || undefined;
}

export const polarConfigured = (env: PolarEnv) => !!env.POLAR_ACCESS_TOKEN && PAID_PLAN_IDS.every(plan => !!productId(env, plan));

export function planForProduct(env: PolarEnv, id: string): PaidPlanId | null {
    return PAID_PLAN_IDS.find(plan => productId(env, plan) === id) ?? null;
}

async function polarRequest<T>(env: PolarEnv, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const started = Date.now();
    const response = await fetch(`${apiBase(env)}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
            'Polar-Version': POLAR_VERSION,
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
    });
    // The path without its query, which can hold a user id
    console.log(JSON.stringify({ event: 'polar', method, path: path.split('?')[0], status: response.status, durationMs: Date.now() - started }));
    if (!response.ok) {
        const detail = (await response.text()).trim().slice(0, 500);
        throw new PolarError(`Polar ${method} ${path.split('?')[0]} failed with status ${response.status}: ${detail}`, response.status);
    }
    return response.json<T>();
}

// A hosted checkout page for the plan; returns its URL
export async function createCheckout(
    env: PolarEnv,
    options: { plan: PaidPlanId; userId: string; email: string; name: string; ip: string | null; successUrl: string; returnUrl: string }
): Promise<string> {
    const checkout = await polarRequest<{ url: string }>(env, 'POST', '/v1/checkouts/', {
        products: [productId(env, options.plan)],
        currency: CURRENCY,
        external_customer_id: options.userId,
        customer_email: options.email,
        customer_name: options.name || undefined,
        // The checkout is created by the Worker, so Polar would otherwise place the buyer (country, tax) by our IP
        customer_ip_address: options.ip ?? undefined,
        success_url: options.successUrl,
        return_url: options.returnUrl,
        // Copied to the subscription, so its webhooks can name the user even if the customer has no external id
        metadata: { user_id: options.userId, plan: options.plan },
    });
    return checkout.url;
}

// Polar's customer portal, where the user changes plan, updates the card, cancels and downloads invoices
export async function createPortalSession(env: PolarEnv, userId: string, returnUrl: string): Promise<string> {
    const session = await polarRequest<{ customer_portal_url: string }>(env, 'POST', '/v1/customer-sessions/', {
        external_customer_id: userId,
        return_url: returnUrl,
    });
    return session.customer_portal_url;
}

// Every subscription the user has on Polar, whatever its status (one page holds them all: a user has a few at most)
export async function listSubscriptions(env: PolarEnv, userId: string): Promise<PolarSubscription[]> {
    const query = new URLSearchParams({ external_customer_id: userId, limit: '100' });
    const page = await polarRequest<{ items: PolarSubscription[] }>(env, 'GET', `/v1/subscriptions/?${query}`);
    return page.items;
}

// --- Webhooks (Standard Webhooks: https://www.standardwebhooks.com) ---

const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

const base64ToBytes = (text: string) => Uint8Array.from(atob(text), char => char.charCodeAt(0));
const bytesToBase64 = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));

// Polar's secrets look like "whsec_…". Newer ones are Standard Webhooks secrets (the part after the prefix is the
// base64 key); older ones are used as the UTF-8 bytes of the whole string. Both keys are tried.
function signingKeys(secret: string): Uint8Array[] {
    const keys = [new TextEncoder().encode(secret)];
    try {
        keys.unshift(base64ToBytes(secret.replace(/^whsec_/, '')));
    } catch {
        // Not base64: only the older kind of key applies
    }
    return keys;
}

async function hmacBase64(key: Uint8Array, content: string): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return bytesToBase64(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(content)));
}

function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

// True when the delivery is signed with the secret and recent (an old delivery replayed is refused)
export async function verifyWebhook(secret: string, headers: Headers, body: string, nowMs = Date.now()): Promise<boolean> {
    const id = headers.get('webhook-id');
    const timestamp = headers.get('webhook-timestamp');
    const signatures = headers.get('webhook-signature');
    if (!secret || !id || !timestamp || !signatures || !/^\d+$/.test(timestamp)) return false;
    if (Math.abs(nowMs / 1000 - Number(timestamp)) > WEBHOOK_TOLERANCE_SECONDS) return false;

    const given = signatures.split(' ').filter(part => part.startsWith('v1,')).map(part => part.slice(3));
    for (const key of signingKeys(secret)) {
        const expected = await hmacBase64(key, `${id}.${timestamp}.${body}`);
        if (given.some(signature => timingSafeEqual(signature, expected))) return true;
    }
    return false;
}

// Signs a delivery the way Polar does; for the tests
export async function signWebhook(secret: string, id: string, timestamp: number, body: string): Promise<string> {
    return `v1,${await hmacBase64(signingKeys(secret)[0], `${id}.${timestamp}.${body}`)}`;
}

// The parts of Polar's Subscription object we use
export interface PolarSubscription {
    id: string;
    status: string;
    product_id: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    created_at: string;
    modified_at: string | null;
    metadata?: Record<string, unknown>;
    customer?: { external_id?: string | null };
}

// Statuses that keep the plan's benefits (past_due, unpaid, canceled and the rest end them)
export const ACCESS_STATUSES = ['active', 'trialing'];
