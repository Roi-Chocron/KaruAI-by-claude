import * as fs from 'fs/promises';
import * as path from 'path';

const POLLINATIONS_IMAGE_ENDPOINT = 'https://gen.pollinations.ai/image';
const DEFAULT_METRICS_FILE = path.join(process.cwd(), '.karu', 'pollinations_image_history.json');

export interface PollinationsImageOptions {
    width?: number;
    height?: number;
    seed?: number;
    safe?: boolean;
    metricsFilename?: string;
    timeoutMs?: number;
    apiKey?: string; // defaults to the POLLINATIONS_API_KEY environment variable
}

export interface PollinationsImageMetrics {
    prompt: string;
    requestUrl: string;
    startTime: string;
    endTime: string;
    durationMs: number;
    statusCode: number;
    contentType: string | null;
    responseBytes: number;
    success: boolean;
    errorMessage?: string;
}

export interface PollinationsImageResult {
    image: Buffer;
    contentType: string;
    metrics: PollinationsImageMetrics;
}

interface PollinationsImageHistory {
    requests: PollinationsImageMetrics[];
}

/**
 * Generates an image from Pollinations.ai without connecting it to an application route.
 *
 * The returned Buffer contains the image bytes. Request metrics are appended to a JSON
 * history file, including failed requests, so generation time and upstream failures can
 * be inspected later.
 *
 * @param prompt - The description Pollinations.ai should turn into an image.
 * @param options - Optional image dimensions, seed, safety filter, metrics path and timeout.
 * @returns The generated image bytes, content type and request metrics.
 */
export async function generatePollinationsImage(
    prompt: string,
    options: PollinationsImageOptions = {}
): Promise<PollinationsImageResult> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
        throw new Error('Pollinations image prompt must be a non-empty string.');
    }

    const endpoint = new URL(`${POLLINATIONS_IMAGE_ENDPOINT}/${encodeURIComponent(trimmedPrompt)}`);
    addQueryParameter(endpoint, 'width', options.width, isPositiveInteger);
    addQueryParameter(endpoint, 'height', options.height, isPositiveInteger);
    addQueryParameter(endpoint, 'seed', options.seed, Number.isInteger);
    if (options.safe !== undefined) {
        endpoint.searchParams.set('safe', String(options.safe));
    }

    const startTime = new Date();
    let response: Response;
    try {
        const apiKey = options.apiKey || process.env.POLLINATIONS_API_KEY;
        response = await fetch(endpoint, {
            headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
            signal: AbortSignal.timeout(options.timeoutMs ?? 120_000),
        });
    } catch (error) {
        const metrics = createMetrics(trimmedPrompt, endpoint.toString(), startTime, 0, null, 0, error);
        await appendMetrics(metrics, options.metricsFilename);
        console.error(`[Pollinations Utility] API Request failed: ${metrics.errorMessage}`);
        throw error;
    }

    const responseBytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type');
    let metrics = createMetrics(
        trimmedPrompt,
        endpoint.toString(),
        startTime,
        response.status,
        contentType,
        responseBytes.byteLength,
        response.ok ? undefined : new Error(`Pollinations.ai returned HTTP ${response.status}.`)
    );

    if (!response.ok) {
        const upstreamMessage = responseBytes.toString('utf8').trim();
        const message = upstreamMessage
            ? `Pollinations.ai image request failed (${response.status}): ${upstreamMessage}`
            : `Pollinations.ai image request failed with status ${response.status}.`;
        await appendMetrics(metrics, options.metricsFilename);
        console.error(`[Pollinations Utility] ${message}`);
        throw new Error(message);
    }

    if (!contentType?.toLowerCase().startsWith('image/')) {
        const message = `Pollinations.ai returned an unexpected content type: ${contentType || 'unknown'}.`;
        metrics = { ...metrics, success: false, errorMessage: message };
        await appendMetrics(metrics, options.metricsFilename);
        console.error(`[Pollinations Utility] ${message}`);
        throw new Error(message);
    }

    await appendMetrics(metrics, options.metricsFilename);
    return {
        image: responseBytes,
        contentType,
        metrics,
    };
}

function addQueryParameter(
    url: URL,
    name: string,
    value: number | undefined,
    isValid: (value: number) => boolean
): void {
    if (value === undefined) {
        return;
    }
    if (!isValid(value)) {
        throw new Error(`Pollinations image option "${name}" must be a valid integer.`);
    }
    url.searchParams.set(name, String(value));
}

function isPositiveInteger(value: number): boolean {
    return Number.isInteger(value) && value > 0;
}

function createMetrics(
    prompt: string,
    requestUrl: string,
    startTime: Date,
    statusCode: number,
    contentType: string | null,
    responseBytes: number,
    error?: unknown
): PollinationsImageMetrics {
    const endTime = new Date();
    return {
        prompt,
        requestUrl,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime(),
        statusCode,
        contentType,
        responseBytes,
        success: !error,
        ...(error ? { errorMessage: error instanceof Error ? error.message : String(error) } : {}),
    };
}

async function appendMetrics(metrics: PollinationsImageMetrics, metricsFilename = DEFAULT_METRICS_FILE): Promise<void> {
    let history: PollinationsImageHistory = { requests: [] };
    try {
        const fileContent = await fs.readFile(metricsFilename, 'utf8');
        history = JSON.parse(fileContent) as PollinationsImageHistory;
        if (!Array.isArray(history.requests)) {
            throw new Error('History file does not contain a requests array.');
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn(`[Pollinations Utility] Warning: Failed to read ${metricsFilename}. Starting a new history.`, error);
        }
    }

    history.requests.push(metrics);
    try {
        await fs.mkdir(path.dirname(metricsFilename), { recursive: true });
        await fs.writeFile(metricsFilename, JSON.stringify(history, null, 2), 'utf8');
    } catch (error) {
        console.error(`[Pollinations Utility] Failed to save request metrics to ${metricsFilename}:`, error);
        throw error;
    }
}
