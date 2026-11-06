import { readThumbnail } from '../../../../../carousel_store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const thumbnail = await readThumbnail(id);
    if (!thumbnail) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(thumbnail), {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-cache' },
    });
}
