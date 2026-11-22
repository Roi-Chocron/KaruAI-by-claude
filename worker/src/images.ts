import type { PollinationsImageOptions } from '../../types';

const POLLINATIONS_IMAGE_ENDPOINT = 'https://gen.pollinations.ai/image';

// Pollinations' safety filters: privacy and secrets (what safe=true means), plus blocking sexual and violent prompts
export const IMAGE_SAFETY = 'privacy,secrets,sexual,violence';
// The model unless the admin picks another (setting pollinations_model), and the one tried once when it fails
export const DEFAULT_IMAGE_MODEL = 'zimage';
export const FALLBACK_IMAGE_MODEL = 'flux';

// `code` is what the API answers with: image_blocked (the prompt was refused), image_unavailable (the account or key
// can't generate: no balance, bad key) or image_failed (anything else)
export class ImageServiceError extends Error {
    constructor(message: string, readonly status: number, readonly code: 'image_blocked' | 'image_unavailable' | 'image_failed' = 'image_failed') {
        super(message);
    }
}

/**
 * Asks Pollinations.ai for an image and returns its response as is, so the Worker can pass the bytes on without
 * copying or re-encoding them. The request's timing goes to the Worker logs; Pollinations' own error text only goes
 * to the logs, never to the user.
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
    if (options.model) endpoint.searchParams.set('model', options.model);
    if (options.safe !== undefined) endpoint.searchParams.set('safe', String(options.safe));

    const started = Date.now();
    const response = await fetch(endpoint, {
        headers: options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : undefined,
        signal: AbortSignal.timeout(options.timeoutMs ?? 120_000),
    });
    const contentType = response.headers.get('content-type') ?? '';
    console.log(JSON.stringify({ event: 'pollinations', model: options.model ?? null, status: response.status, contentType, durationMs: Date.now() - started }));

    if (!response.ok) {
        const upstream = (await response.text()).trim().slice(0, 500);
        console.error(`[images] Pollinations.ai ${response.status}: ${upstream}`);
        if (response.status === 400 && /content_blocked|content_policy_violation/.test(upstream)) {
            throw new ImageServiceError('This image description was blocked by the safety filter. Try describing it differently.', 422, 'image_blocked');
        }
        if (response.status === 401 || response.status === 402 || response.status === 403) {
            throw new ImageServiceError('Image generation is unavailable right now.', 503, 'image_unavailable');
        }
        throw new ImageServiceError(`Pollinations.ai image request failed with status ${response.status}.`, response.status);
    }
    if (!contentType.toLowerCase().startsWith('image/')) {
        await response.body?.cancel();
        throw new ImageServiceError(`Pollinations.ai returned an unexpected content type: ${contentType || 'unknown'}.`, 502);
    }
    return response;
}
