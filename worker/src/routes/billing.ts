import { isPaidPlanId } from '../../../shared/plans';
import {
    getCurrentSubscription, getSubscriptions, getUserById, listOverdueSubscriptionUsers, markWebhookEvent, saveSubscription,
    unmarkWebhookEvent, type SubscriptionRow,
} from '../db';
import {
    ACCESS_STATUSES, createCheckout, createPortalSession, listSubscriptions, planForProduct, polarConfigured, PolarError, verifyWebhook,
    type PolarEnv, type PolarSubscription,
} from '../polar';
import { clientIp, createApp, errorJson, rateLimit, requireUser, type AppContext } from '../app';

// Paid plans through Polar: the billing page asks for a checkout or the customer portal. Polar's webhooks keep the
// subscriptions table (and with it each user's plan) up to date, and so does asking Polar's API directly: when the
// billing page loads, right after a checkout and once a day for subscriptions that look overdue. Either alone is
// enough, so a missed webhook (or none at all, as on localhost) only delays a change.
const billing = createApp();

const NOT_CONFIGURED = 'Online payments are not set up yet.';

// Polar's own errors become a 502 with a message the page can show; the details go to the logs
async function callPolar(c: AppContext, request: () => Promise<string>) {
    try {
        return c.json({ url: await request() });
    } catch (error) {
        if (!(error instanceof PolarError)) throw error;
        console.error(`[billing] ${error.message}`);
        return errorJson(c, 'The payment service is not responding. Please try again in a minute.', 502);
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
        modifiedAt,
    };
}

const sameSubscription = (a: SubscriptionRow, b: SubscriptionRow) =>
    a.productId === b.productId && a.status === b.status && a.currentPeriodEnd === b.currentPeriodEnd
    && a.cancelAtPeriodEnd === b.cancelAtPeriodEnd && a.modifiedAt === b.modifiedAt;

// Stores what Polar's API says about the user's subscriptions. Rows that did not change are left alone, so a plan an
// admin set by hand stays until something changes on Polar (as with webhooks). Returns how many rows changed.
export async function syncSubscriptions(env: Env, userId: string): Promise<number> {
    const [remote, stored] = await Promise.all([listSubscriptions(env, userId), getSubscriptions(env.DB, userId)]);
    let changed = 0;
    for (const data of remote) {
        const row = subscriptionRow(env, data, userId);
        const known = row && stored.find(item => item.id === row.id);
        if (!row || (known && sameSubscription(known, row))) continue;
        await saveSubscription(env.DB, row, ACCESS_STATUSES);
        changed++;
    }
    if (changed) console.log(JSON.stringify({ event: 'polar_sync', userId, changed }));
    return changed;
}

// The daily job's safety net for missed webhooks: subscriptions still granting a plan an hour after their paid period
// ended, which Polar should have renewed or ended by then, are looked up on Polar. A few per day, oldest first, to stay
// well inside the Worker's subrequest limit.
export async function syncOverdueSubscriptions(env: Env, limit = 20) {
    if (!polarConfigured(env)) return;
    const before = new Date(Date.now() - 3600 * 1000).toISOString();
    for (const userId of await listOverdueSubscriptionUsers(env.DB, ACCESS_STATUSES, before, limit)) {
        await syncSubscriptions(env, userId).catch(error => console.error(`[billing] daily sync for ${userId} failed:`, error));
    }
}

// A subscription that will charge the user again: one that grants a plan and is not set to end
export async function renewingSubscription(env: Env, userId: string): Promise<SubscriptionRow | null> {
    if (polarConfigured(env)) await syncSubscriptions(env, userId).catch(error => console.error('[billing] sync failed:', error));
    const subscription = await getCurrentSubscription(env.DB, userId, ACCESS_STATUSES);
    return subscription && ACCESS_STATUSES.includes(subscription.status) && !subscription.cancelAtPeriodEnd ? subscription : null;
}

// The signed-in user's subscription, for the billing page
async function summary(c: AppContext) {
    const subscription = await getCurrentSubscription(c.env.DB, c.get('user').id, ACCESS_STATUSES);
    c.header('Cache-Control', 'no-store');
    return c.json({
        enabled: polarConfigured(c.env),
        subscription: subscription && {
            plan: subscription.plan,
            status: subscription.status,
            active: ACCESS_STATUSES.includes(subscription.status),
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
    });
}

billing.get('/', requireUser, summary);

// The same answer as GET /, after asking Polar for the user's subscriptions. The billing page calls this when it
// loads and while it waits for a finished checkout to become a subscription. If Polar fails or the user asks too
// often, it answers with what is stored.
billing.post('/sync', requireUser, async c => {
    const user = c.get('user');
    if (polarConfigured(c.env) && !(await rateLimit(c, 'billingSync', user.id))) {
        await syncSubscriptions(c.env, user.id).catch(error => console.error('[billing] sync failed:', error));
    }
    return summary(c);
});

// Only a public address helps Polar place the buyer; a local one (as in development) is left out
const publicIp = (ip: string) =>
    /^[\d.]+$|^[\da-f:]+$/i.test(ip) && !/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd]|fe80:)/i.test(ip) ? ip : null;

// { plan }: a Polar checkout for a paid plan. Users who already pay change plans in the portal instead, so
// nobody ends up paying for two subscriptions.
billing.post('/checkout', requireUser, async c => {
    if (!polarConfigured(c.env)) return errorJson(c, NOT_CONFIGURED, 503);
    const body: any = await c.req.json().catch(() => null);
    if (!isPaidPlanId(body?.plan)) return errorJson(c, '`plan` must be a paid plan.', 400);
    const user = c.get('user');
    const current = await getCurrentSubscription(c.env.DB, user.id, ACCESS_STATUSES);
    if (current && ACCESS_STATUSES.includes(current.status)) {
        return errorJson(c, 'You already have a subscription. Change your plan from "Manage subscription".', 409, { code: 'has_subscription' });
    }
    return callPolar(c, () => createCheckout(c.env, {
        plan: body.plan,
        userId: user.id,
        email: user.email,
        name: user.name,
        ip: publicIp(clientIp(c)),
        successUrl: `${c.env.APP_URL}/billing?checkout=success&checkout_id={CHECKOUT_ID}`,
        returnUrl: `${c.env.APP_URL}/billing`,
    }));
});

// Polar's customer portal: change plan, card and cancellation, invoices
billing.post('/portal', requireUser, async c => {
    if (!polarConfigured(c.env)) return errorJson(c, NOT_CONFIGURED, 503);
    const user = c.get('user');
    if (!(await getCurrentSubscription(c.env.DB, user.id, ACCESS_STATUSES))) return errorJson(c, 'You have no subscription yet.', 404);
    return callPolar(c, () => createPortalSession(c.env, user.id, `${c.env.APP_URL}/billing`));
});

// Polar's webhook (subscription.* events). Anything but a 2xx makes Polar retry, so only a bad signature or a
// failure to store is answered with an error; events we do not use are acknowledged and ignored.
billing.post('/webhook', async c => {
    const body = await c.req.text();
    if (!(await verifyWebhook(c.env.POLAR_WEBHOOK_SECRET, c.req.raw.headers, body))) return errorJson(c, 'Invalid signature.', 401);
    const event: any = JSON.parse(body);
    if (typeof event?.type !== 'string' || !event.type.startsWith('subscription.')) return c.body(null, 202);

    const data: PolarSubscription = event.data;
    const userId = data?.customer?.external_id ?? (typeof data?.metadata?.user_id === 'string' ? data.metadata.user_id : null);
    const row = userId ? subscriptionRow(c.env, data, userId) : null;
    if (!row || !(await getUserById(c.env.DB, row.userId))) {
        console.warn(JSON.stringify({ event: 'polar_webhook_ignored', type: event.type, subscription: data?.id, product: data?.product_id, userId }));
        return c.body(null, 202);
    }

    const deliveryId = c.req.header('webhook-id')!;
    if (!(await markWebhookEvent(c.env.DB, deliveryId))) return c.body(null, 200);
    try {
        await saveSubscription(c.env.DB, row, ACCESS_STATUSES);
    } catch (error) {
        // Let Polar's retry handle it again
        await unmarkWebhookEvent(c.env.DB, deliveryId).catch(() => undefined);
        throw error;
    }
    console.log(JSON.stringify({ event: 'polar_webhook', type: event.type, subscription: row.id, status: row.status, plan: row.plan, userId: row.userId }));
    return c.body(null, 200);
});

export default billing;
