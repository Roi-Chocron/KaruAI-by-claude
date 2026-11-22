import { createSupportRequest, type SupportCategory } from '../db';
import { monitoring } from '../monitoring';
import { clientIp, createApp, currentUser, errorJson, rateLimit } from '../app';

// Requests to support that don't need an account: cancelling a subscription (the law requires a way that works without
// signing in) and the contact form. They are listed on the Admin page.
const support = createApp();

const CATEGORIES: SupportCategory[] = ['cancellation', 'billing', 'bug', 'account', 'accessibility', 'privacy', 'idea', 'other'];
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

// { category, name, email, idNumber?, message?, page? } -> { reference }
support.post('/', async c => {
    const limited = await rateLimit(c, 'supportIp', clientIp(c));
    if (limited) return limited;
    const body: any = await c.req.json().catch(() => null);
    const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
    const category = body?.category;
    const name = text(body?.name, 100);
    const email = text(body?.email, 254).toLowerCase();
    const idNumber = text(body?.idNumber, 20).replace(/[\s-]/g, '');
    const message = text(body?.message, 4000);
    if (!CATEGORIES.includes(category)) return errorJson(c, '`category` is not a known category.', 400, { code: 'invalid_category' });
    if (!name) return errorJson(c, 'Please enter your name.', 400, { code: 'name_required' });
    if (!EMAIL.test(email)) return errorJson(c, 'Please enter a valid email address.', 400, { code: 'email_invalid' });
    if (idNumber && !/^\d{5,9}$/.test(idNumber)) return errorJson(c, 'The ID number must be 5 to 9 digits.', 400, { code: 'id_number_invalid' });
    if (category !== 'cancellation' && !message) return errorJson(c, 'Please write your message.', 400, { code: 'message_required' });

    const user = await currentUser(c).catch(() => null);
    const prefix = category === 'cancellation' ? 'KC' : 'SR';
    const reference = `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    await createSupportRequest(c.env.DB, {
        id: reference,
        category,
        userId: user?.id ?? null,
        name,
        email,
        idNumber: idNumber || null,
        plan: user?.plan ?? null,
        page: text(body?.page, 200) || null,
        message: message || null,
    });
    monitoring.notice(`New support request (${category})`, { reference, category });
    return c.json({ reference }, 201);
});

export default support;
