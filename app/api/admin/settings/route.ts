import { NextResponse } from 'next/server';
import { DEFAULT_GEMINI_MODEL, getStoredSetting, SETTING_ENV, setSetting } from '@/lib/db';
import { forbidden, getCurrentUser, unauthorized } from '@/lib/auth';
import type { SettingKey } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SECRET_KEYS: SettingKey[] = ['gemini_api_key', 'pollinations_api_key'];
const ALL_KEYS: SettingKey[] = [...SECRET_KEYS, 'gemini_model'];

// API keys never go back to the browser in full: only their last 4 characters
const mask = (value: string) => (value.length <= 8 ? '••••' : `••••••••${value.slice(-4)}`);

function describe(key: SettingKey) {
    const stored = getStoredSetting(key);
    const envValue = process.env[SETTING_ENV[key]];
    const value = stored?.value || envValue || '';
    const shown = SECRET_KEYS.includes(key) ? (value ? mask(value) : '') : value || DEFAULT_GEMINI_MODEL;
    return {
        key,
        value: shown,
        source: stored ? 'admin' : envValue ? 'env' : 'none',
        envName: SETTING_ENV[key],
        updatedAt: stored?.updatedAt ?? null,
    };
}

async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    return null;
}

export async function GET() {
    const denied = await requireAdmin();
    if (denied) return denied;
    return NextResponse.json({ settings: ALL_KEYS.map(describe) });
}

// { key, value }: a non-empty value sets it, null or "" removes it (falling back to .env.local)
export async function PUT(request: Request) {
    const denied = await requireAdmin();
    if (denied) return denied;
    const body: any = await request.json().catch(() => null);
    if (!ALL_KEYS.includes(body?.key) || (body.value !== null && typeof body.value !== 'string') || (body.value?.length ?? 0) > 500) {
        return NextResponse.json({ error: 'Invalid setting.' }, { status: 400 });
    }
    setSetting(body.key, body.value);
    return NextResponse.json({ setting: describe(body.key) });
}
