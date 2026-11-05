import { NextResponse } from 'next/server';
import * as path from 'path';
import { generateKaruResponse, KaruResponse } from '../../../karu_response_utility';

// The utility reads/writes the history file with `fs`, so this must run on the Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL_NAME = 'gemini-1.5-flash';
const HISTORY_FILE = path.join(process.cwd(), '.karu', 'chat_history.json');

// generateKaruResponse does read -> call Gemini -> write on the history file, so two
// overlapping requests would clobber each other's turns. Serialize them in-process.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
}

function errorResponse(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
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

    // 2. Call the utility and map failures to HTTP status codes
    try {
        const result: KaruResponse = await enqueue(() =>
            generateKaruResponse(message.trim(), MODEL_NAME, HISTORY_FILE)
        );
        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('[api/chat] generateKaruResponse failed:', error);

        if (error?.message?.includes('GEMINI_API_KEY')) {
            return errorResponse('Server is missing its Gemini API key configuration.', 500);
        }

        // Errors from the Gemini SDK carry the upstream HTTP status
        const upstreamStatus: number | undefined = error?.status;
        if (upstreamStatus === 429) {
            return errorResponse('Gemini rate limit reached. Please wait a moment and try again.', 429);
        }
        if (typeof upstreamStatus === 'number') {
            return errorResponse(`Gemini API error: ${error.message}`, 502);
        }

        return errorResponse(error?.message || 'Unexpected server error.', 500);
    }
}
