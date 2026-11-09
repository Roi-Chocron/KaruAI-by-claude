import { NextResponse } from 'next/server';
import { resetPasswordWithToken, MIN_PASSWORD_LENGTH } from '@/lib/db';
import { checkRateLimits, clientIp, tooManyRequests } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Sets a new password with a token from a reset email (see forgot-password); signs the account out everywhere
export async function POST(request: Request) {
    const retryAfter = checkRateLimits([['resetIp', clientIp(request)]]);
    if (retryAfter) return tooManyRequests(retryAfter);

    const body: any = await request.json().catch(() => null);
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (!token) {
        return NextResponse.json({ error: 'This reset link is missing its token. Please request a new one.' }, { status: 400 });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json({
            error: `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        }, { status: 400 });
    }

    if (!resetPasswordWithToken(token, newPassword)) {
        return NextResponse.json({
            error: 'This reset link is invalid, already used or expired. Please request a new one.'
        }, { status: 400 });
    }
    return NextResponse.json({ ok: true, message: 'Your password has been updated. You can now sign in.' });
}
