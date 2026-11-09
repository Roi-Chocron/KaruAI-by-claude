// Sends transactional email through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
// Without RESEND_API_KEY, development builds print the message to the server console instead.

type Email = { to: string; subject: string; text: string; html: string };

const DEFAULT_FROM = 'KaruAI <onboarding@resend.dev>';

export async function sendEmail(email: Email): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('RESEND_API_KEY is not set, so no email can be sent.');
        }
        console.log(`\n[email] RESEND_API_KEY is not set; this email was not sent.\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
        return;
    }
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.EMAIL_FROM || DEFAULT_FROM, ...email }),
    });
    if (!response.ok) {
        throw new Error(`Resend refused the email (${response.status}): ${await response.text().catch(() => '')}`);
    }
}

// Where links in emails point. Production requires APP_URL: the request's own origin comes from the Host
// header, which a caller can set to their own server and so receive the reset tokens of other people.
export function appUrl(request: Request): string {
    const base = process.env.APP_URL;
    if (!base && process.env.NODE_ENV === 'production') {
        throw new Error('APP_URL is not set, so no links can be put in emails.');
    }
    return (base || new URL(request.url).origin).replace(/\/+$/, '');
}

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export function sendPasswordResetEmail(to: string, name: string, link: string, minutes: number) {
    const greeting = name ? `Hi ${name},` : 'Hi,';
    return sendEmail({
        to,
        subject: 'Reset your KaruAI password',
        text: `${greeting}\n\nSomeone asked to reset the password for your KaruAI account. Open this link to choose a new one:\n\n${link}\n\nThe link works once and expires in ${minutes} minutes. If you did not ask for this, you can ignore this email; your password stays the same.`,
        html: `<p>${escapeHtml(greeting)}</p>
<p>Someone asked to reset the password for your KaruAI account. Click the button to choose a new one:</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a></p>
<p style="color:#64748b;font-size:13px">Or paste this link into your browser:<br>${escapeHtml(link)}</p>
<p style="color:#64748b;font-size:13px">The link works once and expires in ${minutes} minutes. If you did not ask for this, you can ignore this email; your password stays the same.</p>`,
    });
}
