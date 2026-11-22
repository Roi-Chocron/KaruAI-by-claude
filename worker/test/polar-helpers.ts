import { vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { signWebhook } from '../src/polar';
import { api } from './helpers';

export const DAY = 24 * 3600 * 1000;
export const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString();

let deliveries = 0;

// Delivers a Polar webhook signed with the test secret
export async function deliver(event: unknown, options: { id?: string; secret?: string } = {}) {
    const body = JSON.stringify(event);
    const id = options.id ?? `msg_${++deliveries}_${crypto.randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    return api('/api/billing/webhook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'webhook-id': id,
            'webhook-timestamp': String(timestamp),
            'webhook-signature': await signWebhook(options.secret ?? env.POLAR_WEBHOOK_SECRET, id, timestamp, body),
        },
        body,
    });
}

export const subscriptionEvent = (type: string, userId: string, fields: Record<string, unknown> = {}) => ({
    type,
    timestamp: new Date().toISOString(),
    data: {
        id: 'sub_1',
        status: 'active',
        product_id: 'prod-pro',
        current_period_start: '2026-11-22T00:00:00Z',
        current_period_end: '2026-12-22T00:00:00Z',
        cancel_at_period_end: false,
        past_due_at: null,
        created_at: '2026-11-22T00:00:00Z',
        modified_at: '2026-11-22T00:00:00Z',
        metadata: {},
        customer: { external_id: userId },
        ...fields,
    },
});

export const planOf = async (cookie: string) => (await (await api('/api/account', { cookie })).json<any>()).plan.id;

export type PolarCall = { url: string; path: string; method: string; body: any; headers: Headers };

// Answers the Worker's calls to Polar's sandbox API with `reply` and records them
export function mockPolar(reply: (call: PolarCall) => Response | Promise<Response>) {
    const calls: PolarCall[] = [];
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        if (!url.startsWith('https://sandbox-api.polar.sh/')) return realFetch(input, init);
        const call = {
            url,
            path: new URL(url).pathname,
            method: (init?.method ?? 'GET').toUpperCase(),
            body: init?.body ? JSON.parse(String(init.body)) : null,
            headers: new Headers(init?.headers),
        };
        calls.push(call);
        return reply(call);
    });
    return calls;
}

// Polar's list of subscriptions, as GET /v1/subscriptions/ answers it
export const subscriptionList = (...items: unknown[]) => Response.json({ items, pagination: { total_count: items.length, max_page: 1 } });
