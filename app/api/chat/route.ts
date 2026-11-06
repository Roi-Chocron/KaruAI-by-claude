import { NextResponse } from 'next/server';
import { generateKaruResponse, KaruResponse, KARU_SYSTEM_PROMPT } from '../../../karu_response_utility';
import { CarouselNotFoundError, chatHistoryFile, getOwnedCarousel } from '../../../carousel_store';
import { getCurrentUser, unauthorized } from '../../../karu_auth';
import { DEFAULT_GEMINI_MODEL, getSetting } from '../../../karu_db';

// The utility reads/writes the history file with `fs`, so this must run on the Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CAROUSEL_CHARS = 400_000;

// generateKaruResponse does read -> call Gemini -> write on the history file, so two
// overlapping requests would clobber each other's turns. Serialize them in-process.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
}

function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
    return NextResponse.json({ error: message, ...extra }, { status });
}

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

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    // 1. Validate the request body
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Request body must be valid JSON.', 400);
    }

    const message = (body as { message?: unknown } | null)?.message;
    if (typeof message !== 'string' || message.trim() === '') {
        return errorResponse('`message` must be a non-empty string.', 400);
    }

    // Every carousel has its own Gemini conversation, and only its owner may talk to it
    let carouselId: string;
    try {
        carouselId = getOwnedCarousel((body as { carouselId?: unknown } | null)?.carouselId, user).id;
    } catch (error) {
        if (error instanceof CarouselNotFoundError) return errorResponse(error.message, 404);
        throw error;
    }

    // The editor's current carousel, including the user's hand edits, so the model edits that instead of
    // its own previous answer. Optional: there is none before the first carousel exists.
    const carousel = (body as { carousel?: unknown } | null)?.carousel;
    let turnContext: string | undefined;
    if (carousel !== undefined && carousel !== null) {
        if (typeof carousel !== 'object') {
            return errorResponse('`carousel` must be an object.', 400);
        }
        const carouselJson = JSON.stringify(carousel);
        if (carouselJson.length > MAX_CAROUSEL_CHARS) {
            return errorResponse('The current carousel is too large to send.', 413);
        }
        turnContext = `Current carousel (source of truth, includes the user's manual edits):\n${carouselJson}`;
    }

    // 2. Call the utility and map failures to HTTP status codes
    try {
        const result: KaruResponse = await enqueue(() =>
            generateKaruResponse(
                message.trim(),
                getSetting('gemini_model') || DEFAULT_GEMINI_MODEL,
                chatHistoryFile(carouselId),
                KARU_SYSTEM_PROMPT,
                turnContext,
                getSetting('gemini_api_key')
            )
        );
        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('[api/chat] generateKaruResponse failed:', error);

        if (error?.message?.includes('GEMINI_API_KEY')) {
            return errorResponse('No Gemini API key is set. An admin can add one on the Admin page.', 500);
        }

        // Errors from the Gemini SDK carry the upstream HTTP status
        const upstreamStatus: number | undefined = error?.status;
        // Rate limits (RPM/TPM) and overload are temporary: the editor retries these with backoff.
        // Nothing was written to the history, so a retry is safe.
        if (upstreamStatus === 429) {
            const { retryAfterSeconds, dailyLimit } = describeRateLimit(error);
            if (dailyLimit !== null) {
                const limit = dailyLimit ? ` (${dailyLimit} requests per day)` : '';
                return errorResponse(
                    `The daily Gemini quota for this API key is used up${limit}. It resets ${formatWait(retryAfterSeconds)}, ` +
                    'or you can switch the key to a paid plan in Google AI Studio.',
                    429,
                    { retryable: false, retryAfterSeconds }
                );
            }
            return errorResponse('Gemini rate limit reached.', 429, { retryable: true, retryAfterSeconds });
        }
        if (upstreamStatus === 503) {
            return errorResponse('Gemini is overloaded right now.', 503, { retryable: true });
        }
        if (typeof upstreamStatus === 'number') {
            return errorResponse(`Gemini API error: ${error.message}`, 502);
        }

        return errorResponse(error?.message || 'Unexpected server error.', 500);
    }
}
