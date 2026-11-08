import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/db';
import { publicUser, startSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const body: any = await request.json().catch(() => null);
    if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
        return NextResponse.json({ error: 'Please enter your email and password.' }, { status: 400 });
    }
    const user = authenticate(body.email, body.password);
    if (!user) {
        // Same answer for an unknown email and a wrong password, so accounts cannot be probed
        return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 });
    }
    await startSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
}
