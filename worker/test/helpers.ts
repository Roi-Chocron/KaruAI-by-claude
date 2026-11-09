import { exports } from 'cloudflare:workers';

export const APP = 'http://localhost:3000';

// Calls the Worker the way the site does: same origin, with the session cookie when given
export async function api(path: string, init: RequestInit & { cookie?: string; json?: unknown } = {}) {
    const { cookie, json, ...rest } = init;
    const headers = new Headers(rest.headers);
    headers.set('Origin', APP);
    if (cookie) headers.set('Cookie', cookie);
    if (json !== undefined) headers.set('Content-Type', 'application/json');
    return exports.default.fetch(new Request(`${APP}${path}`, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body }));
}

// Signs in through the dev login and returns the session cookie
export async function signIn(email = `user-${crypto.randomUUID().slice(0, 8)}@example.test`) {
    const response = await api('/api/auth/dev-login', { method: 'POST', json: { email } });
    if (!response.ok) throw new Error(`dev login failed: ${response.status} ${await response.text()}`);
    const token = response.headers.getSetCookie().find(value => value.startsWith('karu_session='))!.split(';')[0];
    const { user } = await response.json<any>();
    return { cookie: token, user };
}

export async function createCarousel(cookie: string): Promise<string> {
    const response = await api('/api/carousels', { method: 'POST', cookie });
    if (response.status !== 201) throw new Error(`create failed: ${response.status}`);
    return (await response.json<any>()).id;
}

// A Gemini generateContent response carrying `carousel` as its JSON text
export const geminiReply = (carousel: unknown, tokens = 100) => Response.json({
    candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(carousel) }] }, finishReason: 'STOP', index: 0 }],
    usageMetadata: { promptTokenCount: tokens - 10, candidatesTokenCount: 10, totalTokenCount: tokens },
});
