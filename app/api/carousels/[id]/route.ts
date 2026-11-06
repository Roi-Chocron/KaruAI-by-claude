import { NextResponse } from 'next/server';
import {
    CarouselNotFoundError, decodeImageDataUrl, deleteCarousel, readCarousel, saveCarousel,
} from '../../../../carousel_store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

function errorResponse(error: unknown, action: string) {
    if (error instanceof CarouselNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(`[api/carousels/:id] ${action} failed:`, error);
    return NextResponse.json({ error: `Could not ${action} the carousel.` }, { status: 500 });
}

export async function GET(_request: Request, { params }: Context) {
    const { id } = await params;
    try {
        return NextResponse.json(await readCarousel(id));
    } catch (error) {
        return errorResponse(error, 'load');
    }
}

// Autosave from the editor: the whole document, plus an optional JPEG thumbnail of the first slide
export async function PUT(request: Request, { params }: Context) {
    const { id } = await params;
    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (!body || typeof body.document !== 'object' || body.document === null) {
        return NextResponse.json({ error: '`document` must be an object.' }, { status: 400 });
    }
    const thumbnail = body.thumbnail === undefined ? null : decodeImageDataUrl(body.thumbnail);
    if (body.thumbnail !== undefined && thumbnail?.contentType !== 'image/jpeg') {
        return NextResponse.json({ error: '`thumbnail` must be a JPEG data URL.' }, { status: 400 });
    }
    try {
        const meta = await saveCarousel(id, {
            title: typeof body.title === 'string' ? body.title.slice(0, 200) : '',
            slideCount: Number.isInteger(body.slideCount) ? body.slideCount : 0,
            document: body.document,
            thumbnail: thumbnail?.data,
        });
        return NextResponse.json(meta);
    } catch (error) {
        return errorResponse(error, 'save');
    }
}

export async function DELETE(_request: Request, { params }: Context) {
    const { id } = await params;
    try {
        await deleteCarousel(id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return errorResponse(error, 'delete');
    }
}
