import { NextRequest, NextResponse } from 'next/server';

// Keeps signed-out visitors on the login and register pages. This only checks that a session cookie
// exists; every page and API route still verifies the session itself (see lib/auth.ts).
const SESSION_COOKIE = 'karu_session';
const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password', '/terms', '/privacy', '/refund', '/cookies'];

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/auth/') || request.cookies.has(SESSION_COOKIE)) {
        return NextResponse.next();
    }
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    }
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
