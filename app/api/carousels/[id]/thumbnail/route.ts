import { getOwnedCarousel, readThumbnail } from '@/lib/carousel-store';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) return new Response(null, { status: 401 });
    const { id } = await params;
    let thumbnail: Buffer | null = null;
    try {
        thumbnail = await readThumbnail(getOwnedCarousel(id, user).id);
    } catch {
        // not this user's carousel
    }
    if (!thumbnail) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(thumbnail), {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-cache' },
    });
}
