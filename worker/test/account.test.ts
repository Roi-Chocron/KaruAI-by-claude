import { describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { api, createCarousel, signIn } from './helpers';

describe('account', () => {
    it('shows the plan and this month usage', async () => {
        const { cookie } = await signIn();
        await createCarousel(cookie);
        const body = await (await api('/api/account', { cookie })).json<any>();
        expect(body.plan.id).toBe('free');
        expect(body.usage).toMatchObject({ carousels: 1, messages: 0, images: 0 });
        expect(body.carouselCount).toBe(1);
    });

    it('renames the user', async () => {
        const { cookie } = await signIn();
        const response = await api('/api/account', { method: 'PATCH', cookie, json: { name: 'רועי' } });
        expect((await response.json<any>()).user.name).toBe('רועי');
        expect((await (await api('/api/auth/me', { cookie })).json<any>()).user.name).toBe('רועי');
        expect((await api('/api/account', { method: 'PATCH', cookie, json: { name: '' } })).status).toBe(400);
    });

    it('exports the documents', async () => {
        const { cookie, user } = await signIn();
        const id = await createCarousel(cookie);
        await api(`/api/carousels/${id}`, { method: 'PUT', cookie, headers: { 'Content-Type': 'application/json' }, body: '{"slides":[42]}' });
        const response = await api('/api/account/export', { cookie });
        expect(response.headers.get('content-disposition')).toContain('attachment');
        const data = await response.json<any>();
        expect(data.user.id).toBe(user.id);
        expect(data.carousels[0].document).toEqual({ slides: [42] });
    });

    it('signs out everywhere', async () => {
        const email = `everywhere-${crypto.randomUUID().slice(0, 6)}@example.test`;
        const first = await signIn(email);
        const second = await signIn(email);
        expect((await api('/api/account/logout-all', { method: 'POST', cookie: first.cookie })).status).toBe(204);
        expect((await api('/api/auth/me', { cookie: second.cookie })).status).toBe(401);
    });

    it('deletes the account with its carousels once the email is confirmed', async () => {
        const { cookie, user } = await signIn();
        const id = await createCarousel(cookie);
        await api(`/api/carousels/${id}/thumbnail`, { method: 'PUT', cookie, headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array([1]) });
        expect((await api('/api/account', { method: 'DELETE', cookie, json: { confirmEmail: 'wrong@example.test' } })).status).toBe(400);
        expect((await api('/api/account', { method: 'DELETE', cookie, json: { confirmEmail: user.email } })).status).toBe(204);
        expect((await api('/api/auth/me', { cookie })).status).toBe(401);
        expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM carousels WHERE id = ?').bind(id).first('n')).toBe(0);
    });

    it('keeps the last admin', async () => {
        const { cookie } = await signIn('admin@example.test');
        const response = await api('/api/account', { method: 'DELETE', cookie, json: { confirmEmail: 'admin@example.test' } });
        expect(response.status).toBe(400);
    });
});
