import type { SettingKey } from '../../../types';
import { isPlanId, PAID_PLAN_IDS, PLANS, planRank } from '../../../shared/plans';
import {
    closeSupportRequest, countCarousels, DEFAULT_GEMINI_MODEL, deleteUser, getAdminStats, getCurrentSubscription, getStoredSetting, getUserById,
    grantsAccess, lastWebhookAt, listIgnoredWebhooks, listSupportRequests, listUsersWithStats, saveSubscription, SETTING_ENV, setPlanOverride,
    setSetting, setUserRole, setUserSuspended,
} from '../db';
import { getProduct, lastPolarVersion, listSubscriptionsPage, polarConfigured, PolarError, POLAR_VERSION, productId, updateSubscription } from '../polar';
import { deleteCarouselFiles } from '../storage';
import { createApp, errorJson, requireAdmin, requireUser, type AppContext } from '../app';
import { accessTimes, closeBillingForDeletion, renewingSubscription } from './billing';

const SECRET_KEYS: SettingKey[] = ['gemini_api_key', 'pollinations_api_key'];
const ALL_KEYS: SettingKey[] = [...SECRET_KEYS, 'gemini_model'];

// API keys never go back to the browser in full: only their last 4 characters
const mask = (value: string) => (value.length <= 8 ? '••••' : `••••••••${value.slice(-4)}`);

async function describe(env: Env, key: SettingKey) {
    const stored = await getStoredSetting(env.DB, key);
    const envValue = env[SETTING_ENV[key]];
    const value = stored?.value || envValue || '';
    const shown = SECRET_KEYS.includes(key) ? (value ? mask(value) : '') : value || DEFAULT_GEMINI_MODEL;
    return {
        key,
        value: shown,
        source: stored ? 'admin' : envValue ? 'env' : 'none',
        envName: SETTING_ENV[key],
        updatedAt: stored?.updatedAt ?? null,
    };
}

const admin = createApp();
admin.use('*', requireUser, requireAdmin);

admin.get('/settings', async c => c.json({ settings: await Promise.all(ALL_KEYS.map(key => describe(c.env, key))) }));

// { key, value }: a non-empty value sets it, null or "" removes it (falling back to the Worker secret)
admin.put('/settings', async c => {
    const body: any = await c.req.json().catch(() => null);
    if (!ALL_KEYS.includes(body?.key) || (body.value !== null && typeof body.value !== 'string') || (body.value?.length ?? 0) > 500) {
        return errorJson(c, 'Invalid setting.', 400);
    }
    await setSetting(c.env.DB, body.key, body.value);
    return c.json({ setting: await describe(c.env, body.key) });
});

admin.get('/stats', async c => {
    c.header('Cache-Control', 'no-store');
    return c.json(await getAdminStats(c.env.DB, accessTimes(c.env)));
});

admin.get('/users', async c => {
    const [users, totalCarousels] = await Promise.all([listUsersWithStats(c.env.DB), countCarousels(c.env.DB)]);
    return c.json({ users, totalCarousels });
});

// Admins manage other accounts only, so nobody can lock the last admin out by accident
async function targetUser(c: AppContext) {
    const id = c.req.param('id')!;
    if (id === c.get('user').id) return { response: errorJson(c, 'You cannot change or delete your own account here.', 400) };
    const target = await getUserById(c.env.DB, id);
    return target ? { target } : { response: errorJson(c, 'User not found.', 404) };
}

// { role?, plan?, until?, reason?, suspended?, cancelSubscription? }: changes any of the user's role, plan and
// suspension. A paid plan is a comp (an override kept apart from Polar, optionally until a date); "free" removes the
// comp. A plan below what the user pays for is refused, since Polar would go on charging for it. Suspending also sets
// a renewing subscription to end at the end of its period, unless cancelSubscription is false.
admin.patch('/users/:id', async c => {
    const { target, response } = await targetUser(c);
    if (!target) return response;
    const body: any = await c.req.json().catch(() => null);
    const { role, plan, suspended } = body ?? {};
    const until = body?.until ?? null;
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 200) || null : null;
    if (role === undefined && plan === undefined && suspended === undefined) return errorJson(c, 'Nothing to change.', 400);
    if (role !== undefined && role !== 'user' && role !== 'admin') return errorJson(c, '`role` must be "user" or "admin".', 400);
    if (plan !== undefined && !isPlanId(plan)) return errorJson(c, '`plan` is not a known plan.', 400);
    if (until !== null && (typeof until !== 'string' || Number.isNaN(Date.parse(until)))) return errorJson(c, '`until` must be a date.', 400);
    if (suspended !== undefined && typeof suspended !== 'boolean') return errorJson(c, '`suspended` must be true or false.', 400);

    const at = accessTimes(c.env);
    if (plan !== undefined) {
        const paid = await getCurrentSubscription(c.env.DB, target.id, at);
        const paying = paid && grantsAccess(paid, at) ? paid : null;
        if (paying && planRank(plan) < planRank(paying.plan)) {
            return errorJson(c, `This user pays for ${PLANS[paying.plan].name}. Cancel the subscription on Polar to lower their plan.`, 409, {
                code: 'below_subscription', subscriptionPlan: paying.plan,
            });
        }
        const comp = plan !== 'free' && plan !== paying?.plan;
        await setPlanOverride(c.env.DB, target.id, comp ? { plan, until: until && new Date(until).toISOString(), reason } : null, at);
    }
    if (role !== undefined) await setUserRole(c.env.DB, target.id, role);
    let subscription: 'canceled' | 'failed' | null = null;
    if (suspended !== undefined) {
        await setUserSuspended(c.env.DB, target.id, suspended);
        const renewing = suspended && body?.cancelSubscription !== false && polarConfigured(c.env) ? await renewingSubscription(c.env, target.id) : null;
        if (renewing) {
            try {
                const updated = await updateSubscription(c.env, renewing.id, { cancel_at_period_end: true });
                await saveSubscription(c.env.DB, { ...renewing, cancelAtPeriodEnd: !!updated.cancel_at_period_end, modifiedAt: new Date().toISOString() }, at);
                subscription = 'canceled';
            } catch (error) {
                if (!(error instanceof PolarError)) throw error;
                console.error(`[admin] ${error.message}`);
                subscription = 'failed';
            }
        }
    }
    return c.json({ user: await getUserById(c.env.DB, target.id), subscription });
});

admin.delete('/users/:id', async c => {
    const { target, response } = await targetUser(c);
    if (!target) return response;
    // Polar would go on charging a deleted account: a renewing subscription ends now with the unused days refunded and
    // the Polar customer is deleted. If Polar fails, nothing is deleted.
    try {
        if ((await closeBillingForDeletion(c.env, target.id)) === 'has_subscription') {
            return errorJson(c, 'This user has a subscription that still renews. Cancel it on Polar first.', 409, { code: 'has_subscription' });
        }
    } catch (error) {
        if (!(error instanceof PolarError)) throw error;
        console.error(`[admin] ${error.message}`);
        return errorJson(c, 'Polar is not responding, so the user was not deleted.', 502, { code: 'polar_unavailable' });
    }
    const carouselIds = await deleteUser(c.env.DB, target.id);
    c.executionCtx.waitUntil(Promise.all(carouselIds.map(id => deleteCarouselFiles(c.env.FILES, id).catch(() => undefined))));
    return c.body(null, 204);
});

// Requests to support: cancellations (also those done in the app, for their reference) and the contact form
admin.get('/requests', async c => {
    c.header('Cache-Control', 'no-store');
    return c.json({ requests: await listSupportRequests(c.env.DB) });
});

admin.post('/requests/:id/done', async c => {
    if (!(await closeSupportRequest(c.env.DB, c.req.param('id')))) return errorJson(c, 'No open request with that id.', 404);
    return c.body(null, 204);
});

// Whether payments can work: the Polar token, the products and their prices against shared/plans.ts, the webhook
// secret and the latest delivery, the API version Polar answered with, and webhook deliveries we could not use
admin.get('/billing-health', async c => {
    c.header('Cache-Control', 'no-store');
    const env = c.env;
    const configured = polarConfigured(env);
    let token: 'ok' | 'missing' | 'refused' | 'unreachable' = env.POLAR_ACCESS_TOKEN ? 'ok' : 'missing';
    if (env.POLAR_ACCESS_TOKEN) {
        try {
            await listSubscriptionsPage(env, { limit: '1' });
        } catch (error) {
            token = error instanceof PolarError && (error.status === 401 || error.status === 403) ? 'refused' : 'unreachable';
        }
    }
    const products = await Promise.all(PAID_PLAN_IDS.map(async plan => {
        const id = productId(env, plan) ?? null;
        const expected = PLANS[plan].monthlyPrice * 100;
        const product = id && token === 'ok' ? await getProduct(env, id).catch(() => null) : null;
        const price = product?.prices.find(item => !item.is_archived && item.price_currency === 'ils');
        const problems = [
            !id && 'no product id',
            id && token === 'ok' && !product && 'not found on Polar',
            product?.is_archived && 'archived',
            product && product.recurring_interval !== 'month' && 'not monthly',
            product && !price && 'no ILS price',
            price && price.price_amount !== expected && `price ${(price.price_amount ?? 0) / 100} instead of ${expected / 100}`,
        ].filter((problem): problem is string => !!problem);
        return { plan, id, name: product?.name ?? null, amount: price?.price_amount ?? null, expected, problems };
    }));
    return c.json({
        configured,
        server: env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production',
        token,
        products,
        webhookSecret: !!env.POLAR_WEBHOOK_SECRET,
        lastWebhookAt: await lastWebhookAt(env.DB),
        apiVersion: { sent: POLAR_VERSION, answered: lastPolarVersion },
        ignoredWebhooks: await listIgnoredWebhooks(env.DB),
    });
});

export default admin;
