import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { PLANS } from '../../shared/plans';
import { api, createCarousel, geminiReply, signIn } from './helpers';

afterEach(() => vi.restoreAllMocks());

const usage = async (cookie: string) => (await (await api('/api/account', { cookie })).json<any>()).usage;

// Answers Gemini and Pollinations requests; everything else goes out as usual
function mockUpstream(gemini: () => Response, image = () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/jpeg' } })) {
    const realFetch = globalThis.fetch;
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.includes('generativelanguage.googleapis.com')) return gemini();
        if (url.startsWith('https://gen.pollinations.ai/')) return image();
        return realFetch(input, init);
    });
}

describe('carousel quota', () => {
    it('stops a free user after the plan limit and counts nothing for admins', async () => {
        const { cookie } = await signIn();
        const limit = PLANS.free.limits.carouselsPerMonth!;
        for (let i = 0; i < limit; i++) await createCarousel(cookie);
        const refused = await api('/api/carousels', { method: 'POST', cookie });
        expect(refused.status).toBe(402);
        expect(await refused.json()).toMatchObject({ code: 'quota_exceeded', kind: 'carousels', limit, upgradeUrl: '/billing' });
        expect((await usage(cookie)).carousels).toBe(limit);

        const admin = await signIn('admin@example.test');
        for (let i = 0; i <= limit; i++) await createCarousel(admin.cookie);
    });

    it('follows the plan an admin sets', async () => {
        const { cookie, user } = await signIn();
        await env.DB.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").bind(user.id).run();
        for (let i = 0; i <= PLANS.free.limits.carouselsPerMonth!; i++) await createCarousel(cookie);
    });
});

describe('AI chat', () => {
    it('sends the message to Gemini, returns the carousel and counts the message and tokens', async () => {
        const { cookie } = await signIn();
        const carouselId = await createCarousel(cookie);
        const fetchSpy = mockUpstream(() => geminiReply({ title: 'Coffee', slides: [] }, 250));

        const response = await api('/api/chat', { method: 'POST', cookie, json: { message: 'hello', carouselId } });
        expect(response.status).toBe(200);
        const body = await response.json<any>();
        expect(JSON.parse(body.responseText)).toEqual({ title: 'Coffee', slides: [] });
        expect(body.currentRequestTokens).toBe(250);
        expect(fetchSpy).toHaveBeenCalled();
        await vi.waitFor(async () => expect(await usage(cookie)).toMatchObject({ messages: 1, tokens: 250 }));
    });

    it('does not count a request Gemini fails', async () => {
        const { cookie } = await signIn();
        const carouselId = await createCarousel(cookie);
        mockUpstream(() => Response.json({ error: { code: 503, message: 'overloaded', status: 'UNAVAILABLE' } }, { status: 503 }));
        const response = await api('/api/chat', { method: 'POST', cookie, json: { message: 'hello', carouselId } });
        expect(response.status).toBe(503);
        expect(await response.json()).toMatchObject({ retryable: true });
        expect((await usage(cookie)).messages).toBe(0);
    });

    it("refuses another user's carousel", async () => {
        const owner = await signIn();
        const stranger = await signIn();
        const carouselId = await createCarousel(owner.cookie);
        const response = await api('/api/chat', { method: 'POST', cookie: stranger.cookie, json: { message: 'hi', carouselId } });
        expect(response.status).toBe(404);
    });

    it('stops at the monthly message limit', async () => {
        const { cookie, user } = await signIn();
        const carouselId = await createCarousel(cookie);
        const limit = PLANS.free.limits.aiMessagesPerMonth!;
        await env.DB.prepare('UPDATE usage_daily SET chat_requests = ? WHERE user_id = ?').bind(limit, user.id).run();
        const response = await api('/api/chat', { method: 'POST', cookie, json: { message: 'hi', carouselId } });
        expect(response.status).toBe(402);
    });

    it('rate-limits bursts', async () => {
        const { cookie } = await signIn();
        const statuses: number[] = [];
        for (let i = 0; i < 21; i++) statuses.push((await api('/api/chat', { method: 'POST', cookie, json: { message: '' } })).status);
        expect(statuses.slice(0, 20).every(status => status === 400)).toBe(true);
        expect(statuses[20]).toBe(429);
    });
});

describe('AI images', () => {
    it('streams the generated image back and counts it', async () => {
        const { cookie } = await signIn();
        mockUpstream(() => new Response(null, { status: 500 }));
        const response = await api('/api/images', { method: 'POST', cookie, json: { prompt: 'a cup of coffee', width: 512, height: 640 } });
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/jpeg');
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
        await vi.waitFor(async () => expect((await usage(cookie)).images).toBe(1));
    });

    it('validates the size', async () => {
        const { cookie } = await signIn();
        const response = await api('/api/images', { method: 'POST', cookie, json: { prompt: 'x', width: 10, height: 10 } });
        expect(response.status).toBe(400);
    });
});
