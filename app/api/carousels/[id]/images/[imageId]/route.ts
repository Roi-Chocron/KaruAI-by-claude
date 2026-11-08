import { getOwnedCarousel, readImage } from '@/lib/carousel-store';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
    const user = await getCurrentUser();
    if (!user) return new Response(null, { status: 401 });
    const { id, imageId } = await params;
    let image: { contentType: string; data: Buffer } | null = null;
    try {
        image = await readImage(getOwnedCarousel(id, user).id, imageId);
    } catch {
        // not this user's carousel
    }
    if (!image) return new Response(null, { status: 404 });
    // An image id always points at the same pixels, so it can be cached for good
    return new Response(new Uint8Array(image.data), {
        headers: { 'Content-Type': image.contentType, 'Cache-Control': 'private, max-age=31536000, immutable' },
    });
}
