import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { signWebhook, verifyWebhook } from '../src/polar';
import { api, signIn } from './helpers';

afterEach(() => vi.restoreAllMocks());

let deliveries = 0;

// Delivers a Polar webhook signed with the test secret
async function deliver(event: unknown, options: { id?: string; secret?: string } = {}) {
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

const subscriptionEvent = (type: string, userId: string, fields: Record<string, unknown> = {}) => ({
    type,
    timestamp: new Date().toISOString(),
    data: {
        id: 'sub_1',
        status: 'active',
        product_id: 'prod-pro',
        current_period_end: '2026-12-22T00:00:00Z',
        cancel_at_period_end: false,
        created_at: '2026-11-22T00:00:00Z',
        modified_at: '2026-11-22T00:00:00Z',
        metadata: {},
        customer: { external_id: userId },
        ...fields,
    },
});

const planOf = async (cookie: string) => (await (await api('/api/account', { cookie })).json<any>()).plan.id;

describe('webhook signatures', () => {
    it('accepts a Standard Webhooks signature and refuses others', async () => {
        const headers = (signature: string, timestamp = Math.floor(Date.now() / 1000)) =>
            new Headers({ 'webhook-id': 'msg_x', 'webhook-timestamp': String(timestamp), 'webhook-signature': signature });
        const now = Math.floor(Date.now() / 1000);
        const good = await signWebhook(env.POLAR_WEBHOOK_SECRET, 'msg_x', now, '{}');
        expect(await verifyWebhook(env.POLAR_WEBHOOK_SECRET, headers(good, now), '{}')).toBe(true);
        expect(await verifyWebhook(env.POLAR_WEBHOOK_SECRET, headers(`v1,AAAA ${good}`, now), '{}')).toBe(true);
        expect(await verifyWebhook(env.POLAR_WEBHOOK_SECRET, headers(good, now), '{"x":1}')).toBe(false);
        expect(await verifyWebhook('whsec_b3RoZXI=', headers(good, now), '{}')).toBe(false);
        const old = now - 3600;
        expect(await verifyWebhook(env.POLAR_WEBHOOK_SECRET, headers(await signWebhook(env.POLAR_WEBHOOK_SECRET, 'msg_x', old, '{}'), old), '{}')).toBe(false);
    });

    it('refuses an unsigned delivery', async () => {
        const { user, cookie } = await signIn();
        expect((await deliver(subscriptionEvent('subscription.active', user.id), { secret: 'whsec_b3RoZXI=' })).status).toBe(401);
        expect(await planOf(cookie)).toBe('free');
    });
});

describe('subscriptions', () => {
    it('follows a subscription from start to revocation', async () => {
        const { user, cookie } = await signIn();
        const id = `sub_${crypto.randomUUID()}`;
        expect((await deliver(subscriptionEvent('subscription.active', user.id, { id }))).status).toBe(200);
        expect(await planOf(cookie)).toBe('pro');
        const billing = await (await api('/api/billing', { cookie })).json<any>();
        expect(billing).toMatchObject({ enabled: true, subscription: { plan: 'pro', active: true, cancelAtPeriodEnd: false } });

        // Canceled at the end of the period: the plan stays until it is revoked
        await deliver(subscriptionEvent('subscription.canceled', user.id, { id, cancel_at_period_end: true, modified_at: '2026-11-23T00:00:00Z' }));
        expect(await planOf(cookie)).toBe('pro');
        await deliver(subscriptionEvent('subscription.revoked', user.id, { id, status: 'canceled', modified_at: '2026-12-22T00:00:00Z' }));
        expect(await planOf(cookie)).toBe('free');

        // A late, older delivery cannot bring the plan back
        await deliver(subscriptionEvent('subscription.updated', user.id, { id, modified_at: '2026-11-24T00:00:00Z' }));
        expect(await planOf(cookie)).toBe('free');
    });

    it('switches plans and finds the user through the checkout metadata', async () => {
        const { user, cookie } = await signIn();
        const id = `sub_${crypto.randomUUID()}`;
        await deliver(subscriptionEvent('subscription.active', user.id, { id, product_id: 'prod-basic', customer: {}, metadata: { user_id: user.id } }));
        expect(await planOf(cookie)).toBe('basic');
        await deliver(subscriptionEvent('subscription.updated', user.id, { id, product_id: 'prod-vip', modified_at: '2026-11-23T00:00:00Z' }));
        expect(await planOf(cookie)).toBe('vip');
    });

    it('ignores unknown products, unknown users, other events and repeated deliveries', async () => {
        const { user, cookie } = await signIn();
        expect((await deliver(subscriptionEvent('subscription.active', user.id, { id: `sub_${crypto.randomUUID()}`, product_id: 'prod-other' }))).status).toBe(202);
        expect((await deliver(subscriptionEvent('subscription.active', 'no-such-user'))).status).toBe(202);
        expect((await deliver({ type: 'order.paid', data: {} })).status).toBe(202);
        expect(await planOf(cookie)).toBe('free');

        const id = `sub_${crypto.randomUUID()}`;
        await deliver(subscriptionEvent('subscription.active', user.id, { id }), { id: 'msg_repeat' });
        await env.DB.prepare("UPDATE users SET plan = 'free' WHERE id = ?").bind(user.id).run();
        expect((await deliver(subscriptionEvent('subscription.active', user.id, { id }), { id: 'msg_repeat' })).status).toBe(200);
        expect(await planOf(cookie)).toBe('free');
    });
});

describe('checkout and portal', () => {
    function mockPolar(reply: (url: string, body: any) => Response) {
        const calls: { url: string; body: any; headers: Headers }[] = [];
        const realFetch = globalThis.fetch;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
            const url = input instanceof Request ? input.url : String(input);
            if (!url.startsWith('https://sandbox-api.polar.sh/')) return realFetch(input, init);
            const body = JSON.parse(String(init?.body));
            calls.push({ url, body, headers: new Headers(init?.headers) });
            return reply(url, body);
        });
        return calls;
    }

    it('opens a checkout for the user and refuses a second subscription', async () => {
        const { user, cookie } = await signIn();
        const calls = mockPolar(() => Response.json({ url: 'https://sandbox.polar.sh/checkout/abc' }, { status: 201 }));
        const response = await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'pro' } });
        expect(await response.json()).toEqual({ url: 'https://sandbox.polar.sh/checkout/abc' });
        expect(calls[0].url).toBe('https://sandbox-api.polar.sh/v1/checkouts/');
        expect(calls[0].headers.get('authorization')).toBe('Bearer test-polar-token');
        expect(calls[0].body).toMatchObject({
            products: ['prod-pro'],
            external_customer_id: user.id,
            customer_email: user.email,
            success_url: 'http://localhost:3000/billing?checkout=success&checkout_id={CHECKOUT_ID}',
            metadata: { user_id: user.id, plan: 'pro' },
        });

        expect((await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'free' } })).status).toBe(400);
        await deliver(subscriptionEvent('subscription.active', user.id, { id: `sub_${crypto.randomUUID()}` }));
        expect((await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'vip' } })).status).toBe(409);
    });

    it('opens the portal for subscribers only and reports Polar failures', async () => {
        const { user, cookie } = await signIn();
        expect((await api('/api/billing/portal', { method: 'POST', cookie })).status).toBe(404);
        await deliver(subscriptionEvent('subscription.active', user.id, { id: `sub_${crypto.randomUUID()}` }));

        const calls = mockPolar(() => Response.json({ customer_portal_url: 'https://sandbox.polar.sh/portal/xyz' }, { status: 201 }));
        expect(await (await api('/api/billing/portal', { method: 'POST', cookie })).json()).toEqual({ url: 'https://sandbox.polar.sh/portal/xyz' });
        expect(calls[0].body).toEqual({ external_customer_id: user.id, return_url: 'http://localhost:3000/billing' });

        vi.restoreAllMocks();
        mockPolar(() => new Response('down', { status: 500 }));
        expect((await api('/api/billing/portal', { method: 'POST', cookie })).status).toBe(502);
    });

    it('needs a signed-in user', async () => {
        expect((await api('/api/billing/checkout', { method: 'POST', json: { plan: 'pro' } })).status).toBe(401);
    });
});
