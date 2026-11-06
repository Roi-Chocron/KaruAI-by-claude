import { NextResponse } from 'next/server';
import {
    CarouselNotFoundError, getOwnedCarousel, HistoryEntry, HistoryOutOfSyncError, readHistory, saveHistory,
} from '../../../../../carousel_store';
import { getCurrentUser, unauthorized } from '../../../../../karu_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: 'Carousel not found.' }, { status: 404 });

// The carousel's undo history, so undo/redo keep working after it is closed and opened again
export async function GET(_request: Request, { params }: Context) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    try {
        return NextResponse.json((await readHistory(getOwnedCarousel(id, user).id)) ?? { entries: [], index: -1 });
    } catch (error) {
        if (error instanceof CarouselNotFoundError) return notFound();
        throw error;
    }
}

const isEntry = (entry: any): entry is HistoryEntry =>
    Number.isInteger(entry?.seq) && typeof entry?.snapshot === 'string' && Number.isInteger(entry?.slide);

// { seqs: the history in order, index: the current position, entries: those the server does not have yet }
export async function PUT(request: Request, { params }: Context) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const body: any = await request.json().catch(() => null);
    if (!Array.isArray(body?.seqs) || !body.seqs.length || !body.seqs.every(Number.isInteger) ||
        !Number.isInteger(body.index) || !Array.isArray(body.entries) || !body.entries.every(isEntry)) {
        return NextResponse.json({ error: 'Invalid history.' }, { status: 400 });
    }
    try {
        await saveHistory(getOwnedCarousel(id, user).id, { seqs: body.seqs, index: body.index, entries: body.entries });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error instanceof CarouselNotFoundError) return notFound();
        // The editor then sends the full history again
        if (error instanceof HistoryOutOfSyncError) return NextResponse.json({ error: error.message }, { status: 409 });
        console.error('[api/carousels/:id/history] save failed:', error);
        return NextResponse.json({ error: 'Could not save the history.' }, { status: 500 });
    }
}
