import { describe, expect, it } from 'vitest';
import { api, createCarousel, signIn } from './helpers';

describe('admin', () => {
    it('is for admins only', async () => {
        const { cookie } = await signIn();
        expect((await api('/api/admin/users', { cookie })).status).toBe(403);
        expect((await api('/api/admin/stats', { cookie })).status).toBe(403);
    });

    it('lists users with their usage and shows the stats', async () => {
        const admin = await signIn('admin@example.test');
        const member = await signIn();
        await createCarousel(member.cookie);
        const { users } = await (await api('/api/admin/users', { cookie: admin.cookie })).json<any>();
        const row = users.find((user: any) => user.id === member.user.id);
        expect(row).toMatchObject({ plan: 'free', carouselCount: 1, usage: { carousels: 1 } });
        const stats = await (await api('/api/admin/stats', { cookie: admin.cookie })).json<any>();
        expect(stats.users).toBeGreaterThanOrEqual(2);
        expect(stats.month.carousels).toBeGreaterThanOrEqual(1);
    });

    it('changes plans and validates them', async () => {
        const admin = await signIn('admin@example.test');
        const member = await signIn();
        const patch = (json: unknown) => api(`/api/admin/users/${member.user.id}`, { method: 'PATCH', cookie: admin.cookie, json });
        expect((await (await patch({ plan: 'pro' })).json<any>()).user.plan).toBe('pro');
        expect((await patch({ plan: 'platinum' })).status).toBe(400);
        expect((await (await api('/api/auth/me', { cookie: member.cookie })).json<any>()).user.plan).toBe('pro');
    });

    it('suspends a user, who is signed out and cannot sign in again', async () => {
        const admin = await signIn('admin@example.test');
        const member = await signIn();
        const patch = (suspended: boolean) =>
            api(`/api/admin/users/${member.user.id}`, { method: 'PATCH', cookie: admin.cookie, json: { suspended } });

        expect((await (await patch(true)).json<any>()).user.suspendedAt).not.toBeNull();
        expect((await api('/api/carousels', { cookie: member.cookie })).status).toBe(401);
        const again = await api('/api/auth/dev-login', { method: 'POST', json: { email: member.user.email } });
        expect(again.status).toBe(403);

        await patch(false);
        const back = await signIn(member.user.email);
        expect((await api('/api/carousels', { cookie: back.cookie })).status).toBe(200);
    });

    it('does not let admins change themselves', async () => {
        const admin = await signIn('admin@example.test');
        const response = await api(`/api/admin/users/${admin.user.id}`, { method: 'PATCH', cookie: admin.cookie, json: { role: 'user' } });
        expect(response.status).toBe(400);
    });
});
