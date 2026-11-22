import { addTokens, DEFAULT_GEMINI_MODEL, getCarouselRow, getSetting, lockCarouselChat, unlockCarouselChat } from '../db';
import { chatHistoryKey, isCarouselId } from '../storage';
import { generateKaruResponse, moderateImage } from '../gemini';
import { DEFAULT_IMAGE_MODEL, FALLBACK_IMAGE_MODEL, generatePollinationsImage, IMAGE_SAFETY, ImageServiceError } from '../images';
import { monitoring } from '../monitoring';
import { countUsage, createApp, errorJson, rateLimit, requireUser, useQuota, type AppContext } from '../app';

// Caps on what one AI request may carry, so no account can send (or have replayed on later turns) huge prompts. The
// editor's chat box allows 4,000 characters; the rest is headroom.
const MAX_CHAT_BODY_BYTES = 600 * 1024;
const MAX_MESSAGE_CHARS = 8_000;
const MAX_CAROUSEL_CHARS = 200_000;
const MAX_IMAGE_BODY_BYTES = 8 * 1024;
const MAX_IMAGE_PROMPT_CHARS = 1_000;

// The request body as JSON, refused before parsing when it is over `max` bytes
async function readJsonBody(c: AppContext, max: number): Promise<{ body: any } | { response: Response }> {
    if (Number(c.req.header('content-length') ?? 0) > max) {
        return { response: errorJson(c, 'The request is too large.', 413, { code: 'request_too_large', retryable: false }) };
    }
    const raw = await c.req.text();
    if (raw.length > max) return { response: errorJson(c, 'The request is too large.', 413, { code: 'request_too_large', retryable: false }) };
    try {
        return { body: JSON.parse(raw) };
    } catch {
        return { response: errorJson(c, 'Request body must be valid JSON.', 400) };
    }
}
// Longer than any Gemini request takes, so a Worker that dies mid-request only blocks the carousel briefly
const CHAT_LOCK_SECONDS = 180;

// Gemini's 429 errors carry a RetryInfo detail ({ retryDelay: "23s" }) and a QuotaFailure detail naming the
// quota that ran out, e.g. "...PerMinute..." (RPM/TPM, worth retrying) or "...PerDay..." (not until it resets).
function describeRateLimit(error: any) {
    const details: any[] = Array.isArray(error?.errorDetails) ? error.errorDetails : [];
    const delay = details.find(detail => typeof detail?.retryDelay === 'string')?.retryDelay;
    const seconds = typeof delay === 'string' ? parseFloat(delay) : NaN;
    const violations: any[] = details.flatMap(detail => (Array.isArray(detail?.violations) ? detail.violations : []));
    const daily = violations.find(violation => /PerDay/i.test(String(violation?.quotaId ?? '')));
    return {
        retryAfterSeconds: Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : undefined,
        dailyLimit: daily ? String(daily.quotaValue ?? '') : null,
    };
}

function formatWait(seconds: number | undefined) {
    if (seconds === undefined) return 'later today';
    if (seconds < 90 * 60) return `in about ${Math.max(1, Math.round(seconds / 60))} minutes`;
    return `in about ${Math.round(seconds / 3600)} hours`;
}

const ai = createApp();

// The AI features are off in AI_BLOCKED_COUNTRIES (see wrangler.jsonc): the Gemini API's free tier may not serve them
ai.use('*', async (c, next) => {
    const country = (c.req.header('cf-ipcountry') ?? '').toUpperCase();
    const blocked = ((c.env as { AI_BLOCKED_COUNTRIES?: string }).AI_BLOCKED_COUNTRIES ?? '').split(',').map(code => code.trim().toUpperCase());
    if (country && blocked.includes(country) && ['/api/chat', '/api/images'].includes(c.req.path)) {
        return errorJson(c, 'The AI features are not available in your country yet.', 451, { code: 'region_unavailable', retryable: false });
    }
    await next();
});

// Each route checks the session itself: this app is mounted at /api, so a use('*') here would cover every route
ai.post('/chat', requireUser, async c => {
    const user = c.get('user');
    const limited = await rateLimit(c, 'chatUser', user.id);
    if (limited) return limited;

    const read = await readJsonBody(c, MAX_CHAT_BODY_BYTES);
    if ('response' in read) return read.response;
    const body = read.body;
    const message = body?.message;
    if (typeof message !== 'string' || message.trim() === '') return errorJson(c, '`message` must be a non-empty string.', 400);
    if (message.length > MAX_MESSAGE_CHARS) {
        return errorJson(c, `The message is too long (at most ${MAX_MESSAGE_CHARS} characters).`, 413, { code: 'message_too_long', max: MAX_MESSAGE_CHARS, retryable: false });
    }

    // Every carousel has its own Gemini conversation, and only its owner may talk to it
    const carouselRow = isCarouselId(body?.carouselId) ? await getCarouselRow(c.env.DB, body.carouselId) : null;
    if (!carouselRow || carouselRow.ownerId !== user.id) return errorJson(c, 'Carousel not found.', 404);

    // The editor's current carousel, including the user's hand edits, so the model edits that instead of
    // its own previous answer. Optional: there is none before the first carousel exists.
    const carousel = body?.carousel;
    let turnContext: string | undefined;
    if (carousel !== undefined && carousel !== null) {
        if (typeof carousel !== 'object') return errorJson(c, '`carousel` must be an object.', 400);
        const carouselJson = JSON.stringify(carousel);
        if (carouselJson.length > MAX_CAROUSEL_CHARS) {
            return errorJson(c, 'The current carousel is too large to send.', 413, { code: 'carousel_too_large', retryable: false });
        }
        turnContext = `Current carousel (source of truth, includes the user's manual edits):\n${carouselJson}`;
    }

    // One request at a time per carousel: each one reads, extends and writes the carousel's conversation
    if (!(await lockCarouselChat(c.env.DB, carouselRow.id, CHAT_LOCK_SECONDS))) {
        return errorJson(c, 'KaruAI is still answering the previous message.', 429, { retryable: true, retryAfterSeconds: 5 });
    }
    try {
        const quota = await useQuota(c, 'messages', false);
        if (quota) return quota;
        const [modelName, apiKey] = await Promise.all([getSetting(c.env, 'gemini_model'), getSetting(c.env, 'gemini_api_key')]);
        const result = await generateKaruResponse({
            userInput: message.trim(),
            modelName: modelName || DEFAULT_GEMINI_MODEL,
            apiKey,
            bucket: c.env.FILES,
            historyKey: chatHistoryKey(carouselRow.id),
            turnContext,
        });
        c.executionCtx.waitUntil(Promise.all([countUsage(c, 'messages'), addTokens(c.env.DB, user.id, result.currentRequestTokens)]));
        return c.json(result);
    } catch (error: any) {
        console.error('[api/chat] generateKaruResponse failed:', error);
        if (error?.message?.includes('GEMINI_API_KEY')) {
            return errorJson(c, 'No Gemini API key is set. An admin can add one on the Admin page.', 500);
        }
        // Errors from the Gemini SDK carry the upstream HTTP status. Rate limits (RPM/TPM) and overload are
        // temporary: the editor retries these with backoff. Nothing was written to the history, so a retry is safe.
        const upstreamStatus: number | undefined = error?.status;
        if (upstreamStatus === 429) {
            const { retryAfterSeconds, dailyLimit } = describeRateLimit(error);
            if (dailyLimit !== null) {
                const limit = dailyLimit ? ` (${dailyLimit} requests per day)` : '';
                return errorJson(c,
                    `The daily Gemini quota for this API key is used up${limit}. It resets ${formatWait(retryAfterSeconds)}, ` +
                    'or you can switch the key to a paid plan in Google AI Studio.',
                    429, { retryable: false, retryAfterSeconds });
            }
            return errorJson(c, 'Gemini rate limit reached.', 429, { retryable: true, retryAfterSeconds });
        }
        if (upstreamStatus === 503) return errorJson(c, 'Gemini is overloaded right now.', 503, { retryable: true });
        if (typeof upstreamStatus === 'number') return errorJson(c, `Gemini API error: ${error.message}`, 502);
        return errorJson(c, 'Unexpected server error.', 500);
    } finally {
        c.executionCtx.waitUntil(unlockCarouselChat(c.env.DB, carouselRow.id));
    }
});

// Asks Pollinations for the image with every safety filter on, on the admin's chosen model; when that model is busy or
// failing, once more on the fallback model
async function generateImage(c: AppContext, prompt: string, width: number, height: number) {
    const [model, apiKey] = await Promise.all([getSetting(c.env, 'pollinations_model'), getSetting(c.env, 'pollinations_api_key')]);
    const chosen = model || DEFAULT_IMAGE_MODEL;
    const request = (name: string) => generatePollinationsImage(prompt, { width, height, safe: IMAGE_SAFETY, model: name, apiKey });
    try {
        return await request(chosen);
    } catch (error) {
        const busy = error instanceof ImageServiceError && error.code === 'image_failed' && (error.status === 429 || error.status >= 500);
        if (!busy || chosen === FALLBACK_IMAGE_MODEL) throw error;
        console.warn(JSON.stringify({ event: 'image_fallback', from: chosen, to: FALLBACK_IMAGE_MODEL, status: (error as ImageServiceError).status }));
        return request(FALLBACK_IMAGE_MODEL);
    }
}

// Generates an image and sends it back; the editor keeps it and stores it once the user approves it. Unless the
// image_moderation setting is "off", Gemini looks at the image first and a refused one is never shown. Neither a
// blocked prompt nor a refused image counts against the plan.
ai.post('/images', requireUser, async c => {
    const limited = await rateLimit(c, 'imagesUser', c.get('user').id);
    if (limited) return limited;

    const read = await readJsonBody(c, MAX_IMAGE_BODY_BYTES);
    if ('response' in read) return read.response;
    const body = read.body;
    const prompt = body?.prompt;
    if (typeof prompt !== 'string' || prompt.trim() === '') return errorJson(c, '`prompt` must be a non-empty string.', 400);
    if (prompt.length > MAX_IMAGE_PROMPT_CHARS) {
        return errorJson(c, `The image description is too long (at most ${MAX_IMAGE_PROMPT_CHARS} characters).`, 413, {
            code: 'prompt_too_long', max: MAX_IMAGE_PROMPT_CHARS, retryable: false,
        });
    }
    const { width, height } = body;
    if (
        typeof width !== 'number' || !Number.isInteger(width) || width < 64 || width > 2048 ||
        typeof height !== 'number' || !Number.isInteger(height) || height < 64 || height > 2048
    ) {
        return errorJson(c, '`width` and `height` must be integers between 64 and 2048.', 400);
    }

    const quota = await useQuota(c, 'images', false);
    if (quota) return quota;
    try {
        const image = await generateImage(c, prompt.trim(), width, height);
        const contentType = image.headers.get('content-type')!;
        if ((await getSetting(c.env, 'image_moderation')) !== 'off') {
            const bytes = await image.arrayBuffer();
            const apiKey = await getSetting(c.env, 'gemini_api_key');
            const verdict = apiKey
                ? await moderateImage({ apiKey, image: bytes, mimeType: contentType }).catch(error => {
                    // The check failing must not stop images altogether; the prompt already went through Pollinations' filters
                    console.error('[api/images] image check failed:', error);
                    return null;
                })
                : null;
            if (verdict && !verdict.allowed) {
                console.warn(JSON.stringify({ event: 'image_refused', userId: c.get('user').id, reason: verdict.reason }));
                return errorJson(c, 'This image was blocked by the safety check. Try describing it differently.', 422, { code: 'image_blocked', retryable: false });
            }
            c.executionCtx.waitUntil(countUsage(c, 'images'));
            return new Response(bytes, { headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' } });
        }
        c.executionCtx.waitUntil(countUsage(c, 'images'));
        return new Response(image.body, { headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('[api/images] image generation failed:', error);
        if (!(error instanceof ImageServiceError)) return errorJson(c, 'The image could not be created. Try again.', 502, { code: 'image_failed' });
        if (error.code === 'image_blocked') return errorJson(c, error.message, 422, { code: 'image_blocked', retryable: false });
        if (error.code === 'image_unavailable') {
            monitoring.notice('Pollinations refused our key or balance (401/402/403); images are off', {});
            return errorJson(c, error.message, 503, { code: 'image_unavailable', retryable: false });
        }
        // Rate limits and overload are temporary: the editor retries these with backoff
        if (error.status === 429 || error.status === 503) {
            return errorJson(c, 'The image service is busy. Trying again…', error.status as 429 | 503, { code: 'image_busy', retryable: true });
        }
        return errorJson(c, 'The image could not be created. Try again.', 502, { code: 'image_failed' });
    }
});

export default ai;
