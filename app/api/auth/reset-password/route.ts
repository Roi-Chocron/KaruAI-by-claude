import { NextResponse } from 'next/server';
import { resetUserPassword, MIN_PASSWORD_LENGTH, isValidEmail, normalizeEmail } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const body: any = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json({
            error: `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        }, { status: 400 });
    }

    try {
        const success = resetUserPassword(email, newPassword);
        if (!success) {
            return NextResponse.json({ error: 'No user account found with this email address.' }, { status: 404 });
        }
        return NextResponse.json({ ok: true, message: 'Password has been successfully updated! You can now log in.' });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Error resetting password.' }, { status: 400 });
    }
}
