import { addTokens, DEFAULT_GEMINI_MODEL, getCarouselRow, getSetting, lockCarouselChat, unlockCarouselChat } from '../db';
import { chatHistoryKey, isCarouselId } from '../storage';
import { generateKaruResponse } from '../gemini';
import { generatePollinationsImage, ImageServiceError } from '../images';
import { countUsage, createApp, errorJson, rateLimit, requireUser, useQuota } from '../app';

const MAX_CAROUSEL_CHARS = 400_000;
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

// Each route checks the session itself: this app is mounted at /api, so a use('*') here would cover every route
ai.post('/chat', requireUser, async c => {
    const user = c.get('user');
    const limited = await rateLimit(c, 'chatUser', user.id);
    if (limited) return limited;

    const body: any = await c.req.json().catch(() => undefined);
    if (body === undefined) return errorJson(c, 'Request body must be valid JSON.', 400);
    const message = body?.message;
    if (typeof message !== 'string' || message.trim() === '') return errorJson(c, '`message` must be a non-empty string.', 400);

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
        if (carouselJson.length > MAX_CAROUSEL_CHARS) return errorJson(c, 'The current carousel is too large to send.', 413);
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

// Generates an image and streams it back as is; the editor keeps it and stores it once the user approves it
ai.post('/images', requireUser, async c => {
    const limited = await rateLimit(c, 'imagesUser', c.get('user').id);
    if (limited) return limited;

    const body: any = await c.req.json().catch(() => undefined);
    if (body === undefined) return errorJson(c, 'Request body must be valid JSON.', 400);
    const prompt = body?.prompt;
    if (typeof prompt !== 'string' || prompt.trim() === '') return errorJson(c, '`prompt` must be a non-empty string.', 400);
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
        const image = await generatePollinationsImage(prompt.trim(), {
            width,
            height,
            safe: true,
            apiKey: await getSetting(c.env, 'pollinations_api_key'),
        });
        c.executionCtx.waitUntil(countUsage(c, 'images'));
        return new Response(image.body, { headers: { 'Content-Type': image.headers.get('content-type')!, 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('[api/images] generatePollinationsImage failed:', error);
        const message = error instanceof Error ? error.message : 'Unexpected image generation error.';
        const status = error instanceof ImageServiceError ? error.status : 502;
        // Rate limits and overload are temporary: the editor retries these with backoff
        if (status === 429 || status === 503) return errorJson(c, message, status, { retryable: true });
        return c.json({ error: message }, status === 402 ? 402 : 502);
    }
});

export default ai;
