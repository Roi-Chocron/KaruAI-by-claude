import { NextResponse } from 'next/server';
import { createCarousel, listCarousels } from '../../../carousel_store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The gallery: every saved carousel, most recently edited first
export async function GET() {
    try {
        return NextResponse.json({ carousels: await listCarousels() });
    } catch (error) {
        console.error('[api/carousels] list failed:', error);
        return NextResponse.json({ error: 'Could not load the carousels.' }, { status: 500 });
    }
}

export async function POST() {
    try {
        return NextResponse.json(await createCarousel(), { status: 201 });
    } catch (error) {
        console.error('[api/carousels] create failed:', error);
        return NextResponse.json({ error: 'Could not create a carousel.' }, { status: 500 });
    }
}
