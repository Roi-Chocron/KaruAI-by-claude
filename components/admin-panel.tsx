'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { AppShell, PageHeading } from '@/components/app-shell';
import { adminMessages } from '@/messages/admin';
import { appMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
import { PLANS, PLAN_IDS, type PlanId } from '@/shared/plans';
import type { MonthlyUsage, PublicUser, User } from '@/types';

type Setting = { key: string; value: string; source: 'admin' | 'env' | 'none'; envName: string; updatedAt: string | null };
type AdminUser = User & { carouselCount: number; usage: Omit<MonthlyUsage, 'month'> };
type Stats = {
  users: number;
  activeLast7Days: number;
  suspended: number;
  carousels: number;
  plans: Partial<Record<PlanId, number>>;
  month: Omit<MonthlyUsage, 'month'>;
  daily: { day: string; messages: number; images: number; tokens: number }[];
};

// Which settings hold secrets (shown masked, typed into a password field)
const SECRET_SETTINGS = new Set(['gemini_api_key', 'pollinations_api_key']);

const formatDate = (iso: string | null, locale: Locale) =>
  iso ? new Date(iso).toLocaleString(locale === 'he' ? 'he-IL' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const card = 'rounded-2xl border border-line p-6 sm:p-8';
const sectionTitle = 'font-display font-bold text-4xl leading-none';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
  return data as T;
}

const SettingRow = ({ setting, onSaved, locale }: { setting: Setting; onSaved: (setting: Setting) => void; locale: Locale }) => {
  const t = adminMessages[locale];
  const meta = t.settings[setting.key] ?? { label: setting.key, help: '' };
  const secret = SECRET_SETTINGS.has(setting.key);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (value: string | null) => {
    setBusy(true);
    setError(null);
    try {
      const data = await request<{ setting: Setting }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key: setting.key, value }),
      });
      onSaved(data.setting);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const sourceLabel = setting.source === 'admin'
    ? t.setHere(formatDate(setting.updatedAt, locale))
    : setting.source === 'env' ? t.fromSecret(setting.envName)
    : secret ? t.notSet : t.defaultValue;
  const missing = setting.source === 'none' && secret;

  return (
    <div className="py-5 border-b border-line last:border-0">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
        <div className="min-w-0">
          <p className="font-semibold">{meta.label}</p>
          <p className="text-sm text-graphite mb-2">{meta.help}</p>
          <p className="text-sm">
            <span className="font-mono" dir="ltr">{setting.value || '—'}</span>
            <span className={`ms-2 ${missing ? 'text-red-700 font-semibold' : 'text-graphite'}`}>{sourceLabel}</span>
          </p>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); if (draft.trim()) save(draft.trim()); }}
          className="flex items-center gap-2 shrink-0"
        >
          <input
            type={secret ? 'password' : 'text'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={secret ? t.newKey : t.newModel}
            aria-label={`${meta.label}: ${secret ? t.newKey : t.newModel}`}
            autoComplete="off"
            dir="ltr"
            className="w-full lg:w-64 border border-line rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          />
          <button type="submit" disabled={busy || !draft.trim()} className="btn-primary !py-2.5 text-sm disabled:opacity-40">
            {t.save}
          </button>
          {setting.source === 'admin' && (
            <button type="button" disabled={busy} onClick={() => save(null)} className="text-sm font-semibold text-graphite hover:text-red-700 px-2" title={t.clearTitle}>
              {t.clear}
            </button>
          )}
        </form>
      </div>
      {error && <p role="alert" className="text-sm text-red-700 mt-2">{error}</p>}
    </div>
  );
};

// AI requests per day over the last two weeks, as simple bars
function DailyChart({ daily, locale }: { daily: Stats['daily']; locale: Locale }) {
  const t = adminMessages[locale];
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const byDay = new Map(daily.map(row => [row.day, row]));
  const max = Math.max(1, ...daily.map(row => row.messages + row.images));
  return (
    <div className="flex items-end gap-1.5 h-40" dir="ltr">
      {days.map(day => {
        const row = byDay.get(day);
        const total = (row?.messages ?? 0) + (row?.images ?? 0);
        return (
          <div key={day} className="flex-1 h-full flex flex-col items-center gap-1" title={t.chartDay(day, row?.messages ?? 0, row?.images ?? 0, (row?.tokens ?? 0).toLocaleString())}>
            <div className="flex-1 w-full flex items-end">
              <div className="w-full bg-ink rounded-t-[3px]" style={{ height: `${(total / max) * 100}%`, minHeight: total ? 2 : 0 }} />
            </div>
            <span className="text-[11px] text-graphite tabular-nums">{day.slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Dashboard({ me, locale }: { me: PublicUser; locale: Locale }) {
  const t = adminMessages[locale];
  const loading = appMessages[locale].shell.loading;
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<{ settings: Setting[] }>('/api/admin/settings').then(data => setSettings(data.settings)).catch(err => setError(err.message));
    request<{ users: AdminUser[] }>('/api/admin/users').then(data => setUsers(data.users)).catch(err => setError(err.message));
    request<Stats>('/api/admin/stats').then(setStats).catch(err => setError(err.message));
  }, []);

  // Applies { role } / { plan } / { suspended } to the user
  const updateUser = async (user: AdminUser, change: Record<string, unknown>) => {
    try {
      const data = await request<{ user: User }>(`/api/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(change) });
      setUsers(prev => prev?.map(item => (item.id === user.id ? { ...item, ...data.user } : item)) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : t.updateFailed);
    }
  };

  const toggleSuspended = (user: AdminUser) => {
    const suspend = !user.suspendedAt;
    if (suspend && !confirm(t.confirmSuspend(user.email))) return;
    updateUser(user, { suspended: suspend });
  };

  const removeUser = async (user: AdminUser) => {
    if (!confirm(t.confirmDelete(user.email, user.carouselCount))) return;
    try {
      await request(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      setUsers(prev => prev?.filter(item => item.id !== user.id) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : t.deleteFailed);
    }
  };

  const tiles = [
    { label: t.tiles.users, value: stats?.users },
    { label: t.tiles.active, value: stats?.activeLast7Days },
    { label: t.tiles.carousels, value: stats?.carousels },
    { label: t.tiles.paying, value: stats ? (stats.plans.pro ?? 0) + (stats.plans.agency ?? 0) : undefined },
    { label: t.tiles.messages, value: stats?.month.messages },
    { label: t.tiles.images, value: stats?.month.images },
    { label: t.tiles.tokens, value: stats?.month.tokens },
    { label: t.tiles.suspended, value: stats?.suspended },
  ];
  const select = 'border border-line bg-paper rounded-lg px-2 py-1.5 text-sm font-medium disabled:opacity-60';

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
      <PageHeading title={t.title} sub={t.sub} />

      {error && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl border border-line overflow-hidden">
        {tiles.map((tile, i) => (
          <div key={tile.label} className={`p-5 sm:p-6 border-line ${i % 2 ? 'border-s' : ''} md:border-s ${i % 4 === 0 ? 'md:border-s-0' : ''} ${i >= 2 ? 'border-t' : ''} ${i < 4 ? 'md:border-t-0' : 'md:border-t'}`}>
            <p className="text-sm text-graphite">{tile.label}</p>
            <p className="font-display font-bold text-5xl leading-none mt-2 tabular-nums">{tile.value?.toLocaleString() ?? '—'}</p>
          </div>
        ))}
      </div>

      {stats && (
        <section className={card}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2 className={sectionTitle}>{t.chart}</h2>
            <p className="text-sm text-graphite" dir="ltr">
              {PLAN_IDS.map(id => `${PLANS[id].name}: ${stats.plans[id] ?? 0}`).join(' · ')}
            </p>
          </div>
          <DailyChart daily={stats.daily} locale={locale} />
        </section>
      )}

      <section className={card}>
        <h2 className={sectionTitle}>{t.keys}</h2>
        <p className="text-sm text-graphite mt-3 mb-2 max-w-2xl">{t.keysSub}</p>
        {!settings ? (
          <div className="flex items-center gap-2 text-sm text-graphite py-4"><Loader2 size={16} className="animate-spin" /> {loading}</div>
        ) : (
          settings.map(setting => (
            <SettingRow key={setting.key} setting={setting} locale={locale} onSaved={next => setSettings(prev => prev?.map(item => (item.key === next.key ? next : item)) ?? null)} />
          ))
        )}
      </section>

      <section className={card}>
        <h2 className={`${sectionTitle} mb-6`}>{t.users}</h2>
        {!users ? (
          <div className="flex items-center gap-2 text-sm text-graphite py-4"><Loader2 size={16} className="animate-spin" /> {loading}</div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-graphite border-b border-ink">
                  <th className="py-3 pe-4 text-start font-medium">{t.columns.user}</th>
                  <th className="py-3 pe-4 text-start font-medium">{t.columns.role}</th>
                  <th className="py-3 pe-4 text-start font-medium">{t.columns.plan}</th>
                  <th className="py-3 pe-4 text-start font-medium">{t.columns.carousels}</th>
                  <th className="py-3 pe-4 text-start font-medium" title={t.monthTitle}>{t.columns.month}</th>
                  <th className="py-3 pe-4 text-start font-medium">{t.columns.tokens}</th>
                  <th className="py-3 pe-4 text-start font-medium">{t.columns.joined}</th>
                  <th className="py-3 pe-4 text-start font-medium">{t.columns.lastActive}</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const isMe = user.id === me.id;
                  return (
                    <tr key={user.id} className={`border-b border-line last:border-0 ${user.suspendedAt ? 'bg-red-50' : ''}`}>
                      <td className="py-3.5 pe-4">
                        <p className="font-semibold" dir="auto">{user.name || '—'}{isMe && <span className="ms-2 text-xs font-medium text-graphite">{t.you}</span>}</p>
                        <p className="text-graphite">{user.email}</p>
                        {user.suspendedAt && <p className="text-xs font-semibold text-red-700">{t.suspendedOn(formatDate(user.suspendedAt, locale))}</p>}
                      </td>
                      <td className="py-3.5 pe-4">
                        <select
                          value={user.role}
                          disabled={isMe}
                          onChange={e => updateUser(user, { role: e.target.value })}
                          title={isMe ? t.ownRole : undefined}
                          aria-label={`${t.columns.role}: ${user.email}`}
                          className={`${select} ${user.role === 'admin' ? '!bg-lime !border-lime' : ''}`}
                        >
                          <option value="user">{t.roles.user}</option>
                          <option value="admin">{t.roles.admin}</option>
                        </select>
                      </td>
                      <td className="py-3.5 pe-4">
                        <select
                          value={user.plan}
                          disabled={isMe}
                          onChange={e => updateUser(user, { plan: e.target.value })}
                          aria-label={`${t.columns.plan}: ${user.email}`}
                          className={select}
                        >
                          {PLAN_IDS.map(id => <option key={id} value={id}>{PLANS[id].name}</option>)}
                        </select>
                      </td>
                      <td className="py-3.5 pe-4 tabular-nums">{user.carouselCount}</td>
                      <td className="py-3.5 pe-4 whitespace-nowrap tabular-nums" dir="ltr">{user.usage.carousels} / {user.usage.messages} / {user.usage.images}</td>
                      <td className="py-3.5 pe-4 tabular-nums">{user.usage.tokens.toLocaleString()}</td>
                      <td className="py-3.5 pe-4 text-graphite whitespace-nowrap">{formatDate(user.createdAt, locale)}</td>
                      <td className="py-3.5 pe-4 text-graphite whitespace-nowrap">{formatDate(user.lastSeenAt, locale)}</td>
                      <td className="py-3.5 text-end whitespace-nowrap">
                        {!isMe && (
                          <>
                            <button onClick={() => toggleSuspended(user)} className="text-sm font-semibold px-2 py-1 rounded-lg hover:bg-mist">
                              {user.suspendedAt ? t.unsuspend : t.suspend}
                            </button>
                            <button onClick={() => removeUser(user)} title={t.deleteUser} aria-label={`${t.deleteUser}: ${user.email}`} className="p-1.5 rounded-lg text-graphite hover:text-red-700 hover:bg-mist">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AdminPanel({ me }: { me: PublicUser }) {
  return <AppShell user={me} active="admin">{locale => <Dashboard me={me} locale={locale} />}</AppShell>;
}
