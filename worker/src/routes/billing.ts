import { isPaidPlanId } from '../../../shared/plans';
import { getCurrentSubscription, getUserById, markWebhookEvent, saveSubscription, unmarkWebhookEvent } from '../db';
import {
    ACCESS_STATUSES, createCheckout, createPortalSession, planForProduct, polarConfigured, PolarError, verifyWebhook, type PolarSubscription,
} from '../polar';
import { createApp, errorJson, requireUser, type AppContext } from '../app';

// Paid plans through Polar: the billing page asks for a checkout or the customer portal, and Polar's webhooks
// keep the subscriptions table (and with it each user's plan) up to date.
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

// The signed-in user's subscription, for the billing page
billing.get('/', requireUser, async c => {
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
});

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
    const plan = planForProduct(c.env, data?.product_id);
    const userId = data?.customer?.external_id ?? (typeof data?.metadata?.user_id === 'string' ? data.metadata.user_id : null);
    if (!plan || !userId || !(await getUserById(c.env.DB, userId))) {
        console.warn(JSON.stringify({ event: 'polar_webhook_ignored', type: event.type, subscription: data?.id, product: data?.product_id, userId }));
        return c.body(null, 202);
    }

    const deliveryId = c.req.header('webhook-id')!;
    if (!(await markWebhookEvent(c.env.DB, deliveryId))) return c.body(null, 200);
    try {
        await saveSubscription(c.env.DB, {
            id: data.id,
            userId,
            productId: data.product_id,
            plan,
            status: data.status,
            currentPeriodEnd: data.current_period_end ?? null,
            cancelAtPeriodEnd: !!data.cancel_at_period_end,
            modifiedAt: data.modified_at ?? data.created_at,
        }, ACCESS_STATUSES);
    } catch (error) {
        // Let Polar's retry handle it again
        await unmarkWebhookEvent(c.env.DB, deliveryId).catch(() => undefined);
        throw error;
    }
    console.log(JSON.stringify({ event: 'polar_webhook', type: event.type, subscription: data.id, status: data.status, plan, userId }));
    return c.body(null, 200);
});

export default billing;
