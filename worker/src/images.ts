import type { PollinationsImageOptions } from '../../types';

const POLLINATIONS_IMAGE_ENDPOINT = 'https://gen.pollinations.ai/image';

export class ImageServiceError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
    }
}

/**
 * Asks Pollinations.ai for an image and returns its response as is, so the Worker can stream the bytes on to the
 * browser without copying or re-encoding them. The request's timing goes to the Worker logs.
 */
export async function generatePollinationsImage(prompt: string, options: PollinationsImageOptions = {}): Promise<Response> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) throw new Error('Pollinations image prompt must be a non-empty string.');

    const endpoint = new URL(`${POLLINATIONS_IMAGE_ENDPOINT}/${encodeURIComponent(trimmedPrompt)}`);
    for (const name of ['width', 'height', 'seed'] as const) {
        const value = options[name];
        if (value === undefined) continue;
        if (!Number.isInteger(value) || (name !== 'seed' && value <= 0)) {
            throw new Error(`Pollinations image option "${name}" must be a valid integer.`);
        }
        endpoint.searchParams.set(name, String(value));
    }
    if (options.safe !== undefined) endpoint.searchParams.set('safe', String(options.safe));

    const started = Date.now();
    const response = await fetch(endpoint, {
        headers: options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : undefined,
        signal: AbortSignal.timeout(options.timeoutMs ?? 120_000),
    });
    const contentType = response.headers.get('content-type') ?? '';
    console.log(JSON.stringify({ event: 'pollinations', status: response.status, contentType, durationMs: Date.now() - started }));

    if (!response.ok) {
        const upstream = (await response.text()).trim().slice(0, 500);
        throw new ImageServiceError(
            upstream
                ? `Pollinations.ai image request failed (${response.status}): ${upstream}`
                : `Pollinations.ai image request failed with status ${response.status}.`,
            response.status
        );
    }
    if (!contentType.toLowerCase().startsWith('image/')) {
        await response.body?.cancel();
        throw new ImageServiceError(`Pollinations.ai returned an unexpected content type: ${contentType || 'unknown'}.`, 502);
    }
    return response;
}
