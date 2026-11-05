import { NextResponse } from 'next/server';
import { generatePollinationsImage } from '../../../pollinations_image_utility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Request body must be valid JSON.', 400);
    }

    const prompt = (body as { prompt?: unknown } | null)?.prompt;
    if (typeof prompt !== 'string' || prompt.trim() === '') {
        return errorResponse('`prompt` must be a non-empty string.', 400);
    }

    try {
        const result = await generatePollinationsImage(prompt.trim(), {
            width: 768,
            height: 768,
            safe: true,
        });

        return NextResponse.json({
            imageUrl: `data:${result.contentType};base64,${result.image.toString('base64')}`,
            metrics: result.metrics,
        });
    } catch (error) {
        console.error('[api/images] generatePollinationsImage failed:', error);
        const message = error instanceof Error ? error.message : 'Unexpected image generation error.';
        const status = message.includes('402') ? 402 : 502;
        return errorResponse(message, status);
    }
}
