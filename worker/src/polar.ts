import { PAID_PLAN_IDS, type PaidPlanId } from '../../shared/plans';

// Polar (https://polar.sh/docs) over plain fetch: checkouts, customer portal sessions, subscriptions and webhook
// signatures. The user's KaruAI id is their Polar "external customer id", so no Polar ids need to be stored up front.
// The access token needs the scopes checkouts:read, checkouts:write, customer_sessions:write, subscriptions:read,
// subscriptions:write, customers:write, orders:read, refunds:write and products:read.

// API version pinned, so Polar's quarterly changes reach us only when we choose to move. Polar keeps a version for
// about nine months: 2026-10 is deprecated in January 2027 and removed in April 2027 (move the webhook endpoint too).
export const POLAR_VERSION = '2026-10';

// Charged in shekels, as the site shows the prices; without this Polar picks a currency from the buyer's location
const CURRENCY = 'ils';

export class PolarError extends Error {
    constructor(message: string, readonly status: number, readonly versionHeader: string | null = null) {
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

// The Polar-Version header of Polar's last answer, for the admin's billing health card
export let lastPolarVersion: string | null = null;

async function polarRequest<T>(env: PolarEnv, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
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
    lastPolarVersion = response.headers.get('polar-version') ?? lastPolarVersion;
    if (!response.ok) {
        const detail = (await response.text()).trim().slice(0, 500);
        throw new PolarError(`Polar ${method} ${path.split('?')[0]} failed with status ${response.status}: ${detail}`, response.status);
    }
    return (response.status === 204 ? null : await response.json()) as T;
}

// null instead of an error when Polar has no such object
async function orNull<T>(request: Promise<T>): Promise<T | null> {
    try {
        return await request;
    } catch (error) {
        if (error instanceof PolarError && (error.status === 404 || error.status === 422)) return null;
        throw error;
    }
}

// A hosted checkout page for the plan; returns its URL
export async function createCheckout(
    env: PolarEnv,
    options: { plan: PaidPlanId; userId: string; email: string; name: string; ip: string | null; locale: 'en' | 'he'; successUrl: string; returnUrl: string }
): Promise<string> {
    const body = {
        products: [productId(env, options.plan)],
        currency: CURRENCY,
        // Polar's checkout falls back to English for a language it doesn't have yet (Hebrew, for now)
        locale: options.locale,
        external_customer_id: options.userId,
        customer_email: options.email,
        customer_name: options.name || undefined,
        // The checkout is created by the Worker, so Polar would otherwise place the buyer (country, tax) by our IP
        customer_ip_address: options.ip ?? undefined,
        success_url: options.successUrl,
        return_url: options.returnUrl,
        // Copied to the subscription, so its webhooks can name the user even if the customer has no external id
        metadata: { user_id: options.userId, plan: options.plan },
    };
    try {
        return (await polarRequest<{ url: string }>(env, 'POST', '/v1/checkouts/', body)).url;
    } catch (error) {
        // Polar refuses an email it thinks cannot receive mail (it checks the domain); the buyer then types one on the
        // checkout page instead
        if (!(error instanceof PolarError) || error.status !== 422 || !error.message.includes('customer_email')) throw error;
        console.warn(JSON.stringify({ event: 'polar_checkout_without_email', userId: options.userId }));
        return (await polarRequest<{ url: string }>(env, 'POST', '/v1/checkouts/', { ...body, customer_email: undefined })).url;
    }
}

// Polar's customer portal, where the user changes plan, updates the card, cancels and downloads invoices
export async function createPortalSession(env: PolarEnv, userId: string, returnUrl: string): Promise<string> {
    const session = await polarRequest<{ customer_portal_url: string }>(env, 'POST', '/v1/customer-sessions/', {
        external_customer_id: userId,
        return_url: returnUrl,
    });
    return session.customer_portal_url;
}

// One page (up to 100) of the organization's subscriptions that match `filters` (see GET /v1/subscriptions/)
export async function listSubscriptionsPage(env: PolarEnv, filters: Record<string, string>, page = 1) {
    const query = new URLSearchParams({ ...filters, limit: '100', page: String(page) });
    const result = await polarRequest<{ items: PolarSubscription[]; pagination: { max_page: number } }>(env, 'GET', `/v1/subscriptions/?${query}`);
    return { items: result.items, maxPage: result.pagination?.max_page ?? 1 };
}

// Every subscription the user has on Polar, whatever its status (one page holds them all: a user has a few at most)
export async function listSubscriptions(env: PolarEnv, userId: string): Promise<PolarSubscription[]> {
    return (await listSubscriptionsPage(env, { external_customer_id: userId })).items;
}

export interface PolarCheckout {
    id: string;
    status: 'open' | 'expired' | 'confirmed' | 'succeeded' | 'failed';
    external_customer_id: string | null;
    metadata?: Record<string, unknown>;
}

// A checkout session, or null when there is none with that id
export const getCheckout = (env: PolarEnv, id: string) => orNull(polarRequest<PolarCheckout>(env, 'GET', `/v1/checkouts/${encodeURIComponent(id)}`));

export type CancellationReason = 'customer_service' | 'low_quality' | 'missing_features' | 'switched_service' | 'too_complex' | 'too_expensive' | 'unused' | 'other';

// Cancels at the end of the period (or undoes that), or revokes the subscription now; returns it as it now is
export function updateSubscription(
    env: PolarEnv,
    id: string,
    change: { cancel_at_period_end: boolean } | { revoke: true },
    reason?: CancellationReason
): Promise<PolarSubscription> {
    return polarRequest<PolarSubscription>(env, 'PATCH', `/v1/subscriptions/${encodeURIComponent(id)}`, {
        ...change,
        ...(reason ? { customer_cancellation_reason: reason } : {}),
    });
}

export interface PolarOrder {
    id: string;
    status: 'draft' | 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'void';
    created_at: string;
    total_amount: number;
    refundable_amount: number;
    currency: string;
    subscription_id: string | null;
}

export const getOrder = (env: PolarEnv, id: string) => orNull(polarRequest<PolarOrder & { refunded_amount: number }>(env, 'GET', `/v1/orders/${encodeURIComponent(id)}`));

// The subscription's orders, newest first
export async function listOrders(env: PolarEnv, subscriptionId: string): Promise<PolarOrder[]> {
    const query = new URLSearchParams({ subscription_id: subscriptionId, sorting: '-created_at', limit: '20' });
    return (await polarRequest<{ items: PolarOrder[] }>(env, 'GET', `/v1/orders/?${query}`)).items;
}

// Refunds part of an order (amount in agorot, before tax); the subscription itself is changed separately
export function createRefund(env: PolarEnv, orderId: string, amount: number, comment: string) {
    return polarRequest<{ id: string; amount: number; status: string }>(env, 'POST', '/v1/refunds/', {
        order_id: orderId,
        amount,
        reason: 'customer_request',
        comment,
    });
}

// Deletes the user's Polar customer, which cancels their subscriptions, and anonymizes it; false when Polar has none
export async function deleteCustomer(env: PolarEnv, userId: string): Promise<boolean> {
    const result = await orNull(polarRequest<null>(env, 'DELETE', `/v1/customers/external/${encodeURIComponent(userId)}?anonymize=true`).then(() => true));
    return result === true;
}

export interface PolarProduct {
    id: string;
    name: string;
    is_archived: boolean;
    recurring_interval: string | null;
    prices: { amount_type: string; price_amount?: number; price_currency: string; is_archived: boolean }[];
}

export const getProduct = (env: PolarEnv, id: string) => orNull(polarRequest<PolarProduct>(env, 'GET', `/v1/products/${encodeURIComponent(id)}`));

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
    current_period_start?: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    past_due_at?: string | null;
    created_at: string;
    modified_at: string | null;
    metadata?: Record<string, unknown>;
    customer?: { external_id?: string | null };
}

