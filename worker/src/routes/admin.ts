import type { SettingKey } from '../../../types';
import {
    countCarousels, DEFAULT_GEMINI_MODEL, deleteUser, getStoredSetting, getUserById, listUsersWithStats, SETTING_ENV,
    setSetting, setUserRole,
} from '../db';
import { deleteCarouselFiles } from '../storage';
import { createApp, errorJson, requireAdmin, requireUser, type AppContext } from '../app';

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

admin.patch('/users/:id', async c => {
    const { target, response } = await targetUser(c);
    if (!target) return response;
    const body: any = await c.req.json().catch(() => null);
    if (body?.role !== 'user' && body?.role !== 'admin') return errorJson(c, '`role` must be "user" or "admin".', 400);
    await setUserRole(c.env.DB, target.id, body.role);
    return c.json({ user: await getUserById(c.env.DB, target.id) });
});

admin.delete('/users/:id', async c => {
    const { target, response } = await targetUser(c);
    if (!target) return response;
    const carouselIds = await deleteUser(c.env.DB, target.id);
    c.executionCtx.waitUntil(Promise.all(carouselIds.map(id => deleteCarouselFiles(c.env.FILES, id).catch(() => undefined))));
    return c.body(null, 204);
});

export default admin;
