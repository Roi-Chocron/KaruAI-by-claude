import { isPaidPlanId } from '../../../shared/plans';
import {
    createSupportRequest, getCurrentSubscription, getSubscriptions, getUserById, grantsAccess, listOverdueSubscriptionUsers,
    markWebhookEvent, recordIgnoredWebhook, refreshAllPlans, saveSubscription, unmarkWebhookEvent, type AccessTimes, type SubscriptionRow,
} from '../db';
import {
    createCheckout, createPortalSession, createRefund, deleteCustomer, getCheckout, getOrder, listOrders, listSubscriptions, listSubscriptionsPage,
    planForProduct, polarConfigured, PolarError, updateSubscription, verifyWebhook, type CancellationReason, type PolarEnv,
    type PolarSubscription,
} from '../polar';
import { monitoring } from '../monitoring';
import { clientIp, createApp, errorJson, rateLimit, requireUser, type AppContext } from '../app';

// Paid plans through Polar: the billing page asks for a checkout, the customer portal or a cancellation. Polar's
// webhooks keep the subscriptions table (and with it each user's plan) up to date, and so does asking Polar's API
// directly: when the billing page loads, right after a checkout and once a day. Either alone is enough, so a missed
// webhook (or none at all, as on localhost) only delays a change.
const billing = createApp();

const NOT_CONFIGURED = 'Online payments are not set up yet.';
const UNAVAILABLE = 'The payment service is not responding. Please try again in a minute.';
const DAY = 24 * 3600 * 1000;

// Polar retries a failed renewal 2, 7, 14 and 21 days after the first failure
const RETRY_DAYS = [2, 7, 14, 21];

// "Now" and the start of the grace period a failed renewal keeps the plan for (POLAR_GRACE_DAYS, 7 by default)
export function accessTimes(env: Env, nowMs = Date.now()): AccessTimes {
    const days = Number((env as { POLAR_GRACE_DAYS?: string }).POLAR_GRACE_DAYS ?? 7);
    return { now: new Date(nowMs).toISOString(), graceStart: new Date(nowMs - (Number.isFinite(days) && days >= 0 ? days : 7) * DAY).toISOString() };
}

const graceDays = (at: AccessTimes) => Math.round((Date.parse(at.now) - Date.parse(at.graceStart)) / DAY);

// Polar's own errors become a 502 with a message the page can show; the details go to the logs
async function callPolar(c: AppContext, request: () => Promise<Response>) {
    try {
        return await request();
    } catch (error) {
        if (!(error instanceof PolarError)) throw error;
        console.error(`[billing] ${error.message}`);
        return errorJson(c, UNAVAILABLE, 502, { code: 'polar_unavailable' });
    }
}

// Polar's timestamps carry microseconds; stored as JavaScript writes them so they compare as text
function isoTime(value: string | null | undefined): string | null {
    const time = value ? Date.parse(value) : NaN;
    return Number.isNaN(time) ? null : new Date(time).toISOString();
}

// Our row for one of Polar's subscriptions, or null when it is not for one of the plans' products
function subscriptionRow(env: PolarEnv, data: PolarSubscription, userId: string): SubscriptionRow | null {
    const plan = planForProduct(env, data?.product_id);
    const modifiedAt = isoTime(data?.modified_at ?? data?.created_at);
    if (!plan || !modifiedAt || typeof data.id !== 'string' || typeof data.status !== 'string') return null;
    return {
        id: data.id,
        userId,
        productId: data.product_id,
        plan,
        status: data.status,
        currentPeriodEnd: isoTime(data.current_period_end),
        cancelAtPeriodEnd: !!data.cancel_at_period_end,
        pastDueAt: isoTime(data.past_due_at) ?? (data.status === 'past_due' ? modifiedAt : null),
        modifiedAt,
    };
}

const sameSubscription = (a: SubscriptionRow, b: SubscriptionRow) =>
    a.productId === b.productId && a.status === b.status && a.currentPeriodEnd === b.currentPeriodEnd
    && a.cancelAtPeriodEnd === b.cancelAtPeriodEnd && a.pastDueAt === b.pastDueAt && a.modifiedAt === b.modifiedAt;

// The KaruAI user a Polar subscription belongs to: the user id the checkout put in its metadata, else the customer's
// external id, whichever names a user that still exists
async function resolveUser(env: Env, data: PolarSubscription): Promise<string | null> {
    const candidates = [data?.metadata?.user_id, data?.customer?.external_id].filter((id): id is string => typeof id === 'string' && !!id);
    for (const id of candidates) if (await getUserById(env.DB, id)) return id;
    return null;
}

// Stores what Polar says about the user's subscriptions. Rows that did not change are left alone. Returns how many
// rows changed.
export async function syncSubscriptions(env: Env, userId: string): Promise<number> {
    const [remote, stored] = await Promise.all([listSubscriptions(env, userId), getSubscriptions(env.DB, userId)]);
    const at = accessTimes(env);
    let changed = 0;
    for (const data of remote) {
        const row = subscriptionRow(env, data, userId);
        const known = row && stored.find(item => item.id === row.id);
        if (!row || (known && sameSubscription(known, row))) continue;
        await saveSubscription(env.DB, row, at);
        changed++;
    }
    if (changed) console.log(JSON.stringify({ event: 'polar_sync', userId, changed }));
    return changed;
}

// Stores a subscription Polar listed, for whichever user it belongs to; true when something changed
async function storeListed(env: Env, data: PolarSubscription, at: AccessTimes): Promise<boolean> {
    const userId = await resolveUser(env, data);
    const row = userId && subscriptionRow(env, data, userId);
    if (!row) return false;
    const known = (await getSubscriptions(env.DB, row.userId)).find(item => item.id === row.id);
    if (known && sameSubscription(known, row)) return false;
    return saveSubscription(env.DB, row, at);
}

// The daily job (see index.ts). Plans whose grace period or comp ran out drop without any webhook. Then, as a safety
// net for missed webhooks, Polar is asked about subscriptions that started or were canceled in the last two days,
// those whose renewal failed, and a few whose paid period ended without an update (oldest first). Polar can't list
// subscriptions by modification time, so these filters stand in for it. The page caps keep the job well inside the
// Worker's subrequest limit.
export async function dailyBillingCheck(env: Env, overdueLimit = 20) {
    const at = accessTimes(env);
    await refreshAllPlans(env.DB, at);
    if (!polarConfigured(env)) return;

    const since = new Date(Date.parse(at.now) - 2 * DAY).toISOString();
    let changed = 0;
    const lists: Record<string, string>[] = [{ started_after: since }, { canceled_at_after: since }, { status: 'past_due' }];
    for (const filters of lists) {
        for (let page = 1; page <= 3; page++) {
            const result = await listSubscriptionsPage(env, filters, page).catch(error => {
                console.error('[billing] daily list failed:', error);
                return null;
            });
            if (!result) break;
            for (const data of result.items) if (await storeListed(env, data, at)) changed++;
            if (page >= result.maxPage) break;
        }
    }
    const before = new Date(Date.parse(at.now) - 3600 * 1000).toISOString();
    for (const userId of await listOverdueSubscriptionUsers(env.DB, before, overdueLimit)) {
        changed += await syncSubscriptions(env, userId).catch(error => {
            console.error(`[billing] daily sync for ${userId} failed:`, error);
            return 0;
        });
    }
    console.log(JSON.stringify({ event: 'billing_daily', changed }));
}

// A subscription that will charge the user again: one that grants a plan and is not set to end
export async function renewingSubscription(env: Env, userId: string): Promise<SubscriptionRow | null> {
    if (polarConfigured(env)) await syncSubscriptions(env, userId).catch(error => console.error('[billing] sync failed:', error));
    const at = accessTimes(env);
    const subscription = await getCurrentSubscription(env.DB, userId, at);
    return subscription && grantsAccess(subscription, at) && !subscription.cancelAtPeriodEnd ? subscription : null;
}

// Ends the subscription now and refunds the unused part of the current period, in agorot before tax: every paid order
// of this period (the renewal, and any upgrade charged in between) gets back its share of the time left. The refunds
// come first: if ending fails after them, the customer has their money and Sentry tells us to end it by hand.
export async function endNowWithRefund(env: Env, subscription: SubscriptionRow, reason: CancellationReason, comment: string) {
    const nowMs = Date.now();
    const [remote, orders] = await Promise.all([listSubscriptions(env, subscription.userId), listOrders(env, subscription.id)]);
    const current = remote.find(item => item.id === subscription.id);
    const end = Date.parse(current?.current_period_end ?? subscription.currentPeriodEnd ?? '');
    // Orders from before this period paid for time already used (an hour's slack for the first order's timestamp)
    const periodStart = Date.parse(current?.current_period_start ?? '') - 3600 * 1000;
    let refunded = 0;
    for (const order of orders) {
        const start = Date.parse(order.created_at);
        if ((order.status !== 'paid' && order.status !== 'partially_refunded') || order.refundable_amount <= 0) continue;
        if (!Number.isNaN(periodStart) && start < periodStart) continue;
        const unused = end > nowMs && end > start ? Math.min(1, (end - nowMs) / (end - start)) : 0;
        const amount = Math.floor(order.refundable_amount * unused);
        if (amount < 1) continue;
        await createRefund(env, order.id, amount, comment);
        refunded += amount;
    }
    try {
        const ended = await updateSubscription(env, subscription.id, { revoke: true }, reason);
        const row = subscriptionRow(env, ended, subscription.userId);
        if (row) await saveSubscription(env.DB, row, accessTimes(env, nowMs));
    } catch (error) {
        if (refunded) monitoring.notice('Refunded but could not end the subscription; end it in Polar', { subscription: subscription.id, refunded });
        throw error;
    }
    return { refunded, currency: orders[0]?.currency ?? 'ils' };
}

// Before an account is deleted: a renewing subscription is ended now with a refund of the unused days, then the Polar
// customer is deleted and anonymized (which also cancels anything left). Without Polar configured, a renewing
// subscription only blocks the deletion. Throws a PolarError when Polar fails, so nothing gets deleted.
export async function closeBillingForDeletion(env: Env, userId: string): Promise<'ok' | 'has_subscription'> {
    if (!polarConfigured(env)) return (await renewingSubscription(env, userId)) ? 'has_subscription' : 'ok';
    const renewing = await renewingSubscription(env, userId);
    if (renewing) await endNowWithRefund(env, renewing, 'other', 'Account deleted: ended now, unused days refunded');
    await deleteCustomer(env, userId);
    return 'ok';
}

// The first of Polar's retries still to come after a failed renewal
function nextRetry(pastDueAt: string | null, nowMs: number): string | null {
    if (!pastDueAt) return null;
    const failed = Date.parse(pastDueAt);
    const next = RETRY_DAYS.map(days => failed + days * DAY).find(time => time > nowMs);
    return next ? new Date(next).toISOString() : null;
}

// The signed-in user's subscription, for the billing page
async function summary(c: AppContext) {
    const user = c.get('user');
    const at = accessTimes(c.env);
    const subscription = await getCurrentSubscription(c.env.DB, user.id, at);
    const fresh = await getUserById(c.env.DB, user.id);
    const override = fresh?.planOverride && (!fresh.planOverrideUntil || fresh.planOverrideUntil > at.now)
        ? { plan: fresh.planOverride, until: fresh.planOverrideUntil }
        : null;
    const pastDue = subscription?.status === 'past_due';
    return {
        enabled: polarConfigured(c.env),
        subscription: subscription && {
            plan: subscription.plan,
            status: subscription.status,
            active: grantsAccess(subscription, at),
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            // While a failed renewal is retried: when the plan ends unless the card is fixed, and Polar's next try
            graceEndsAt: pastDue && subscription.pastDueAt
                ? new Date(Date.parse(subscription.pastDueAt) + graceDays(at) * DAY).toISOString()
                : null,
            nextRetryAt: pastDue ? nextRetry(subscription.pastDueAt, Date.parse(at.now)) : null,
        },
        override,
    };
}

billing.get('/', requireUser, async c => {
    c.header('Cache-Control', 'no-store');
    return c.json(await summary(c));
});

const CHECKOUT_ID = /^[0-9a-f-]{36}$/i;

// The same answer as GET /, after asking Polar for the user's subscriptions. The billing page calls this when it
// loads and while it waits for a finished checkout to become a subscription. With { checkoutId } it also says how
// that checkout went, so the page claims "payment received" only for a real, paid checkout of this user. If Polar
// fails or the user asks too often, it answers with what is stored.
billing.post('/sync', requireUser, async c => {
    const user = c.get('user');
    const body: any = await c.req.json().catch(() => null);
    let checkout: string | null = null;
    if (polarConfigured(c.env) && !(await rateLimit(c, 'billingSync', user.id))) {
        await syncSubscriptions(c.env, user.id).catch(error => console.error('[billing] sync failed:', error));
        if (typeof body?.checkoutId === 'string' && CHECKOUT_ID.test(body.checkoutId)) {
            const found = await getCheckout(c.env, body.checkoutId).catch(() => null);
            if (found && (found.external_customer_id === user.id || found.metadata?.user_id === user.id)) checkout = found.status;
        }
    }
    c.header('Cache-Control', 'no-store');
    return c.json({ ...(await summary(c)), checkout });
});

// Only a public address helps Polar place the buyer; a local one (as in development) is left out
const publicIp = (ip: string) =>
    /^[\d.]+$|^[\da-f:]+$/i.test(ip) && !/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd]|fe80:)/i.test(ip) ? ip : null;

// { plan, locale? }: a Polar checkout for a paid plan. Users who already pay change plans in the portal instead, so
// nobody ends up paying for two subscriptions, and a failed renewal is fixed by updating the card, not by a second
// checkout.
billing.post('/checkout', requireUser, async c => {
    if (!polarConfigured(c.env)) return errorJson(c, NOT_CONFIGURED, 503, { code: 'not_configured' });
    const user = c.get('user');
    const limited = await rateLimit(c, 'billingUser', user.id);
    if (limited) return limited;
    const body: any = await c.req.json().catch(() => null);
    if (!isPaidPlanId(body?.plan)) return errorJson(c, '`plan` must be a paid plan.', 400);
    const at = accessTimes(c.env);
    const current = await getCurrentSubscription(c.env.DB, user.id, at);
    if (current && (current.status === 'past_due' || current.status === 'unpaid')) {
        return errorJson(c, 'Your last payment did not go through. Update your card under "Manage subscription".', 409, { code: 'past_due' });
    }
    if (current && grantsAccess(current, at)) {
        return errorJson(c, 'You already have a subscription. Change your plan from "Manage subscription".', 409, { code: 'has_subscription' });
    }
    return callPolar(c, async () => c.json({
        url: await createCheckout(c.env, {
            plan: body.plan,
            userId: user.id,
            email: user.email,
            name: user.name,
            ip: publicIp(clientIp(c)),
            locale: body?.locale === 'he' ? 'he' : 'en',
            successUrl: `${c.env.APP_URL}/billing?checkout=success&checkout_id={CHECKOUT_ID}`,
            returnUrl: `${c.env.APP_URL}/billing`,
        }),
    }));
});

// Polar's customer portal: change plan, card and cancellation, invoices. Without a stored subscription it asks Polar
// once first, in case the webhook has not arrived.
billing.post('/portal', requireUser, async c => {
    if (!polarConfigured(c.env)) return errorJson(c, NOT_CONFIGURED, 503, { code: 'not_configured' });
    const user = c.get('user');
    const limited = await rateLimit(c, 'billingUser', user.id);
    if (limited) return limited;
    const at = accessTimes(c.env);
    if (!(await getCurrentSubscription(c.env.DB, user.id, at))) {
        await syncSubscriptions(c.env, user.id).catch(error => console.error('[billing] sync failed:', error));
        if (!(await getCurrentSubscription(c.env.DB, user.id, at))) return errorJson(c, 'You have no subscription yet.', 404, { code: 'no_subscription' });
    }
    return callPolar(c, async () => c.json({ url: await createPortalSession(c.env, user.id, `${c.env.APP_URL}/billing`) }));
});

const REASONS: CancellationReason[] = ['customer_service', 'low_quality', 'missing_features', 'switched_service', 'too_complex', 'too_expensive', 'unused', 'other'];

// A reference the user can quote to support, e.g. KC-20261122-7F3A9C
const reference = () => `KC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

// { mode, reason? }: cancels the user's subscription. "period_end" stops renewals (the plan stays until the period
// ends), "undo" takes that back, and "now" ends it at once and refunds the unused days. Each one is also recorded as a
// support request, so the admin page lists it with its reference.
billing.post('/cancel', requireUser, async c => {
    if (!polarConfigured(c.env)) return errorJson(c, NOT_CONFIGURED, 503, { code: 'not_configured' });
    const user = c.get('user');
    const limited = await rateLimit(c, 'billingUser', user.id);
    if (limited) return limited;
    const body: any = await c.req.json().catch(() => null);
    const mode = body?.mode;
    if (mode !== 'period_end' && mode !== 'now' && mode !== 'undo') return errorJson(c, '`mode` must be "period_end", "now" or "undo".', 400);
    const reason: CancellationReason = REASONS.includes(body?.reason) ? body.reason : 'other';

    await syncSubscriptions(c.env, user.id).catch(error => console.error('[billing] sync failed:', error));
    const at = accessTimes(c.env);
    const current = await getCurrentSubscription(c.env.DB, user.id, at);
    if (!current || !grantsAccess(current, at)) return errorJson(c, 'You have no subscription to cancel.', 409, { code: 'nothing_to_cancel' });
    if (mode === 'undo' && !current.cancelAtPeriodEnd) return errorJson(c, 'Your subscription is not set to end.', 409, { code: 'not_canceled' });

    return callPolar(c, async () => {
        let refunded = 0;
        if (mode === 'now') {
            refunded = (await endNowWithRefund(c.env, current, reason, 'Canceled by the customer in KaruAI: ended now, unused days refunded')).refunded;
        } else {
            const updated = await updateSubscription(c.env, current.id, { cancel_at_period_end: mode === 'period_end' }, mode === 'period_end' ? reason : undefined);
            const row = subscriptionRow(c.env, updated, user.id);
            if (row) await saveSubscription(c.env.DB, row, at);
        }
        const ref = reference();
        await createSupportRequest(c.env.DB, {
            id: ref,
            category: 'cancellation',
            status: 'done',
            userId: user.id,
            name: user.name,
            email: user.email,
            plan: current.plan,
            page: '/cancel',
            message: `${mode === 'now' ? 'Ended now' : mode === 'undo' ? 'Cancellation undone' : 'Cancel at period end'} in the app`
                + ` (reason: ${reason}${refunded ? `, refunded ${(refunded / 100).toFixed(2)}` : ''})`,
        });
        console.log(JSON.stringify({ event: 'billing_cancel', userId: user.id, mode, reason, refunded, reference: ref }));
        return c.json({ ...(await summary(c)), reference: ref, refunded });
    });
});

// A refunded order: a full refund of a subscription's payment ends that subscription (Polar doesn't), a partial one is
// only logged. Returns why nothing was done, if so.
async function handleRefund(env: Env, orderId: string | undefined): Promise<string | null> {
    if (typeof orderId !== 'string') return 'no order';
    const order = await getOrder(env, orderId);
    if (!order?.subscription_id) return 'not a subscription order';
    const fullyRefunded = order.status === 'refunded' || (order.total_amount > 0 && order.refunded_amount >= order.total_amount);
    if (!fullyRefunded) {
        console.log(JSON.stringify({ event: 'polar_partial_refund', order: order.id, subscription: order.subscription_id }));
        return null;
    }
    const at = accessTimes(env);
    const { results } = await env.DB.prepare('SELECT user_id FROM subscriptions WHERE id = ?').bind(order.subscription_id).all<{ user_id: string }>();
    const userId = results[0]?.user_id;
    const stored = userId ? (await getSubscriptions(env.DB, userId)).find(item => item.id === order.subscription_id) : null;
    if (!stored) return 'unknown subscription';
    if (!grantsAccess(stored, at)) return null;
    const ended = await updateSubscription(env, stored.id, { revoke: true });
    const row = subscriptionRow(env, ended, stored.userId);
    if (row) await saveSubscription(env.DB, row, at);
    console.log(JSON.stringify({ event: 'polar_refund_revoked', order: order.id, subscription: stored.id, userId: stored.userId }));
    return null;
}

const MAX_WEBHOOK_BYTES = 1024 * 1024;
const BAD_SIGNATURE_NOTICE_MS = 10 * 60 * 1000;
let lastBadSignatureNotice = 0;

async function ignore(env: Env, type: string, data: any, userId: string | null, reason: string) {
    const event = { type, subscriptionId: data?.subscription_id ?? data?.id ?? null, productId: data?.product_id ?? null, userId, reason };
    await recordIgnoredWebhook(env.DB, event).catch(error => console.error('[billing] could not record an ignored webhook:', error));
    monitoring.notice(`Polar webhook ignored: ${reason}`, event);
}

// Polar's webhook: subscription.*, order.refunded and refund.* events. Anything but a 2xx makes Polar retry, so only a
// bad signature, a malformed body or a failure to store is answered with an error; events we do not use are
// acknowledged, recorded for the admin page and reported.
billing.post('/webhook', async c => {
    if (Number(c.req.header('content-length') ?? 0) > MAX_WEBHOOK_BYTES) return errorJson(c, 'Payload too large.', 413);
    const body = await c.req.text();
    if (body.length > MAX_WEBHOOK_BYTES) return errorJson(c, 'Payload too large.', 413);
    if (!(await verifyWebhook(c.env.POLAR_WEBHOOK_SECRET, c.req.raw.headers, body))) {
        if (Date.now() - lastBadSignatureNotice > BAD_SIGNATURE_NOTICE_MS) {
            lastBadSignatureNotice = Date.now();
            monitoring.notice('Polar webhook with a bad signature (check POLAR_WEBHOOK_SECRET)', { ip: clientIp(c) });
        }
        return errorJson(c, 'Invalid signature.', 401);
    }
    let event: any;
    try {
        event = JSON.parse(body);
    } catch {
        monitoring.notice('Polar webhook with a malformed body');
        return errorJson(c, 'Malformed JSON.', 400);
    }
    const type = typeof event?.type === 'string' ? event.type : '';
    const deliveryId = c.req.header('webhook-id')!;

    if (type === 'order.refunded' || type.startsWith('refund.')) {
        if (!(await markWebhookEvent(c.env.DB, deliveryId))) return c.body(null, 200);
        try {
            const skipped = await handleRefund(c.env, type === 'order.refunded' ? event.data?.id : event.data?.order_id);
            if (skipped && skipped !== 'not a subscription order') await ignore(c.env, type, event.data, null, skipped);
        } catch (error) {
            await unmarkWebhookEvent(c.env.DB, deliveryId).catch(() => undefined);
            throw error;
        }
        return c.body(null, 200);
    }
    if (!type.startsWith('subscription.')) return c.body(null, 202);

    const data: PolarSubscription = event.data;
    const userId = await resolveUser(c.env, data);
    const row = userId ? subscriptionRow(c.env, data, userId) : null;
    if (!row) {
        await ignore(c.env, type, data, userId, !userId ? 'unknown user' : 'unknown product');
        return c.body(null, 202);
    }

    if (!(await markWebhookEvent(c.env.DB, deliveryId))) return c.body(null, 200);
    let applied: boolean;
    try {
        applied = await saveSubscription(c.env.DB, row, accessTimes(c.env));
    } catch (error) {
        // Let Polar's retry handle it again
        await unmarkWebhookEvent(c.env.DB, deliveryId).catch(() => undefined);
        throw error;
    }
    // applied is false for a delivery older than what is stored (it changed nothing)
    console.log(JSON.stringify({ event: 'polar_webhook', type, subscription: row.id, status: row.status, plan: row.plan, userId: row.userId, applied }));
    return c.body(null, 200);
});

export default billing;
