import { after, NextResponse } from 'next/server';
import { createPasswordReset, isValidEmail, normalizeEmail, PASSWORD_RESET_MINUTES } from '@/lib/db';
import { appUrl, sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimits, clientIp, tooManyRequests } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SENT_MESSAGE = `If an account exists for that email, we sent a link to reset its password. It expires in ${PASSWORD_RESET_MINUTES} minutes.`;

export async function POST(request: Request) {
    const body: any = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const retryAfter = checkRateLimits([['forgotIp', clientIp(request)], ['forgotEmail', email]]);
    if (retryAfter) return tooManyRequests(retryAfter);

    // The answer is the same whether or not the account exists, and the email goes out after the
    // response, so neither the body nor the response time tells a visitor which emails are registered.
    const reset = createPasswordReset(email);
    if (reset) {
        after(async () => {
            try {
                // In the fragment, not the query string: it never reaches server logs, Referer headers or analytics
                const link = `${appUrl(request)}/reset-password#token=${reset.token}`;
                await sendPasswordResetEmail(reset.user.email, reset.user.name, link, PASSWORD_RESET_MINUTES);
            } catch (error) {
                console.error('[api/auth/forgot-password] sending the email failed:', error);
            }
        });
    }
    return NextResponse.json({ ok: true, message: SENT_MESSAGE });
}
