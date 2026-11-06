import { readImage } from '../../../../../../carousel_store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
    const { id, imageId } = await params;
    const image = await readImage(id, imageId).catch(() => null);
    if (!image) return new Response(null, { status: 404 });
    // An image id always points at the same pixels, so it can be cached for good
    return new Response(new Uint8Array(image.data), {
        headers: { 'Content-Type': image.contentType, 'Cache-Control': 'private, max-age=31536000, immutable' },
    });
}
