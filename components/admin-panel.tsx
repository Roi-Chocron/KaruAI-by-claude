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

const intlLocale = (locale: Locale) => (locale === 'he' ? 'he-IL' : 'en-GB');
const formatDate = (iso: string | null, locale: Locale, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }) =>
  iso ? new Date(iso).toLocaleString(intlLocale(locale), options) : '—';
// A day of the chart (YYYY-MM-DD, UTC) as "8 Nov" / "8 בנוב׳"
const formatDay = (day: string, locale: Locale, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(intlLocale(locale), { ...options, timeZone: 'UTC' });
const formatNumber = (n: number, locale: Locale) => n.toLocaleString(intlLocale(locale));

const card = 'rounded-2xl border border-line p-6 sm:p-8';
const sectionTitle = 'font-display font-bold text-4xl leading-none';

// The API's own error messages are English, so in Hebrew a failed request is described by its status instead
async function request<T>(locale: Locale, url: string, init?: RequestInit): Promise<T> {
  const t = adminMessages[locale];
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  } catch {
    throw new Error(t.offline);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error((locale === 'en' && data?.error) || t.requestFailed(res.status));
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
      const data = await request<{ setting: Setting }>(locale, '/api/admin/settings', {
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
          className="flex items-center gap-2 lg:shrink-0"
        >
          <input
            type={secret ? 'password' : 'text'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={secret ? t.newKey : t.newModel}
            aria-label={`${meta.label}: ${secret ? t.newKey : t.newModel}`}
            autoComplete="off"
            dir="ltr"
            className="min-w-0 flex-1 lg:flex-none lg:w-64 border border-line rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          />
          <button type="submit" disabled={busy || !draft.trim()} className="btn-primary !py-2.5 text-sm disabled:opacity-40">
            {t.save}
          </button>
          {setting.source === 'admin' && (
            <button type="button" disabled={busy} onClick={() => save(null)} className="min-h-10 text-sm font-semibold text-graphite hover:text-red-700 px-2" title={t.clearTitle}>
              {t.clear}
            </button>
          )}
        </form>
      </div>
      {error && <p role="alert" className="text-sm text-red-700 mt-2">{error}</p>}
    </div>
  );
};

// AI requests per day over the last two weeks, as simple bars. Time runs in the reading direction, so in Hebrew the
// newest day is on the left. Screen readers get the same numbers as a table.
function DailyChart({ daily, locale }: { daily: Stats['daily']; locale: Locale }) {
  const t = adminMessages[locale];
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const byDay = new Map(daily.map(row => [row.day, row]));
  const rows = days.map(day => {
    const row = byDay.get(day);
    return { day, messages: row?.messages ?? 0, images: row?.images ?? 0, tokens: row?.tokens ?? 0 };
  });
  const max = Math.max(1, ...rows.map(row => row.messages + row.images));
  return (
    <>
      <div aria-hidden="true">
        <div className="flex gap-2">
          <div className="flex flex-col justify-between h-40 text-[11px] text-graphite tabular-nums text-end pb-5">
            <span>{formatNumber(max, locale)}</span>
            <span>0</span>
          </div>
          <div className="flex-1 min-w-0 flex items-end gap-1 sm:gap-1.5 h-40">
            {rows.map(row => {
              const total = row.messages + row.images;
              return (
                <div key={row.day} className="flex-1 min-w-0 h-full flex flex-col items-center gap-1" title={t.chartDay(formatDay(row.day, locale), row.messages, row.images, formatNumber(row.tokens, locale))}>
                  <div className="flex-1 w-full flex items-end border-b border-line">
                    <div className="w-full bg-ink rounded-t-[3px]" style={{ height: `${(total / max) * 100}%`, minHeight: total ? 2 : 0 }} />
                  </div>
                  <span className="h-4 text-[11px] text-graphite tabular-nums">{Number(row.day.slice(8))}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between gap-4 mt-2 ms-8 text-xs text-graphite">
          <span>{formatDay(days[0], locale)}</span>
          <span>{formatDay(days[13], locale)}</span>
        </div>
      </div>
      {/* sr-only on a wrapper: a table ignores the 1px width and would widen the page */}
      <div className="sr-only">
        <table>
          <caption>{t.chart}</caption>
          <thead>
            <tr>
              <th scope="col">{t.chartTable.day}</th>
              <th scope="col">{t.chartTable.messages}</th>
              <th scope="col">{t.chartTable.images}</th>
              <th scope="col">{t.chartTable.tokens}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.day}>
                <th scope="row">{formatDay(row.day, locale, { day: 'numeric', month: 'long' })}</th>
                <td>{row.messages}</td>
                <td>{row.images}</td>
                <td>{formatNumber(row.tokens, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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
    request<{ settings: Setting[] }>(locale, '/api/admin/settings').then(data => setSettings(data.settings)).catch(err => setError(err.message));
    request<{ users: AdminUser[] }>(locale, '/api/admin/users').then(data => setUsers(data.users)).catch(err => setError(err.message));
    request<Stats>(locale, '/api/admin/stats').then(setStats).catch(err => setError(err.message));
  }, [locale]);

  // Applies { role } / { plan } / { suspended } to the user
  const updateUser = async (user: AdminUser, change: Record<string, unknown>) => {
    try {
      const data = await request<{ user: User }>(locale, `/api/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(change) });
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
      await request(locale, `/api/admin/users/${user.id}`, { method: 'DELETE' });
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
  const select = 'min-h-10 border border-line bg-paper rounded-lg px-2 py-1.5 text-sm font-medium disabled:opacity-60';
  const loadingRow = <div role="status" className="flex items-center gap-2 text-sm text-graphite py-4"><Loader2 size={16} className="animate-spin" /> {loading}</div>;

  const roleSelect = (user: AdminUser, isMe: boolean) => (
    <select
      value={user.role}
      disabled={isMe}
      onChange={e => updateUser(user, { role: e.target.value })}
      title={isMe ? t.ownRole : undefined}
      aria-label={t.roleOf(user.email)}
      className={`${select} ${user.role === 'admin' ? '!bg-lime !border-lime' : ''}`}
    >
      <option value="user">{t.roles.user}</option>
      <option value="admin">{t.roles.admin}</option>
    </select>
  );
  const planSelect = (user: AdminUser, isMe: boolean) => (
    <select
      value={user.plan}
      disabled={isMe}
      onChange={e => updateUser(user, { plan: e.target.value })}
      title={isMe ? t.ownPlan : undefined}
      aria-label={t.planOf(user.email)}
      className={select}
    >
      {PLAN_IDS.map(id => <option key={id} value={id}>{PLANS[id].name}</option>)}
    </select>
  );
  // No dir="ltr": in Hebrew the three numbers read right to left, in the same order as the column title
  const month = (user: AdminUser) => (
    <span className="whitespace-nowrap tabular-nums" title={t.monthTitle}>{user.usage.carousels} / {user.usage.messages} / {user.usage.images}</span>
  );
  const actions = (user: AdminUser) => (
    <>
      <button
        onClick={() => toggleSuspended(user)}
        aria-label={user.suspendedAt ? t.unsuspendUser(user.email) : t.suspendUser(user.email)}
        className="min-h-10 text-sm font-semibold px-3 rounded-lg hover:bg-mist"
      >
        {user.suspendedAt ? t.unsuspend : t.suspend}
      </button>
      <button onClick={() => removeUser(user)} title={t.deleteUser} aria-label={t.deleteUserNamed(user.email)} className="h-10 w-10 inline-grid place-items-center rounded-lg text-graphite hover:text-red-700 hover:bg-mist">
        <Trash2 size={16} />
      </button>
    </>
  );
  const identity = (user: AdminUser, isMe: boolean) => (
    <>
      {/* Direction on inline spans, so the lines still align to the page's start in Hebrew */}
      <p className="font-semibold break-words"><span dir="auto">{user.name || '—'}</span>{isMe && <span className="ms-2 text-xs font-medium text-graphite">{t.you}</span>}</p>
      <p className="text-graphite break-all"><span dir="ltr">{user.email}</span></p>
      {user.suspendedAt && <p className="text-xs font-semibold text-red-700">{t.suspendedOn(formatDate(user.suspendedAt, locale))}</p>}
    </>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
      <PageHeading title={t.title} sub={t.sub} />

      {error && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl border border-line overflow-hidden">
        {tiles.map((tile, i) => (
          <div key={tile.label} className={`p-5 sm:p-6 border-line ${i % 2 ? 'border-s' : ''} md:border-s ${i % 4 === 0 ? 'md:border-s-0' : ''} ${i >= 2 ? 'border-t' : ''} ${i < 4 ? 'md:border-t-0' : 'md:border-t'}`}>
            <p className="text-sm text-graphite">{tile.label}</p>
            <p className="font-display font-bold text-4xl sm:text-5xl leading-none mt-2 tabular-nums break-all">{tile.value === undefined ? '—' : formatNumber(tile.value, locale)}</p>
          </div>
        ))}
      </div>

      {stats && (
        <section className={card}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2 className={sectionTitle}>{t.chart}</h2>
            <div className="text-sm text-graphite">
              <h3 className="sr-only">{t.plansLegend}</h3>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                <li aria-hidden="true">{t.plansLegend}:</li>
                {PLAN_IDS.map(id => (
                  <li key={id}><span dir="ltr">{PLANS[id].name}</span> <span className="font-semibold text-ink tabular-nums">{formatNumber(stats.plans[id] ?? 0, locale)}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-sm text-graphite -mt-3 mb-5">{t.chartSub}</p>
          <DailyChart daily={stats.daily} locale={locale} />
        </section>
      )}

      <section className={card}>
        <h2 className={sectionTitle}>{t.keys}</h2>
        <p className="text-sm text-graphite mt-3 mb-2 max-w-2xl">{t.keysSub}</p>
        {!settings ? (
          loadingRow
        ) : (
          settings.map(setting => (
            <SettingRow key={setting.key} setting={setting} locale={locale} onSaved={next => setSettings(prev => prev?.map(item => (item.key === next.key ? next : item)) ?? null)} />
          ))
        )}
      </section>

      <section className={card}>
        <h2 className={`${sectionTitle} mb-6`}>{t.users}</h2>
        {!users ? (
          loadingRow
        ) : (
          <>
            {/* Phones and tablets: one card per user */}
            <ul className="lg:hidden divide-y divide-line border-t border-ink">
              {users.map(user => {
                const isMe = user.id === me.id;
                return (
                  <li key={user.id} className={`py-5 ${user.suspendedAt ? 'bg-red-50 -mx-6 sm:-mx-8 px-6 sm:px-8' : ''}`}>
                    {identity(user, isMe)}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {roleSelect(user, isMe)}
                      {planSelect(user, isMe)}
                      {!isMe && <div className="flex items-center ms-auto -me-2">{actions(user)}</div>}
                    </div>
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mt-4 text-sm">
                      <div><dt className="text-graphite">{t.columns.carousels}</dt><dd className="tabular-nums">{user.carouselCount}</dd></div>
                      <div><dt className="text-graphite">{t.monthShort}</dt><dd>{month(user)}</dd></div>
                      <div><dt className="text-graphite">{t.columns.tokens}</dt><dd className="tabular-nums">{formatNumber(user.usage.tokens, locale)}</dd></div>
                      <div><dt className="text-graphite">{t.columns.joined}</dt><dd>{formatDate(user.createdAt, locale, { dateStyle: 'medium' })}</dd></div>
                      <div><dt className="text-graphite">{t.columns.lastActive}</dt><dd>{formatDate(user.lastSeenAt, locale)}</dd></div>
                    </dl>
                  </li>
                );
              })}
            </ul>

            {/* Wide screens: the table; it scrolls inside the card if it still doesn't fit */}
            <div className="hidden lg:block overflow-x-auto -mx-8 px-8">
              <table className="w-full text-sm">
                <caption className="sr-only">{t.users}</caption>
                <thead>
                  <tr className="text-graphite border-b border-ink">
                    <th scope="col" className="py-3 pe-3 text-start font-medium">{t.columns.user}</th>
                    <th scope="col" className="py-3 pe-3 text-start font-medium">{t.columns.role}</th>
                    <th scope="col" className="py-3 pe-3 text-start font-medium">{t.columns.plan}</th>
                    <th scope="col" className="py-3 pe-3 text-start font-medium">{t.columns.carousels}</th>
                    <th scope="col" className="py-3 pe-3 text-start font-medium whitespace-nowrap" title={t.monthTitle}>{t.columns.month}</th>
                    <th scope="col" className="py-3 pe-3 text-start font-medium">{t.columns.tokens}</th>
                    <th scope="col" className="py-3 pe-3 text-start font-medium">{t.columns.joined}</th>
                    <th scope="col" className="py-3 pe-3 text-start font-medium whitespace-nowrap">{t.columns.lastActive}</th>
                    <th scope="col" className="py-3"><span className="sr-only">{t.columns.actions}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isMe = user.id === me.id;
                    return (
                      <tr key={user.id} className={`border-b border-line last:border-0 ${user.suspendedAt ? 'bg-red-50' : ''}`}>
                        <td className="py-3.5 pe-3 min-w-[12rem]">{identity(user, isMe)}</td>
                        <td className="py-3.5 pe-3">{roleSelect(user, isMe)}</td>
                        <td className="py-3.5 pe-3">{planSelect(user, isMe)}</td>
                        <td className="py-3.5 pe-3 tabular-nums">{user.carouselCount}</td>
                        <td className="py-3.5 pe-3">{month(user)}</td>
                        <td className="py-3.5 pe-3 tabular-nums">{formatNumber(user.usage.tokens, locale)}</td>
                        <td className="py-3.5 pe-3 text-graphite whitespace-nowrap">{formatDate(user.createdAt, locale, { dateStyle: 'medium' })}</td>
                        <td className="py-3.5 pe-3 text-graphite whitespace-nowrap">{formatDate(user.lastSeenAt, locale)}</td>
                        <td className="py-3.5 text-end whitespace-nowrap">{!isMe && actions(user)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function AdminPanel({ me }: { me: PublicUser }) {
  return <AppShell user={me} active="admin">{locale => <Dashboard me={me} locale={locale} />}</AppShell>;
}
