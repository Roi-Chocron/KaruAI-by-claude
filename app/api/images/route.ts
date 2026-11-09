import { NextResponse } from 'next/server';
import { generatePollinationsImage } from '@/lib/image-generator';
import { getCurrentUser, unauthorized } from '@/lib/auth';
import { getSetting } from '@/lib/db';
import { checkRateLimits, tooManyRequests } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    // Every request is a paid Pollinations call
    const retryAfter = checkRateLimits([['imagesUserMinute', user.id], ['imagesUserDay', user.id]]);
    if (retryAfter) return tooManyRequests(retryAfter);

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Request body must be valid JSON.', 400);
    }

    const requestBody = body as { prompt?: unknown; width?: unknown; height?: unknown } | null;
    const prompt = requestBody?.prompt;
    if (typeof prompt !== 'string' || prompt.trim() === '') {
        return errorResponse('`prompt` must be a non-empty string.', 400);
    }

    const width = requestBody?.width;
    const height = requestBody?.height;
    if (
        typeof width !== 'number' || !Number.isInteger(width) || width < 64 || width > 2048 ||
        typeof height !== 'number' || !Number.isInteger(height) || height < 64 || height > 2048
    ) {
        return errorResponse('`width` and `height` must be integers between 64 and 2048.', 400);
    }

    try {
        const result = await generatePollinationsImage(prompt.trim(), {
            width,
            height,
            safe: true,
            apiKey: getSetting('pollinations_api_key'),
        });

        return NextResponse.json({
            imageUrl: `data:${result.contentType};base64,${result.image.toString('base64')}`,
            metrics: result.metrics,
        });
    } catch (error) {
        console.error('[api/images] generatePollinationsImage failed:', error);
        const message = error instanceof Error ? error.message : 'Unexpected image generation error.';
        // Rate limits and overload are temporary: the editor retries these with backoff
        const transient = message.match(/(?:\(|status )(429|503)\b/);
        if (transient) {
            return NextResponse.json({ error: message, retryable: true }, { status: Number(transient[1]) });
        }
        const status = message.includes('402') ? 402 : 502;
        return errorResponse(message, status);
    }
}
