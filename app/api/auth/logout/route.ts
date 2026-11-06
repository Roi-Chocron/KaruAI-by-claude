import { NextResponse } from 'next/server';
import { endSession } from '../../../../karu_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
    await endSession();
    return new NextResponse(null, { status: 204 });
}
