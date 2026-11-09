import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { devLoginEnabled } from '../src/app';
import { api, signIn } from './helpers';

describe('sessions', () => {
    it('has no user without a session', async () => {
        const response = await api('/api/auth/me');
        expect(response.status).toBe(401);
    });

    it('signs in with the dev login and sets both cookies', async () => {
        const response = await api('/api/auth/dev-login', { method: 'POST', json: { email: 'Someone@Example.test' } });
        expect(response.status).toBe(200);
        const cookies = response.headers.getSetCookie().join('\n');
        expect(cookies).toMatch(/karu_session=[^;]+;.*HttpOnly/);
        expect(cookies).toMatch(/karu_signed_in=1/);
        const { user } = await response.json<any>();
        expect(user).toMatchObject({ email: 'someone@example.test', role: 'user', plan: 'free' });
    });

    it('returns the signed-in user and forgets them after logout', async () => {
        const { cookie, user } = await signIn();
        expect((await (await api('/api/auth/me', { cookie })).json<any>()).user.id).toBe(user.id);
        expect((await api('/api/auth/logout', { method: 'POST', cookie })).status).toBe(204);
        expect((await api('/api/auth/me', { cookie })).status).toBe(401);
    });

    it('makes the ADMIN_EMAIL account an admin', async () => {
        const { user } = await signIn('admin@example.test');
        expect(user.role).toBe('admin');
    });

    it('rejects an invalid email', async () => {
        const response = await api('/api/auth/dev-login', { method: 'POST', json: { email: 'not-an-email' } });
        expect(response.status).toBe(400);
    });
});

describe('dev login guard', () => {
    const env = (APP_URL: string, DEV_LOGIN?: string) => ({ APP_URL, DEV_LOGIN }) as unknown as Env;

    it('is on only for a local APP_URL with DEV_LOGIN=true', () => {
        expect(devLoginEnabled(env('http://localhost:3000', 'true'))).toBe(true);
        expect(devLoginEnabled(env('http://127.0.0.1:8787', 'true'))).toBe(true);
        expect(devLoginEnabled(env('https://karuai.example.com', 'true'))).toBe(false);
        expect(devLoginEnabled(env('http://localhost:3000'))).toBe(false);
    });
});

describe('Google sign-in', () => {
    it('reports which providers are available', async () => {
        expect(await (await api('/api/auth/providers')).json()).toEqual({ google: false, devLogin: true });
    });

    it('explains when Google is not configured', async () => {
        const response = await api('/api/auth/google', { redirect: 'manual' });
        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=config');
    });

    it('refuses a callback whose state does not match', async () => {
        const response = await api('/api/auth/google/callback?code=abc&state=forged', { redirect: 'manual' });
        expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=state');
    });
});

describe('cross-origin protection', () => {
    it('refuses changes from another origin', async () => {
        const { cookie } = await signIn();
        const forged = await exports.default.fetch(new Request('http://localhost:3000/api/carousels', {
            method: 'POST', headers: { Origin: 'https://evil.example', Cookie: cookie },
        }));
        expect(forged.status).toBe(403);
    });
});
