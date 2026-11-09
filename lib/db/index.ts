import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { SCHEMA } from './schema';
import type { Role, User, CarouselRow, SettingKey } from '@/types';

export * from './schema';
export type { Role, User, CarouselRow, SettingKey } from '@/types';

// SQLite database (Node's built-in driver) for users, sessions, carousel ownership and app settings.
// Carousel contents (slides, images, histories) stay as files under .karu/carousels/<id>.
const DB_FILE = path.join(process.cwd(), '.karu', 'karuai.db');

const now = () => new Date().toISOString();

// One connection per server process, kept on globalThis so dev hot reloads don't open a new one each time
export function getDb(): DatabaseSync {
    const cache = globalThis as { __karuDb?: DatabaseSync };
    if (!cache.__karuDb) {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
        const db = new DatabaseSync(DB_FILE);
        db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
        db.exec(SCHEMA);
        cache.__karuDb = db;
        ensureAdminFromEnv(db);
    }
    return cache.__karuDb;
}

// --- Passwords ---

export function hashPassword(password: string): string {
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password: string, stored: string): boolean {
    const [scheme, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const expected = Buffer.from(hash, 'base64');
    const actual = scryptSync(password, Buffer.from(salt, 'base64'), expected.length);
    return timingSafeEqual(actual, expected);
}

// --- Users ---

const toUser = (row: any): User => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
    lastSeenAt: row.last_seen_at ?? null,
});

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const MIN_PASSWORD_LENGTH = 8;

export class UserInputError extends Error {}

export function createUser(input: { email: string; name: string; password: string; role?: Role }): User {
    const email = normalizeEmail(input.email);
    if (!isValidEmail(email)) throw new UserInputError('Please enter a valid email address.');
    if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new UserInputError(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    const db = getDb();
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
        throw new UserInputError('An account with this email already exists.');
    }
    const id = randomUUID();
    db.prepare('INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, email, input.name.trim().slice(0, 100), hashPassword(input.password), input.role ?? 'user', now());
    return getUserById(id)!;
}

export function getUserById(id: string): User | null {
    const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? toUser(row) : null;
}

export function getUserByEmail(email: string): User | null {
    const row = getDb().prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email));
    return row ? toUser(row) : null;
}

// Returns the user when the email and password match, and records the login
export function authenticate(email: string, password: string): User | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email));
    if (!row || !verifyPassword(password, row.password_hash)) return null;
    const time = now();
    db.prepare('UPDATE users SET last_login_at = ?, last_seen_at = ? WHERE id = ?').run(time, time, row.id);
    return toUser({ ...row, last_login_at: time, last_seen_at: time });
}

export function listUsersWithStats(): (User & { carouselCount: number })[] {
    return getDb().prepare(`
        SELECT users.*, COUNT(carousels.id) AS carousel_count
        FROM users LEFT JOIN carousels ON carousels.owner_id = users.id
        GROUP BY users.id ORDER BY users.created_at DESC
    `).all().map((row: any) => ({ ...toUser(row), carouselCount: Number(row.carousel_count) }));
}

export function setUserRole(id: string, role: Role) {
    getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
}

// Deletes the user with their sessions and carousel rows; returns the carousel ids so their files can go too
export function deleteUser(id: string): string[] {
    const db = getDb();
    const carouselIds = db.prepare('SELECT id FROM carousels WHERE owner_id = ?').all(id).map((row: any) => row.id as string);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return carouselIds;
}

// The admin account comes from ADMIN_EMAIL / ADMIN_PASSWORD (.env.local), so no password lives in the code.
// It is created once; later runs only make sure that account is still an admin.
function ensureAdminFromEnv(db: DatabaseSync) {
    const email = process.env.ADMIN_EMAIL ? normalizeEmail(process.env.ADMIN_EMAIL) : '';
    const password = process.env.ADMIN_PASSWORD ?? '';
    if (!email || !password) return;
    const existing: any = db.prepare('SELECT id, role FROM users WHERE email = ?').get(email);
    if (existing) {
        if (existing.role !== 'admin') db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
        return;
    }
    db.prepare("INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'admin', ?)")
        .run(randomUUID(), email, 'Admin', hashPassword(password), now());
}

// --- Sessions ---

export const SESSION_DAYS = 30;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// Only a hash of the token is stored, so a copy of the database cannot be used to sign in
export function createSession(userId: string): { token: string; expiresAt: Date } {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
    getDb().prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(hashToken(token), userId, now(), expiresAt.toISOString());
    return { token, expiresAt };
}

export function getUserBySession(token: string): User | null {
    const db = getDb();
    const row: any = db.prepare(`
        SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `).get(hashToken(token), now());
    if (!row) return null;
    // "Last active" is refreshed at most once a minute
    if (!row.last_seen_at || Date.now() - Date.parse(row.last_seen_at) > 60_000) {
        row.last_seen_at = now();
        db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(row.last_seen_at, row.id);
    }
    return toUser(row);
}

export function deleteSession(token: string) {
    getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

// --- Password resets ---

export const PASSWORD_RESET_MINUTES = 30;

// Issues a single-use reset token for the account with this email, or null when there is none.
// Like sessions, only a hash of the token is stored. Older unused tokens for the user stop working.
export function createPasswordReset(email: string): { token: string; user: User } | null {
    const user = getUserByEmail(email);
    if (!user) return null;
    const db = getDb();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000).toISOString();
    db.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at <= ?').run(user.id, now());
    db.prepare('INSERT INTO password_resets (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(hashToken(token), user.id, now(), expiresAt);
    return { token, user };
}

// Sets a new password when the token is valid, unused and unexpired, then signs the user out everywhere.
// Returns false for a bad token.
export function resetPasswordWithToken(token: string, newPassword: string): boolean {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        throw new UserInputError(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    const db = getDb();
    const time = now();
    db.exec('BEGIN IMMEDIATE');
    try {
        // Claiming the token in the same statement that checks it means it can only be used once
        const row: any = db.prepare(`
            UPDATE password_resets SET used_at = ?
            WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
            RETURNING user_id
        `).get(time, hashToken(token), time);
        if (!row) {
            db.exec('ROLLBACK');
            return false;
        }
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), row.user_id);
        db.prepare('DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL').run(row.user_id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.user_id);
        db.exec('COMMIT');
        return true;
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

// --- Carousels (ownership and gallery metadata) ---

const toCarousel = (row: any): CarouselRow => ({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    slideCount: Number(row.slide_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export function insertCarousel(id: string, ownerId: string): CarouselRow {
    const time = now();
    getDb().prepare('INSERT INTO carousels (id, owner_id, title, slide_count, created_at, updated_at) VALUES (?, ?, \'\', 0, ?, ?)')
        .run(id, ownerId, time, time);
    return getCarouselRow(id)!;
}

export function getCarouselRow(id: string): CarouselRow | null {
    const row = getDb().prepare('SELECT * FROM carousels WHERE id = ?').get(id);
    return row ? toCarousel(row) : null;
}

export function listCarouselRows(ownerId: string): CarouselRow[] {
    return getDb().prepare('SELECT * FROM carousels WHERE owner_id = ? ORDER BY updated_at DESC').all(ownerId).map(toCarousel);
}

export function updateCarouselRow(id: string, update: { title: string; slideCount: number }): CarouselRow {
    getDb().prepare('UPDATE carousels SET title = ?, slide_count = ?, updated_at = ? WHERE id = ?')
        .run(update.title, update.slideCount, now(), id);
    return getCarouselRow(id)!;
}

export function deleteCarouselRow(id: string) {
    getDb().prepare('DELETE FROM carousels WHERE id = ?').run(id);
}

export function countCarousels(): number {
    return Number((getDb().prepare('SELECT COUNT(*) AS count FROM carousels').get() as any).count);
}

// --- Settings (API keys etc.), set on the admin page; .env.local values are the fallback ---

export const SETTING_ENV: Record<SettingKey, string> = {
    gemini_api_key: 'GEMINI_API_KEY',
    pollinations_api_key: 'POLLINATIONS_API_KEY',
    gemini_model: 'GEMINI_MODEL',
};

export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';

export function getStoredSetting(key: SettingKey): { value: string; updatedAt: string } | null {
    const row: any = getDb().prepare('SELECT value, updated_at FROM settings WHERE key = ?').get(key);
    return row ? { value: row.value, updatedAt: row.updated_at } : null;
}

export function setSetting(key: SettingKey, value: string | null) {
    const db = getDb();
    if (value === null || value.trim() === '') {
        db.prepare('DELETE FROM settings WHERE key = ?').run(key);
    } else {
        db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
            .run(key, value.trim(), now());
    }
}

// The value in effect: the admin page's setting, else the environment variable
export function getSetting(key: SettingKey): string | undefined {
    return getStoredSetting(key)?.value || process.env[SETTING_ENV[key]] || undefined;
}
