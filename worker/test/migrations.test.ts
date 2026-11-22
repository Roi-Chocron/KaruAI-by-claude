import { describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';

// The migrations against rows that already exist, which the other tests (on an empty database) never see
describe('migrations', () => {
    it('0003 moves the old plans to the new ones, and 0004 keeps hand-set plans as comps', async () => {
        const db = env.MIGRATION_TEST_DB;
        const byName = (prefix: string) => env.TEST_MIGRATIONS.filter(migration => migration.name.startsWith(prefix));
        await applyD1Migrations(db, [...byName('0001'), ...byName('0002')]);
        const insert = (id: string, plan: string) => db.prepare(`INSERT INTO users (id, email, name, role, created_at, plan) VALUES (?, ?, '', 'user', '2026-01-01', ?)`)
            .bind(id, `${id}@example.test`, plan);
        await db.batch([insert('u-free', 'free'), insert('u-pro', 'pro'), insert('u-agency', 'agency')]);

        await applyD1Migrations(db, byName('0003'));
        const rows = async (columns: string) => Object.fromEntries((await db.prepare(`SELECT id, ${columns} FROM users ORDER BY id`).raw<any>())
            .map(([id, ...values]) => [id, values.length === 1 ? values[0] : values]));
        expect(await rows('plan')).toEqual({ 'u-agency': 'vip', 'u-free': 'free', 'u-pro': 'pro' });
        await expect(insert('u-old', 'agency').run()).rejects.toThrow(/CHECK/);

        await applyD1Migrations(db, byName('0004'));
        expect(await rows('plan, plan_override')).toEqual({ 'u-agency': ['vip', 'vip'], 'u-free': ['free', null], 'u-pro': ['pro', 'pro'] });
    });
});
