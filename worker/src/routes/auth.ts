import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { publicUser, randomToken, upsertGoogleUser } from '../db';
import { clearSessionCookies, clientIp, createApp, currentUser, endSession, errorJson, isSecure, rateLimit, startSession, type AppContext } from '../app';

// Sign-in with Google (OAuth 2.0 authorization code flow with PKCE). There are no passwords.

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const STATE_COOKIE = 'karu_oauth';
const STATE_PATH = '/api/auth/google';

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64url = (text: string) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));

async function pkceChallenge(verifier: string) {
    return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
}

// Only paths inside the app, so the sign-in link cannot send people to another site
const safeNext = (next: string | undefined) =>
    next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/dashboard';

const redirectUri = (env: Env) => `${env.APP_URL}/api/auth/google/callback`;

function loginError(c: AppContext, code: string) {
    return c.redirect(`${c.env.APP_URL}/login?error=${code}`);
}

const auth = createApp();

// Starts the sign-in: remembers a random state, the PKCE verifier and where to go afterwards, then sends the
// browser to Google
auth.get('/google', async c => {
    if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) return loginError(c, 'config');
    const limited = await rateLimit(c, 'authIp', clientIp(c));
    if (limited) return loginError(c, 'rate');

    const state = randomToken(16);
    const verifier = randomToken(32);
    setCookie(c, STATE_COOKIE, JSON.stringify({ state, verifier, next: safeNext(c.req.query('next')) }), {
        path: STATE_PATH, httpOnly: true, secure: isSecure(c.env), sameSite: 'Lax', maxAge: 600,
    });
    const url = new URL(GOOGLE_AUTH_URL);
    url.search = new URLSearchParams({
        client_id: c.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri(c.env),
        response_type: 'code',
        scope: 'openid email profile',
        state,
        code_challenge: await pkceChallenge(verifier),
        code_challenge_method: 'S256',
        prompt: 'select_account',
    }).toString();
    return c.redirect(url.toString());
});

// Google sends the browser back here with a one-time code, which is exchanged for the user's ID token
auth.get('/google/callback', async c => {
    const saved = (() => {
        try {
            return JSON.parse(getCookie(c, STATE_COOKIE) ?? '') as { state: string; verifier: string; next: string };
        } catch {
            return null;
        }
    })();
    deleteCookie(c, STATE_COOKIE, { path: STATE_PATH, secure: isSecure(c.env) });

    if (c.req.query('error')) return loginError(c, 'cancelled');
    const code = c.req.query('code');
    if (!saved || !code || c.req.query('state') !== saved.state) return loginError(c, 'state');

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: c.env.GOOGLE_CLIENT_ID,
            client_secret: c.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri(c.env),
            grant_type: 'authorization_code',
            code_verifier: saved.verifier,
        }),
    });
    const tokens: any = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || typeof tokens?.id_token !== 'string') {
        console.error('[auth] Google token exchange failed:', tokenResponse.status, tokens?.error);
        return loginError(c, 'failed');
    }

    // The ID token came straight from Google over TLS in exchange for our client secret, so its claims can be
    // trusted without checking the signature (OpenID Connect Core 3.1.3.7); the basic claims are still checked.
    let claims: any;
    try {
        claims = JSON.parse(new TextDecoder().decode(fromBase64url(tokens.id_token.split('.')[1])));
    } catch {
        return loginError(c, 'failed');
    }
    const validIssuer = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
    if (!validIssuer || claims.aud !== c.env.GOOGLE_CLIENT_ID || !(claims.exp * 1000 > Date.now()) || typeof claims.sub !== 'string') {
        return loginError(c, 'failed');
    }
    if (typeof claims.email !== 'string' || claims.email_verified !== true) return loginError(c, 'unverified');

    const user = await upsertGoogleUser(c.env.DB, {
        sub: claims.sub,
        email: claims.email,
        name: typeof claims.name === 'string' ? claims.name : claims.email.split('@')[0],
        picture: typeof claims.picture === 'string' ? claims.picture : null,
    }, c.env.ADMIN_EMAIL);
    await startSession(c, user.id);
    return c.redirect(`${c.env.APP_URL}${saved.next}`);
});

// The signed-in user, for the pages (which are static and cannot read the session themselves)
auth.get('/me', async c => {
    const user = await currentUser(c);
    if (!user) {
        clearSessionCookies(c);
        return errorJson(c, 'Please sign in.', 401);
    }
    c.header('Cache-Control', 'no-store');
    return c.json({ user: publicUser(user) });
});

auth.post('/logout', async c => {
    await endSession(c);
    return c.body(null, 204);
});

export default auth;
