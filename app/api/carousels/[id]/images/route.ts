import { NextResponse } from 'next/server';
import {
    CarouselNotFoundError, decodeImageDataUrl, getOwnedCarousel, isImageId, saveImage,
} from '../../../../../carousel_store';
import { getCurrentUser, unauthorized } from '../../../../../karu_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stores a generated or uploaded image under the id the editor gave it
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (!isImageId(body?.imageId)) {
        return NextResponse.json({ error: '`imageId` is invalid.' }, { status: 400 });
    }
    const image = decodeImageDataUrl(body.dataUrl);
    if (!image) {
        return NextResponse.json({ error: '`dataUrl` must be a PNG, JPEG, WebP or GIF data URL.' }, { status: 400 });
    }
    try {
        await saveImage(getOwnedCarousel(id, user).id, body.imageId, image);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error instanceof CarouselNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
        console.error('[api/carousels/:id/images] save failed:', error);
        return NextResponse.json({ error: 'Could not save the image.' }, { status: 500 });
    }
}
