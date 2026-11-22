import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';
import { cleanUp } from '../src/db';
import { monitoring } from '../src/monitoring';
import { dailyBillingCheck } from '../src/routes/billing';
import { api, APP, signIn } from './helpers';
import { DAY, deliver, inDays, mockPolar, planOf, subscriptionEvent, subscriptionList, type PolarCall } from './polar-helpers';
import created from './fixtures/polar/subscription.created.json';
import canceled from './fixtures/polar/subscription.canceled.json';
import orderRefunded from './fixtures/polar/order.refunded.json';

afterEach(() => vi.restoreAllMocks());

const subscriptionId = () => crypto.randomUUID();
const billingOf = async (cookie: string) => (await api('/api/billing', { cookie })).json<any>();

// A subscriber on `plan` whose current period started 10 days ago and ends in 20
async function subscriber(product = 'prod-pro', fields: Record<string, unknown> = {}) {
    const session = await signIn();
    const id = subscriptionId();
    const data = subscriptionEvent('subscription.active', session.user.id, {
        id, product_id: product, current_period_start: inDays(-10), current_period_end: inDays(20), ...fields,
    }).data;
    expect((await deliver({ type: 'subscription.active', data })).status).toBe(200);
    return { ...session, id, data };
}

// Polar answering as a store of one subscription: lists it, applies PATCHes to it and records refunds
function polarWith(subscription: any, extra: (call: PolarCall) => Response | null = () => null) {
    let current = { ...subscription };
    const calls = mockPolar(call => {
        const answer = extra(call);
        if (answer) return answer;
        if (call.method === 'GET' && call.path === '/v1/subscriptions/') {
            const userId = new URL(call.url).searchParams.get('external_customer_id');
            return subscriptionList(...(userId === null || userId === current.customer.external_id ? [current] : []));
        }
        if (call.method === 'PATCH' && call.path === `/v1/subscriptions/${current.id}`) {
            current = {
                ...current,
                modified_at: new Date(Date.parse(current.modified_at) + 60_000).toISOString(),
                ...(call.body.revoke ? { status: 'canceled', ended_at: new Date().toISOString() } : { cancel_at_period_end: call.body.cancel_at_period_end }),
            };
            return Response.json(current);
        }
        if (call.method === 'GET' && call.path === '/v1/orders/') {
            return Response.json({ items: [{ id: 'ord_1', status: 'paid', created_at: current.current_period_start, total_amount: 5900, refundable_amount: 5900, currency: 'ils', subscription_id: current.id }] });
        }
        if (call.method === 'POST' && call.path === '/v1/refunds/') return Response.json({ id: 'ref_1', amount: call.body.amount, status: 'succeeded' }, { status: 201 });
        if (call.method === 'DELETE' && call.path.startsWith('/v1/customers/external/')) return new Response(null, { status: 204 });
        return new Response('unexpected', { status: 500 });
    });
    return { calls, current: () => current };
}

// The Worker as it runs with other settings, for cases the shared test bindings don't cover
async function apiWith(overrides: Partial<Env>, path: string, init: RequestInit & { cookie?: string; json?: unknown } = {}) {
    const headers = new Headers(init.headers);
    headers.set('Origin', APP);
    if (init.cookie) headers.set('Cookie', init.cookie);
    if (init.json !== undefined) headers.set('Content-Type', 'application/json');
    const ctx = createExecutionContext();
    const response = await worker.fetch!(
        new Request(`${APP}${path}`, { ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body }) as any,
        { ...env, ...overrides },
        ctx
    );
    await waitOnExecutionContext(ctx);
    return response;
}

describe('confirming a checkout', () => {
    it("says how the checkout went only for the user's own checkout", async () => {
        const { user, cookie } = await signIn();
        const own = crypto.randomUUID();
        const other = crypto.randomUUID();
        mockPolar(({ path }) => {
            if (path === `/v1/checkouts/${own}`) return Response.json({ id: own, status: 'succeeded', external_customer_id: user.id });
            if (path === `/v1/checkouts/${other}`) return Response.json({ id: other, status: 'succeeded', external_customer_id: 'someone-else', metadata: {} });
            if (path.startsWith('/v1/checkouts/')) return Response.json({ error: 'ResourceNotFound' }, { status: 404 });
            return subscriptionList();
        });
        const sync = async (checkoutId: unknown) => (await api('/api/billing/sync', { method: 'POST', cookie, json: { checkoutId } })).json<any>();
        expect((await sync(own)).checkout).toBe('succeeded');
        expect((await sync(other)).checkout).toBeNull();
        expect((await sync(crypto.randomUUID())).checkout).toBeNull();
        expect((await sync('../../v1/orders')).checkout).toBeNull();
    });

    it('asks Polar once before saying there is no subscription for the portal', async () => {
        const { user, cookie } = await signIn();
        const data = subscriptionEvent('subscription.active', user.id, { id: subscriptionId() }).data;
        const calls = mockPolar(({ path }) => path === '/v1/customer-sessions/'
            ? Response.json({ customer_portal_url: 'https://sandbox.polar.sh/portal/1' }, { status: 201 })
            : subscriptionList(data));
        expect(await (await api('/api/billing/portal', { method: 'POST', cookie })).json()).toEqual({ url: 'https://sandbox.polar.sh/portal/1' });
        expect(calls.map(call => call.path)).toEqual(['/v1/subscriptions/', '/v1/customer-sessions/']);
    });
});

describe('the webhook', () => {
    it("takes the user from the checkout's metadata first, then from the customer", async () => {
        const first = await signIn();
        const second = await signIn();
        await deliver(subscriptionEvent('subscription.active', 'deleted-user', { id: subscriptionId(), metadata: { user_id: first.user.id } }));
        expect(await planOf(first.cookie)).toBe('pro');
        await deliver(subscriptionEvent('subscription.active', second.user.id, { id: subscriptionId(), metadata: { user_id: 'deleted-user' } }));
        expect(await planOf(second.cookie)).toBe('pro');
    });

    it('accepts real Polar payloads (API 2026-10)', async () => {
        const { user, cookie } = await signIn();
        const id = subscriptionId();
        const real = (payload: any, fields: Record<string, unknown>) =>
            ({ ...payload, data: { ...payload.data, id, product_id: 'prod-vip', customer: { ...payload.data.customer, external_id: user.id }, metadata: { user_id: user.id }, ...fields } });
        expect((await deliver(real(created, { current_period_end: inDays(30) }))).status).toBe(200);
        expect(await planOf(cookie)).toBe('vip');
        expect((await deliver(real(canceled, { current_period_end: inDays(30) }))).status).toBe(200);
        expect((await billingOf(cookie)).subscription).toMatchObject({ plan: 'vip', active: true, cancelAtPeriodEnd: true });
    });

    it('refuses a body over 1 MB and a malformed one', async () => {
        const big = await api('/api/billing/webhook', { method: 'POST', body: 'x'.repeat(1024 * 1024 + 1), headers: { 'Content-Type': 'application/json' } });
        expect(big.status).toBe(413);
        const signedButBroken = await deliverRaw('{"type": "subscription.active",');
        expect(signedButBroken.status).toBe(400);
    });

    it('records and reports deliveries it cannot use', async () => {
        const notice = vi.spyOn(monitoring, 'notice');
        const { user } = await signIn();
        const id = subscriptionId();
        expect((await deliver(subscriptionEvent('subscription.active', user.id, { id, product_id: 'prod-unknown' }))).status).toBe(202);
        expect(notice).toHaveBeenCalledWith('Polar webhook ignored: unknown product', expect.objectContaining({ subscriptionId: id, productId: 'prod-unknown' }));
        const { cookie: admin } = await signIn('admin@example.test');
        mockPolar(({ path }) => path === '/v1/subscriptions/' ? subscriptionList() : Response.json({ id: 'x', name: 'x', is_archived: false, recurring_interval: 'month', prices: [] }));
        const health = await (await api('/api/admin/billing-health', { cookie: admin })).json<any>();
        expect(health.ignoredWebhooks[0]).toMatchObject({ type: 'subscription.active', subscriptionId: id, reason: 'unknown product' });
    });
});

// A webhook body signed with the test secret, as is
async function deliverRaw(body: string) {
    const { signWebhook } = await import('../src/polar');
    const id = `msg_raw_${crypto.randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    return api('/api/billing/webhook', {
        method: 'POST',
        headers: { 'webhook-id': id, 'webhook-timestamp': String(timestamp), 'webhook-signature': await signWebhook(env.POLAR_WEBHOOK_SECRET, id, timestamp, body) },
        body,
    });
}

describe('checkout calls', () => {
    it("passes the user's language and stops after ten in a minute", async () => {
        const { cookie } = await signIn();
        const calls = mockPolar(() => Response.json({ url: 'https://sandbox.polar.sh/checkout/x' }, { status: 201 }));
        expect((await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'basic', locale: 'he' } })).status).toBe(200);
        expect(calls[0].body.locale).toBe('he');
        for (let i = 0; i < 9; i++) await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'basic' } });
        expect(calls[1].body.locale).toBe('en');
        const eleventh = await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'basic' } });
        expect(eleventh.status).toBe(429);
    });

    it('reports a Polar failure', async () => {
        const { cookie } = await signIn();
        mockPolar(() => new Response('down', { status: 500 }));
        const response = await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'pro' } });
        expect(response.status).toBe(502);
        expect(await response.json()).toMatchObject({ code: 'polar_unavailable' });
    });

    it('works without Polar set up: no checkout, and a renewing subscription only blocks deleting the account', async () => {
        const { user, cookie } = await subscriber();
        const unset = { POLAR_ACCESS_TOKEN: '' } as Partial<Env>;
        expect(await (await apiWith(unset, '/api/billing', { cookie })).json()).toMatchObject({ enabled: false, subscription: { plan: 'pro' } });
        expect(await (await apiWith(unset, '/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'vip' } })).json()).toMatchObject({ code: 'not_configured' });
        const blocked = await apiWith(unset, '/api/account', { method: 'DELETE', cookie, json: { confirmEmail: user.email } });
        expect(blocked.status).toBe(409);
        expect(await blocked.json()).toMatchObject({ code: 'has_subscription' });
    });
});

describe('failed renewals', () => {
    it('keeps the plan through the grace period, then drops it', async () => {
        const { user, cookie, id } = await subscriber();
        await deliver(subscriptionEvent('subscription.past_due', user.id, {
            id, status: 'past_due', past_due_at: inDays(-2), modified_at: inDays(0), current_period_start: inDays(-10), current_period_end: inDays(20),
        }));
        expect(await planOf(cookie)).toBe('pro');
        const billing = await billingOf(cookie);
        expect(billing.subscription).toMatchObject({ status: 'past_due', active: true });
        expect(Date.parse(billing.subscription.graceEndsAt)).toBeCloseTo(Date.now() + 5 * DAY, -6);
        expect(Date.parse(billing.subscription.nextRetryAt)).toBeCloseTo(Date.now() + 5 * DAY, -6);
        const checkout = await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'vip' } });
        expect(checkout.status).toBe(409);
        expect(await checkout.json()).toMatchObject({ code: 'past_due' });

        // A week later, with no webhook: the daily job ends the plan
        await env.DB.prepare('UPDATE subscriptions SET past_due_at = ? WHERE id = ?').bind(inDays(-8), id).run();
        await dailyBillingCheck(env);
        expect(await planOf(cookie)).toBe('free');
        expect((await billingOf(cookie)).subscription).toMatchObject({ status: 'past_due', active: false });
    });

    it('treats trialing as paid, unpaid and revoked as not', async () => {
        const trial = await subscriber('prod-basic', { status: 'trialing' });
        expect(await planOf(trial.cookie)).toBe('basic');
        const { user, cookie, id } = await subscriber();
        await deliver(subscriptionEvent('subscription.updated', user.id, { id, status: 'unpaid', modified_at: inDays(0) }));
        expect(await planOf(cookie)).toBe('free');
        expect((await api('/api/billing/checkout', { method: 'POST', cookie, json: { plan: 'pro' } })).status).toBe(409);
        const revoked = await subscriber();
        await deliver(subscriptionEvent('subscription.revoked', revoked.user.id, { id: revoked.id, status: 'canceled', modified_at: inDays(0) }));
        expect(await planOf(revoked.cookie)).toBe('free');
    });

    it('gives the best plan when two subscriptions grant access', async () => {
        const { user, cookie } = await subscriber('prod-basic');
        await deliver(subscriptionEvent('subscription.active', user.id, { id: subscriptionId(), product_id: 'prod-vip' }));
        expect(await planOf(cookie)).toBe('vip');
    });
});

describe('cancelling in the app', () => {
    it('cancels at the end of the period and takes it back', async () => {
        const { user, cookie, data } = await subscriber();
        const { calls } = polarWith(data);
        const canceled = await api('/api/billing/cancel', { method: 'POST', cookie, json: { mode: 'period_end', reason: 'too_expensive' } });
        expect(canceled.status).toBe(200);
        const body = await canceled.json<any>();
        expect(body).toMatchObject({ subscription: { plan: 'pro', active: true, cancelAtPeriodEnd: true }, refunded: 0 });
        expect(body.reference).toMatch(/^KC-\d{8}-[0-9A-F]{6}$/);
        expect(calls.find(call => call.method === 'PATCH')!.body).toEqual({ cancel_at_period_end: true, customer_cancellation_reason: 'too_expensive' });
        expect(await planOf(cookie)).toBe('pro');

        const undone = await (await api('/api/billing/cancel', { method: 'POST', cookie, json: { mode: 'undo' } })).json<any>();
        expect(undone.subscription.cancelAtPeriodEnd).toBe(false);
        expect((await api('/api/billing/cancel', { method: 'POST', cookie, json: { mode: 'undo' } })).status).toBe(409);

        const { cookie: admin } = await signIn('admin@example.test');
        const requests = (await (await api('/api/admin/requests', { cookie: admin })).json<any>()).requests;
        expect(requests.filter((request: any) => request.userId === user.id).map((request: any) => request.status)).toEqual(['done', 'done']);
    });

    it('ends now and refunds the unused days', async () => {
        const { cookie, data } = await subscriber();
        const { calls } = polarWith(data);
        const body = await (await api('/api/billing/cancel', { method: 'POST', cookie, json: { mode: 'now' } })).json<any>();
        const refund = calls.find(call => call.path === '/v1/refunds/')!;
        // 20 of the period's 30 days are left
        expect(refund.body).toMatchObject({ order_id: 'ord_1', reason: 'customer_request' });
        expect(refund.body.amount).toBeGreaterThan(3900);
        expect(refund.body.amount).toBeLessThan(3940);
        expect(calls.find(call => call.method === 'PATCH')!.body).toMatchObject({ revoke: true });
        expect(body).toMatchObject({ refunded: refund.body.amount, subscription: { active: false } });
        expect(await planOf(cookie)).toBe('free');
    });

    it('refunds every order of the period, an upgrade included, and none from before it', async () => {
        const { cookie, data } = await subscriber('prod-pro');
        const { calls } = polarWith(data, call => call.method === 'GET' && call.path === '/v1/orders/'
            ? Response.json({ items: [
                // The upgrade to Pro 5 days ago, charged for the 25 days left then
                { id: 'ord_upgrade', status: 'paid', created_at: inDays(-5), total_amount: 2500, refundable_amount: 2500, currency: 'ils', subscription_id: data.id },
                { id: 'ord_period', status: 'paid', created_at: inDays(-10), total_amount: 2900, refundable_amount: 2900, currency: 'ils', subscription_id: data.id },
                { id: 'ord_last_month', status: 'paid', created_at: inDays(-40), total_amount: 2900, refundable_amount: 2900, currency: 'ils', subscription_id: data.id },
                { id: 'ord_pending', status: 'pending', created_at: inDays(-1), total_amount: 500, refundable_amount: 0, currency: 'ils', subscription_id: data.id },
            ] })
            : null);
        const body = await (await api('/api/billing/cancel', { method: 'POST', cookie, json: { mode: 'now' } })).json<any>();
        const refunds = Object.fromEntries(calls.filter(call => call.path === '/v1/refunds/').map(call => [call.body.order_id, call.body.amount]));
        // 20 days are left: 20/25 of the upgrade and 20/30 of the period's order
        expect(Object.keys(refunds).sort()).toEqual(['ord_period', 'ord_upgrade']);
        expect(refunds.ord_upgrade).toBeGreaterThan(1990);
        expect(refunds.ord_upgrade).toBeLessThanOrEqual(2000);
        expect(refunds.ord_period).toBeGreaterThan(1925);
        expect(refunds.ord_period).toBeLessThanOrEqual(1934);
        expect(body.refunded).toBe(refunds.ord_upgrade + refunds.ord_period);
    });

    it('refuses a cancellation with nothing to cancel or an unknown mode', async () => {
        const { cookie } = await signIn();
        expect((await api('/api/billing/cancel', { method: 'POST', cookie, json: { mode: 'now' } })).status).toBe(409);
        expect((await api('/api/billing/cancel', { method: 'POST', cookie, json: { mode: 'later' } })).status).toBe(400);
    });

    it('takes cancellation requests without an account, for the admin to handle', async () => {
        const send = (json: unknown) => api('/api/support', { method: 'POST', json });
        const sent = await send({ category: 'cancellation', name: 'Dana Levi', email: 'dana@example.test', idNumber: '123-456-789', page: '/he/cancel' });
        expect(sent.status).toBe(201);
        const { reference } = await sent.json<any>();
        expect(reference).toMatch(/^KC-/);
        expect((await send({ category: 'cancellation', name: 'Dana', email: 'not-an-email' })).status).toBe(400);
        expect((await send({ category: 'cancellation', name: '', email: 'dana@example.test' })).status).toBe(400);
        expect((await send({ category: 'cancellation', name: 'Dana', email: 'dana@example.test', idNumber: '12ab' })).status).toBe(400);
        expect((await send({ category: 'bug', name: 'Dana', email: 'dana@example.test' })).status).toBe(400);

        const { cookie: admin } = await signIn('admin@example.test');
        const list = async () => (await (await api('/api/admin/requests', { cookie: admin })).json<any>()).requests;
        expect((await list()).find((request: any) => request.id === reference)).toMatchObject({ status: 'open', idNumber: '123456789', name: 'Dana Levi' });
        expect((await api(`/api/admin/requests/${reference}/done`, { method: 'POST', cookie: admin })).status).toBe(204);
        expect((await list()).find((request: any) => request.id === reference).status).toBe('done');
        expect((await api(`/api/admin/requests/${reference}/done`, { method: 'POST', cookie: admin })).status).toBe(404);
        const { cookie: someone } = await signIn();
        expect((await api('/api/admin/requests', { cookie: someone })).status).toBe(403);
    });
});

describe('refunds', () => {
    const order = (fields: Record<string, unknown>) => Response.json({ id: 'ord_9', status: 'refunded', total_amount: 5900, refunded_amount: 5900, currency: 'ils', ...fields });

    it("ends the subscription on Polar's real order.refunded payload, once", async () => {
        const { cookie, data } = await subscriber();
        const event = { ...orderRefunded, data: { ...orderRefunded.data, id: 'ord_real', subscription_id: data.id } };
        const { calls } = polarWith(data, call => call.path === '/v1/orders/ord_real' ? order({ id: 'ord_real', subscription_id: data.id }) : null);
        expect((await deliver(event, { id: 'msg_refund_real' })).status).toBe(200);
        expect((await deliver(event, { id: 'msg_refund_real' })).status).toBe(200);
        expect(calls.filter(call => call.method === 'PATCH').length).toBe(1);
        expect(await planOf(cookie)).toBe('free');
    });

    it('a full refund ends the subscription, a partial one does not', async () => {
        const { cookie, data } = await subscriber();
        const { calls } = polarWith(data, call => call.path === '/v1/orders/ord_9' ? order({ subscription_id: data.id, status: 'partially_refunded', refunded_amount: 1000 }) : null);
        expect((await deliver({ type: 'refund.created', data: { id: 'ref_9', order_id: 'ord_9', subscription_id: data.id } })).status).toBe(200);
        expect(calls.some(call => call.method === 'PATCH')).toBe(false);
        expect(await planOf(cookie)).toBe('pro');

        vi.restoreAllMocks();
        const full = polarWith(data, call => call.path === '/v1/orders/ord_9' ? order({ subscription_id: data.id }) : null);
        expect((await deliver({ type: 'order.refunded', data: { id: 'ord_9', subscription_id: data.id, status: 'refunded' } })).status).toBe(200);
        expect(full.calls.find(call => call.method === 'PATCH')!.body).toMatchObject({ revoke: true });
        expect(await planOf(cookie)).toBe('free');
    });
});

describe('deleting and suspending a subscriber', () => {
    it('ends the subscription with a refund and deletes the Polar customer before the account', async () => {
        const { user, cookie, data } = await subscriber();
        const { calls } = polarWith(data);
        expect((await api('/api/account', { method: 'DELETE', cookie, json: { confirmEmail: user.email } })).status).toBe(204);
        expect(calls.map(call => `${call.method} ${call.path}`)).toEqual(expect.arrayContaining([
            'POST /v1/refunds/', `PATCH /v1/subscriptions/${data.id}`, `DELETE /v1/customers/external/${user.id}`,
        ]));
        expect(calls.find(call => call.method === 'DELETE')!.url).toContain('anonymize=true');
    });

    it('keeps the account when Polar fails', async () => {
        const { user, cookie, data } = await subscriber();
        polarWith(data, call => call.path === '/v1/refunds/' ? new Response('down', { status: 500 }) : null);
        const response = await api('/api/account', { method: 'DELETE', cookie, json: { confirmEmail: user.email } });
        expect(response.status).toBe(502);
        expect((await api('/api/account', { cookie })).status).toBe(200);
    });

    it('sets a suspended subscriber to cancel at the end of the period, unless told not to', async () => {
        const { cookie: admin } = await signIn('admin@example.test');
        const target = await subscriber();
        const { calls } = polarWith(target.data);
        const suspended = await (await api(`/api/admin/users/${target.user.id}`, { method: 'PATCH', cookie: admin, json: { suspended: true } })).json<any>();
        expect(suspended.subscription).toBe('canceled');
        expect(calls.find(call => call.method === 'PATCH')!.body).toEqual({ cancel_at_period_end: true });

        vi.restoreAllMocks();
        const other = await subscriber();
        const second = polarWith(other.data);
        await api(`/api/admin/users/${other.user.id}`, { method: 'PATCH', cookie: admin, json: { suspended: true, cancelSubscription: false } });
        expect(second.calls.some(call => call.method === 'PATCH')).toBe(false);
    });
});

describe('comps', () => {
    it('survive Polar changes, expire back to the paid plan and never lower a payer', async () => {
        const { cookie: admin } = await signIn('admin@example.test');
        const comp = (userId: string, json: unknown) => api(`/api/admin/users/${userId}`, { method: 'PATCH', cookie: admin, json });

        const old = await subscriber('prod-basic');
        expect((await comp(old.user.id, { plan: 'vip', reason: 'Beta tester' })).status).toBe(200);
        await deliver(subscriptionEvent('subscription.revoked', old.user.id, { id: old.id, product_id: 'prod-basic', status: 'canceled', modified_at: inDays(0) }));
        expect(await planOf(old.cookie)).toBe('vip');
        expect((await billingOf(old.cookie)).override).toEqual({ plan: 'vip', until: null });

        const payer = await subscriber('prod-basic');
        await comp(payer.user.id, { plan: 'vip', until: inDays(1) });
        expect(await planOf(payer.cookie)).toBe('vip');
        await env.DB.prepare('UPDATE users SET plan_override_until = ? WHERE id = ?').bind(inDays(-1), payer.user.id).run();
        await dailyBillingCheck(env);
        expect(await planOf(payer.cookie)).toBe('basic');
        expect(await env.DB.prepare('SELECT plan_override FROM users WHERE id = ?').bind(payer.user.id).first('plan_override')).toBeNull();

        const pro = await subscriber('prod-pro');
        for (const plan of ['basic', 'free']) {
            const refused = await comp(pro.user.id, { plan });
            expect(refused.status).toBe(409);
            expect(await refused.json()).toMatchObject({ code: 'below_subscription', subscriptionPlan: 'pro' });
        }
        expect(await planOf(pro.cookie)).toBe('pro');
        const stats = await (await api('/api/admin/stats', { cookie: admin })).json<any>();
        expect(stats.paying).toBeGreaterThanOrEqual(2);
        expect(stats.comped).toBeGreaterThanOrEqual(1);
    });
});

describe('billing health', () => {
    it('checks the products against the plans and flags a wrong price', async () => {
        const { cookie: admin } = await signIn('admin@example.test');
        const product = (id: string, amount: number) => Response.json({
            id, name: id, is_archived: false, recurring_interval: 'month',
            prices: [{ amount_type: 'fixed', price_amount: amount, price_currency: 'ils', is_archived: false }],
        });
        const calls = mockPolar(({ path }) => {
            if (path === '/v1/products/prod-basic') return product('prod-basic', 3000);
            if (path === '/v1/products/prod-pro') return product('prod-pro', 5900);
            if (path === '/v1/products/prod-vip') return Response.json({ error: 'ResourceNotFound' }, { status: 404 });
            return subscriptionList();
        });
        const health = await (await api('/api/admin/billing-health', { cookie: admin })).json<any>();
        expect(health).toMatchObject({ configured: true, server: 'sandbox', token: 'ok', webhookSecret: true, apiVersion: { sent: '2026-10' } });
        expect(Object.fromEntries(health.products.map((item: any) => [item.plan, item.problems]))).toEqual({
            basic: ['price 30 instead of 29'], pro: [], vip: ['not found on Polar'],
        });
        expect(calls.every(call => call.headers.get('polar-version') === '2026-10')).toBe(true);
        const { cookie: someone } = await signIn();
        expect((await api('/api/admin/billing-health', { cookie: someone })).status).toBe(403);
    });
});

describe('ended subscriptions and old webhook ids', () => {
    it('shows an ended subscription as inactive', async () => {
        const { user, cookie, id } = await subscriber();
        await deliver(subscriptionEvent('subscription.revoked', user.id, { id, status: 'canceled', modified_at: inDays(0) }));
        expect((await billingOf(cookie)).subscription).toMatchObject({ plan: 'pro', status: 'canceled', active: false });
    });

    it('forgets webhook ids after 30 days', async () => {
        await env.DB.batch([
            env.DB.prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?)').bind('msg_old', inDays(-31)),
            env.DB.prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?)').bind('msg_new', inDays(-1)),
        ]);
        await cleanUp(env.DB);
        const { results } = await env.DB.prepare("SELECT id FROM webhook_events WHERE id IN ('msg_old', 'msg_new')").all();
        expect(results.map((row: any) => row.id)).toEqual(['msg_new']);
    });
});
