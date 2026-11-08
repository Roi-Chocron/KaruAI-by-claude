import { NextResponse } from 'next/server';
import { createUser, UserInputError } from '@/lib/db';
import { publicUser, startSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const body: any = await request.json().catch(() => null);
    const { name, email, password } = body ?? {};
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ error: 'Please fill in your name, email and password.' }, { status: 400 });
    }
    try {
        const user = createUser({ name, email, password });
        await startSession(user.id);
        return NextResponse.json({ user: publicUser(user) }, { status: 201 });
    } catch (error) {
        if (error instanceof UserInputError) return NextResponse.json({ error: error.message }, { status: 400 });
        console.error('[api/auth/register] failed:', error);
        return NextResponse.json({ error: 'Could not create the account.' }, { status: 500 });
    }
}
