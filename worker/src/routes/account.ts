import { PLANS } from '../../../shared/plans';
import {
    countAdmins, deleteUser, deleteUserSessions, getMonthlyUsage, listCarouselRows, listUsage, publicUser, updateUserName,
} from '../db';
import { deleteCarouselFiles, readCarouselDocument } from '../storage';
import { clearSessionCookies, createApp, errorJson, requireUser } from '../app';

// The signed-in user's own account: plan and usage, profile, sessions, data export and deletion
const account = createApp();
account.use('*', requireUser);

account.get('/', async c => {
    const user = c.get('user');
    const [usage, carousels] = await Promise.all([getMonthlyUsage(c.env.DB, user.id), listCarouselRows(c.env.DB, user.id)]);
    c.header('Cache-Control', 'no-store');
    return c.json({ user: publicUser(user), plan: PLANS[user.plan] ?? PLANS.free, usage, carouselCount: carousels.length });
});

account.patch('/', async c => {
    const body: any = await c.req.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 100) return errorJson(c, 'The name must be 1 to 100 characters.', 400);
    await updateUserName(c.env.DB, c.get('user').id, name);
    return c.json({ user: publicUser({ ...c.get('user'), name }) });
});

// Signs the account out on every device, this one included
account.post('/logout-all', async c => {
    await deleteUserSessions(c.env.DB, c.get('user').id);
    clearSessionCookies(c);
    return c.body(null, 204);
});

// Everything stored about the user as one JSON file (images are listed by id inside the documents, not embedded).
// The stored documents are inserted as is rather than parsed, to keep the Worker's CPU time low.
account.get('/export', async c => {
    const user = c.get('user');
    const [carousels, usage] = await Promise.all([listCarouselRows(c.env.DB, user.id), listUsage(c.env.DB, user.id)]);
    const parts: string[] = [];
    for (const carousel of carousels) {
        const document = await readCarouselDocument(c.env.FILES, carousel.id);
        parts.push(`{"meta":${JSON.stringify(carousel)},"document":${document ? await document.text() : 'null'}}`);
    }
    const head = JSON.stringify({ exportedAt: new Date().toISOString(), user, usage }).slice(0, -1);
    return c.body(`${head},"carousels":[${parts.join(',')}]}`, 200, {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="karuai-export-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
    });
});

// Deletes the account and all its carousels for good. The body must repeat the account's email.
account.delete('/', async c => {
    const user = c.get('user');
    const body: any = await c.req.json().catch(() => null);
    if (typeof body?.confirmEmail !== 'string' || body.confirmEmail.trim().toLowerCase() !== user.email) {
        return errorJson(c, 'Type your email address to confirm.', 400);
    }
    if (user.role === 'admin' && (await countAdmins(c.env.DB)) <= 1) {
        return errorJson(c, 'You are the only admin. Make someone else an admin before deleting your account.', 400);
    }
    const carouselIds = await deleteUser(c.env.DB, user.id);
    c.executionCtx.waitUntil(Promise.all(carouselIds.map(id => deleteCarouselFiles(c.env.FILES, id).catch(() => undefined))));
    clearSessionCookies(c);
    return c.body(null, 204);
});

export default account;
