import { NextResponse } from 'next/server';
import { createCarousel, listCarousels } from '@/lib/carousel-store';
import { getCurrentUser, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The gallery: the signed-in user's carousels, most recently edited first
export async function GET() {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return NextResponse.json({ carousels: listCarousels(user) });
}

export async function POST() {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    try {
        return NextResponse.json(await createCarousel(user), { status: 201 });
    } catch (error) {
        console.error('[api/carousels] create failed:', error);
        return NextResponse.json({ error: 'Could not create a carousel.' }, { status: 500 });
    }
}
