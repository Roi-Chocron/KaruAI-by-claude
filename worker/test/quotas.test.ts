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
        await vi.waitFor(async () => expect((await usage(cookie)).messages).toBe(0));
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

    it('never lets parallel requests go past the limit', async () => {
        const { cookie, user } = await signIn();
        const carousels = await Promise.all([0, 1, 2, 3].map(() => createCarousel(cookie)));
        const limit = PLANS.free.limits.aiMessagesPerMonth!;
        await env.DB.prepare('UPDATE usage_daily SET chat_requests = ? WHERE user_id = ?').bind(limit - 1, user.id).run();
        mockUpstream(() => geminiReply({ title: 'T', slides: [] }));
        const statuses = await Promise.all(carousels.map(carouselId => api('/api/chat', { method: 'POST', cookie, json: { message: 'hi', carouselId } }).then(r => r.status)));
        expect(statuses.filter(status => status === 200).length).toBe(1);
        expect(statuses.filter(status => status === 402).length).toBe(3);
        expect((await usage(cookie)).messages).toBe(limit);
    });

    it('records the tokens and the estimated cost of each message', async () => {
        const { cookie, user } = await signIn();
        const carouselId = await createCarousel(cookie);
        mockUpstream(() => geminiReply({ title: 'T', slides: [] }, 250));
        await api('/api/chat', { method: 'POST', cookie, json: { message: 'hello', carouselId } });
        // 240 input tokens at $0.50 and 10 output tokens at $3 per million, in millionths of a dollar
        await vi.waitFor(async () => expect(await env.DB.prepare('SELECT input_tokens, output_tokens, cost_micro_usd FROM usage_daily WHERE user_id = ?')
            .bind(user.id).first()).toEqual({ input_tokens: 240, output_tokens: 10, cost_micro_usd: 150 }));
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

    // Records the Pollinations requests and answers each with the next reply
    function pollinations(...replies: (() => Response)[]) {
        const urls: URL[] = [];
        const realFetch = globalThis.fetch;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
            const url = input instanceof Request ? input.url : String(input);
            if (!url.startsWith('https://gen.pollinations.ai/')) return realFetch(input, init);
            urls.push(new URL(url));
            return (replies[urls.length - 1] ?? replies[replies.length - 1])();
        });
        return urls;
    }
    const jpeg = () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/jpeg' } });
    const generate = (cookie: string, prompt = 'a cup of coffee') => api('/api/images', { method: 'POST', cookie, json: { prompt, width: 512, height: 640 } });

    it('asks for every safety filter on the pinned model', async () => {
        const { cookie } = await signIn();
        const urls = pollinations(jpeg);
        expect((await generate(cookie)).status).toBe(200);
        expect(urls[0].searchParams.get('safe')).toBe('privacy,secrets,sexual,violence');
        expect(urls[0].searchParams.get('model')).toBe('zimage');
    });

    it('refuses a blocked prompt without counting it or passing on what Pollinations said', async () => {
        const { cookie } = await signIn();
        pollinations(() => Response.json({ status: 400, success: false, error: { code: 'content_blocked', message: 'secret upstream detail' } }, { status: 400 }));
        const response = await generate(cookie, 'something not allowed');
        expect(response.status).toBe(422);
        const body = await response.json<any>();
        expect(body).toMatchObject({ code: 'image_blocked', retryable: false });
        expect(JSON.stringify(body)).not.toContain('secret upstream detail');
        expect((await usage(cookie)).images).toBe(0);
    });

    it('says images are unavailable when Pollinations refuses our key or balance', async () => {
        const { cookie } = await signIn();
        for (const status of [401, 402, 403]) {
            vi.restoreAllMocks();
            pollinations(() => new Response('insufficient pollen balance', { status }));
            const response = await generate(cookie);
            expect(response.status).toBe(503);
            expect(await response.json()).toMatchObject({ code: 'image_unavailable', retryable: false });
        }
    });

    it('tries the fallback model once when the pinned one is busy or failing', async () => {
        const { cookie } = await signIn();
        const urls = pollinations(() => new Response('busy', { status: 429 }), jpeg);
        expect((await generate(cookie)).status).toBe(200);
        expect(urls.map(url => url.searchParams.get('model'))).toEqual(['zimage', 'flux']);

        vi.restoreAllMocks();
        const failing = pollinations(() => new Response('down', { status: 500 }));
        const response = await generate(cookie);
        expect(response.status).toBe(502);
        expect(await response.json()).toMatchObject({ code: 'image_failed' });
        expect(failing.length).toBe(2);
    });

    it('lets Gemini refuse a generated image when the check is on', async () => {
        const { cookie } = await signIn();
        await env.DB.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('image_moderation', 'on', '2026-01-01')").run();
        try {
            let verdict = { allowed: false, reason: 'graphic violence' };
            const realFetch = globalThis.fetch;
            vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
                const url = input instanceof Request ? input.url : String(input);
                if (url.startsWith('https://gen.pollinations.ai/')) return jpeg();
                if (url.includes('generativelanguage.googleapis.com')) {
                    expect(url).toContain('gemini-3.5-flash-lite');
                    return geminiReply(verdict);
                }
                return realFetch(input, init);
            });
            const refused = await generate(cookie);
            expect(refused.status).toBe(422);
            expect(await refused.json()).toMatchObject({ code: 'image_blocked' });
            expect((await usage(cookie)).images).toBe(0);

            verdict = { allowed: true, reason: '' };
            const allowed = await generate(cookie);
            expect(allowed.status).toBe(200);
            expect(new Uint8Array(await allowed.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
        } finally {
            await env.DB.prepare("DELETE FROM settings WHERE key = 'image_moderation'").run();
        }
    });
});

describe('request size caps', () => {
    it('refuses oversized AI requests before calling Gemini or Pollinations', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        const upstream = vi.spyOn(globalThis, 'fetch');
        const chat = (json: unknown) => api('/api/chat', { method: 'POST', cookie, json });

        const longMessage = await chat({ carouselId: id, message: 'x'.repeat(8_001) });
        expect(longMessage.status).toBe(413);
        expect(await longMessage.json()).toMatchObject({ code: 'message_too_long', max: 8000 });
        const bigCarousel = await chat({ carouselId: id, message: 'hi', carousel: { title: 'x', slides: [], notes: 'x'.repeat(200_001) } });
        expect(await bigCarousel.json()).toMatchObject({ code: 'carousel_too_large' });
        const hugeBody = await chat({ carouselId: id, message: 'hi', carousel: { notes: 'x'.repeat(700 * 1024) } });
        expect(hugeBody.status).toBe(413);
        expect(await hugeBody.json()).toMatchObject({ code: 'request_too_large' });

        const longPrompt = await api('/api/images', { method: 'POST', cookie, json: { prompt: 'x'.repeat(1_001), width: 512, height: 512 } });
        expect(longPrompt.status).toBe(413);
        expect(await longPrompt.json()).toMatchObject({ code: 'prompt_too_long' });

        const calls = upstream.mock.calls.map(([input]) => (input instanceof Request ? input.url : String(input)));
        expect(calls.some(url => url.includes('generativelanguage') || url.includes('pollinations'))).toBe(false);
    });

    it('caps what Gemini may write', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        const bodies: any[] = [];
        const realFetch = globalThis.fetch;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
            const url = input instanceof Request ? input.url : String(input);
            if (!url.includes('generativelanguage.googleapis.com')) return realFetch(input, init);
            bodies.push(JSON.parse(String(init?.body)));
            return geminiReply({ title: 'T', slides: [] });
        });
        expect((await api('/api/chat', { method: 'POST', cookie, json: { carouselId: id, message: 'a carousel about tea' } })).status).toBe(200);
        expect(bodies[0].generationConfig).toMatchObject({ maxOutputTokens: 32768 });
        expect(bodies[0].generationConfig.responseSchema.properties.slides.maxItems).toBe(20);
    });
});

describe('regions', () => {
    it('keeps the AI features off where the Gemini free tier may not serve', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        const upstream = vi.spyOn(globalThis, 'fetch');
        for (const [path, json] of [['/api/chat', { carouselId: id, message: 'hi' }], ['/api/images', { prompt: 'tea', width: 512, height: 512 }]] as const) {
            const response = await api(path, { method: 'POST', cookie, json, headers: { 'cf-ipcountry': 'DE' } });
            expect(response.status).toBe(451);
            expect(await response.json()).toMatchObject({ code: 'region_unavailable' });
        }
        expect(upstream.mock.calls.length).toBe(0);
    });
});
