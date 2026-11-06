import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSession, deleteSession, getUserBySession, User } from './karu_db';

// Must match the name middleware.ts looks for
export const SESSION_COOKIE = 'karu_session';

// The signed-in user of the current request (route handler or server component), or null
export async function getCurrentUser(): Promise<User | null> {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    return token ? getUserBySession(token) : null;
}

export async function startSession(userId: string) {
    const { token, expiresAt } = createSession(userId);
    (await cookies()).set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: expiresAt,
    });
}

export async function endSession() {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) deleteSession(token);
    store.delete(SESSION_COOKIE);
}

export const unauthorized = () => NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: 'Only admins can do that.' }, { status: 403 });

// The public part of a user that pages and APIs may hand to the browser
export const publicUser = (user: User) => ({ id: user.id, email: user.email, name: user.name, role: user.role });
