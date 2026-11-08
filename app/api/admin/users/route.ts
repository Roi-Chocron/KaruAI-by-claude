import { NextResponse } from 'next/server';
import { countCarousels, listUsersWithStats } from '@/lib/db';
import { forbidden, getCurrentUser, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    return NextResponse.json({ users: listUsersWithStats(), totalCarousels: countCarousels() });
}
