import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { signWebhook, verifyWebhook } from '../src/polar';
import { syncOverdueSubscriptions } from '../src/routes/billing';
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

// Answers the Worker's calls to Polar's sandbox API with `reply` and records them
function mockPolar(reply: (url: string, body: any) => Response) {
    const calls: { url: string; method: string; body: any; headers: Headers }[] = [];
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        if (!url.startsWith('https://sandbox-api.polar.sh/')) return realFetch(input, init);
        const body = init?.body ? JSON.parse(String(init.body)) : null;
        calls.push({ url, method: init?.method ?? 'GET', body, headers: new Headers(init?.headers) });
        return reply(url, body);
    });
    return calls;
}

// Polar's list of the user's subscriptions, as GET /v1/subscriptions/ answers it
const subscriptionList = (...items: unknown[]) => Response.json({ items, pagination: { total_count: items.length, max_page: 1 } });

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

    it('opens a checkout for the user and refuses a second subscription', async () => {
        const { user, cookie } = await signIn();
        const calls = mockPolar(() => Response.json({ url: 'https://sandbox.polar.sh/checkout/abc' }, { status: 201 }));
        const response = await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'pro' } });
        expect(await response.json()).toEqual({ url: 'https://sandbox.polar.sh/checkout/abc' });
        expect(calls[0].url).toBe('https://sandbox-api.polar.sh/v1/checkouts/');
        expect(calls[0].headers.get('authorization')).toBe('Bearer test-polar-token');
        expect(calls[0].headers.get('polar-version')).toBe('2026-10');
        expect(calls[0].body).toMatchObject({
            products: ['prod-pro'],
            currency: 'ils',
            external_customer_id: user.id,
            customer_email: user.email,
            success_url: 'http://localhost:3000/billing?checkout=success&checkout_id={CHECKOUT_ID}',
            metadata: { user_id: user.id, plan: 'pro' },
        });
        // Only a public address is passed on, so Polar can place the buyer
        expect(calls[0].body.customer_ip_address).toBeUndefined();
        await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'pro' }, headers: { 'cf-connecting-ip': '203.0.113.7' } });
        expect(calls[1].body.customer_ip_address).toBe('203.0.113.7');
        await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'pro' }, headers: { 'cf-connecting-ip': '192.168.1.5' } });
        expect(calls[2].body.customer_ip_address).toBeUndefined();

        expect((await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'free' } })).status).toBe(400);
        await deliver(subscriptionEvent('subscription.active', user.id, { id: `sub_${crypto.randomUUID()}` }));
        expect((await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'vip' } })).status).toBe(409);
    });

    it('leaves the email to the checkout page when Polar refuses it', async () => {
        const { cookie } = await signIn();
        const refused = { error: 'RequestValidationError', detail: [{ loc: ['body', 'customer_email'], msg: 'The domain name example.test does not accept email.' }] };
        const calls = mockPolar((_url, body) => body.customer_email
            ? Response.json(refused, { status: 422 })
            : Response.json({ url: 'https://sandbox.polar.sh/checkout/def' }, { status: 201 }));
        expect(await (await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'basic' } })).json()).toEqual({ url: 'https://sandbox.polar.sh/checkout/def' });
        expect(calls.length).toBe(2);
        expect(calls[1].body.customer_email).toBeUndefined();
        expect(calls[1].body.products).toEqual(['prod-basic']);

        // Any other refusal is reported
        vi.restoreAllMocks();
        mockPolar(() => Response.json({ error: 'RequestValidationError', detail: [{ loc: ['body', 'products'] }] }, { status: 422 }));
        expect((await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'basic' } })).status).toBe(502);
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

describe('sync from Polar', () => {
    const polarSubscription = (userId: string, fields: Record<string, unknown> = {}) =>
        subscriptionEvent('subscription.updated', userId, fields).data;

    it('takes the plan from Polar when the page asks, without a webhook', async () => {
        const { user, cookie } = await signIn();
        const id = `sub_${crypto.randomUUID()}`;
        let current = polarSubscription(user.id, { id, product_id: 'prod-basic', modified_at: '2026-11-22T10:00:00.123456Z' });
        const calls = mockPolar(() => subscriptionList(current));

        const synced = await (await api('/api/billing/sync', { method: 'POST', cookie })).json<any>();
        expect(synced).toMatchObject({ enabled: true, subscription: { plan: 'basic', status: 'active', active: true } });
        expect(await planOf(cookie)).toBe('basic');
        expect(calls[0].method).toBe('GET');
        expect(new URL(calls[0].url).searchParams.get('external_customer_id')).toBe(user.id);
        expect(calls[0].headers.get('authorization')).toBe('Bearer test-polar-token');
        const stored = await env.DB.prepare('SELECT modified_at FROM subscriptions WHERE id = ?').bind(id).first<any>();
        expect(stored.modified_at).toBe('2026-11-22T10:00:00.123Z');

        // Nothing changed on Polar: a plan an admin set by hand stays
        await env.DB.prepare("UPDATE users SET plan = 'vip' WHERE id = ?").bind(user.id).run();
        await api('/api/billing/sync', { method: 'POST', cookie });
        expect(await planOf(cookie)).toBe('vip');

        // Canceled at the end of the period, then ended
        current = { ...current, cancel_at_period_end: true, modified_at: '2026-11-23T00:00:00Z' };
        const canceled = await (await api('/api/billing/sync', { method: 'POST', cookie })).json<any>();
        expect(canceled.subscription).toMatchObject({ plan: 'basic', active: true, cancelAtPeriodEnd: true });
        expect(await planOf(cookie)).toBe('basic');
        current = { ...current, status: 'canceled', modified_at: '2026-12-22T00:00:00Z' };
        const ended = await (await api('/api/billing/sync', { method: 'POST', cookie })).json<any>();
        expect(ended.subscription).toMatchObject({ status: 'canceled', active: false });
        expect(await planOf(cookie)).toBe('free');
    });

    it('answers with what is stored when Polar fails', async () => {
        const { user, cookie } = await signIn();
        await deliver(subscriptionEvent('subscription.active', user.id, { id: `sub_${crypto.randomUUID()}` }));
        mockPolar(() => new Response('down', { status: 503 }));
        const response = await api('/api/billing/sync', { method: 'POST', cookie });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ subscription: { plan: 'pro', active: true } });
    });

    it('ignores products that are not plans and stops asking Polar when asked too often', async () => {
        const { user, cookie } = await signIn();
        const calls = mockPolar(() => subscriptionList(polarSubscription(user.id, { id: `sub_${crypto.randomUUID()}`, product_id: 'prod-other' })));
        expect((await (await api('/api/billing/sync', { method: 'POST', cookie })).json<any>()).subscription).toBeNull();
        for (let i = 0; i < 45; i++) await api('/api/billing/sync', { method: 'POST', cookie });
        expect(calls.length).toBe(40);
        expect((await api('/api/billing/sync', { method: 'POST', cookie })).status).toBe(200);
    });

    it('checks overdue subscriptions once a day', async () => {
        const overdue = await signIn();
        const current = await signIn();
        const overdueId = `sub_${crypto.randomUUID()}`;
        await deliver(subscriptionEvent('subscription.active', overdue.user.id, { id: overdueId, current_period_end: '2026-01-01T00:00:00Z' }));
        await deliver(subscriptionEvent('subscription.active', current.user.id, { id: `sub_${crypto.randomUUID()}`, current_period_end: '2099-01-01T00:00:00Z' }));

        const calls = mockPolar(url => {
            const userId = new URL(url).searchParams.get('external_customer_id')!;
            return userId === overdue.user.id
                ? subscriptionList(polarSubscription(userId, { id: overdueId, status: 'canceled', current_period_end: '2026-01-01T00:00:00Z', modified_at: '2026-11-25T00:00:00Z' }))
                : subscriptionList();
        });
        await syncOverdueSubscriptions(env);
        expect(calls.map(call => new URL(call.url).searchParams.get('external_customer_id'))).toContain(overdue.user.id);
        expect(calls.map(call => new URL(call.url).searchParams.get('external_customer_id'))).not.toContain(current.user.id);
        expect(await planOf(overdue.cookie)).toBe('free');
        expect(await planOf(current.cookie)).toBe('pro');
    });
});

describe('deleting an account with a subscription', () => {
    it('waits until the subscription is set to end', async () => {
        const { user, cookie } = await signIn();
        const id = `sub_${crypto.randomUUID()}`;
        await deliver(subscriptionEvent('subscription.active', user.id, { id }));
        const blocked = await api('/api/account', { method: 'DELETE', cookie, json: { confirmEmail: user.email } });
        expect(blocked.status).toBe(409);
        expect(await blocked.json()).toMatchObject({ code: 'has_subscription' });

        // Canceled in the portal; the webhook has not arrived, but the API asks Polar before refusing again
        mockPolar(() => subscriptionList(subscriptionEvent('subscription.canceled', user.id, { id, cancel_at_period_end: true, modified_at: '2026-11-23T00:00:00Z' }).data));
        expect((await api('/api/account', { method: 'DELETE', cookie, json: { confirmEmail: user.email } })).status).toBe(204);
    });

    it('stops an admin from deleting a paying user', async () => {
        const { cookie: adminCookie } = await signIn('admin@example.test');
        const { user } = await signIn();
        await deliver(subscriptionEvent('subscription.active', user.id, { id: `sub_${crypto.randomUUID()}` }));
        const response = await api(`/api/admin/users/${user.id}`, { method: 'DELETE', cookie: adminCookie });
        expect(response.status).toBe(409);
        expect(await response.json()).toMatchObject({ code: 'has_subscription' });
    });
});
