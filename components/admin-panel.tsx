'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { AppShell, PageHeading } from '@/components/app-shell';
import { adminMessages } from '@/messages/admin';
import { appMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
import { PLANS, PLAN_IDS, type PaidPlanId, type PlanId } from '@/shared/plans';
import type { MonthlyUsage, PublicUser, User } from '@/types';

type Setting = { key: string; value: string; source: 'admin' | 'env' | 'none'; envName: string; updatedAt: string | null };
type Subscription = { plan: PaidPlanId; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean };
type AdminUser = User & { carouselCount: number; usage: Omit<MonthlyUsage, 'month'>; subscription: Subscription | null };
type Stats = {
  users: number;
  activeLast7Days: number;
  suspended: number;
  carousels: number;
  paying: number;
  comped: number;
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

// The API's own error messages are English, so in Hebrew a failed request is described by its status (or its code) instead
async function request<T>(locale: Locale, url: string, init?: RequestInit): Promise<T> {
  const t = adminMessages[locale];
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  } catch {
    throw new Error(t.offline);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const known = data?.code === 'has_subscription' ? t.hasSubscription
      : data?.code === 'below_subscription' ? t.belowSubscription(PLANS[data.subscriptionPlan as PlanId]?.name ?? '')
      : data?.code === 'polar_unavailable' ? t.polarUnavailable
      : null;
    throw new Error(known || (locale === 'en' && data?.error) || t.requestFailed(res.status));
  }
  return data as T;
}

// A subscription that will charge again: it grants its plan and is not set to end
const renewing = (subscription: Subscription | null) =>
  !!subscription && ['active', 'trialing', 'past_due'].includes(subscription.status) && !subscription.cancelAtPeriodEnd;

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
  const [compFor, setCompFor] = useState<AdminUser | null>(null);

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

  const day = (iso: string | null) => formatDate(iso, locale, { dateStyle: 'medium' });

  // Suspending a payer also sets their subscription to end at the period's end, unless the admin says no
  const toggleSuspended = async (user: AdminUser) => {
    const suspend = !user.suspendedAt;
    if (!suspend) return updateUser(user, { suspended: false });
    if (!confirm(t.confirmSuspend(user.email))) return;
    const sub = user.subscription;
    const cancelSubscription = renewing(sub) ? confirm(t.confirmSuspendSubscription(PLANS[sub!.plan].name, day(sub!.currentPeriodEnd))) : false;
    try {
      const data = await request<{ user: User; subscription: 'canceled' | 'failed' | null }>(locale, `/api/admin/users/${user.id}`, {
        method: 'PATCH', body: JSON.stringify({ suspended: true, cancelSubscription }),
      });
      setUsers(prev => prev?.map(item => (item.id === user.id
        ? { ...item, ...data.user, subscription: data.subscription === 'canceled' && item.subscription ? { ...item.subscription, cancelAtPeriodEnd: true } : item.subscription }
        : item)) ?? null);
      if (data.subscription === 'failed') alert(t.suspendSubscriptionFailed);
    } catch (err) {
      alert(err instanceof Error ? err.message : t.updateFailed);
    }
  };

  const removeUser = async (user: AdminUser) => {
    const sub = user.subscription;
    const question = renewing(sub)
      ? t.confirmDeletePayer(user.email, user.carouselCount, PLANS[sub!.plan].name, day(sub!.currentPeriodEnd))
      : t.confirmDelete(user.email, user.carouselCount);
    if (!confirm(question)) return;
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
    { label: t.tiles.paying, value: stats?.paying },
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
  // The plan, where it comes from (Polar or a comp), and a button to change the comp
  const planSelect = (user: AdminUser, isMe: boolean) => {
    const sub = user.subscription;
    const state = !sub ? null
      : sub.status === 'past_due' ? t.polarState.pastDue
      : !['active', 'trialing'].includes(sub.status) ? t.polarState.ended
      : sub.cancelAtPeriodEnd ? t.polarState.ends(day(sub.currentPeriodEnd))
      : t.polarState.renews(day(sub.currentPeriodEnd));
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold"><bdi dir="ltr">{PLANS[user.plan].name}</bdi></span>
          {!isMe && (
            <button type="button" onClick={() => setCompFor(user)} aria-label={t.changePlanOf(user.email)} className="min-h-10 text-sm font-semibold px-2 rounded-lg underline underline-offset-4 hover:bg-mist">
              {t.changePlan}
            </button>
          )}
        </div>
        {sub && state && <p className="text-xs text-graphite">{t.polarBadge(PLANS[sub.plan].name, state)}</p>}
        {user.planOverride && (
          <p className="text-xs"><span className="bg-lime text-ink rounded px-1 font-semibold">{t.compBadge(PLANS[user.planOverride].name, user.planOverrideUntil && day(user.planOverrideUntil))}</span></p>
        )}
      </div>
    );
  };
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
                <li>{t.comped} <span className="font-semibold text-ink tabular-nums">{formatNumber(stats.comped, locale)}</span></li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-graphite -mt-3 mb-5">{t.chartSub}</p>
          <DailyChart daily={stats.daily} locale={locale} />
        </section>
      )}

      <BillingHealth locale={locale} />

      <SupportRequests locale={locale} />

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

      {compFor && (
        <CompDialog
          user={compFor}
          locale={locale}
          onClose={() => setCompFor(null)}
          onSaved={next => {
            setUsers(prev => prev?.map(item => (item.id === next.id ? { ...item, ...next } : item)) ?? null);
            setCompFor(null);
          }}
        />
      )}
    </main>
  );
}

// Changing a user's plan by hand: a comp kept apart from Polar, optionally until a date
function CompDialog({ user, locale, onClose, onSaved }: { user: AdminUser; locale: Locale; onClose: () => void; onSaved: (user: User) => void }) {
  const t = adminMessages[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const [plan, setPlan] = useState<PlanId>(user.planOverride ?? user.plan);
  const [until, setUntil] = useState(user.planOverrideUntil?.slice(0, 10) ?? '');
  const [reason, setReason] = useState(user.planOverrideReason ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await request<{ user: User }>(locale, `/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ plan, until: until ? new Date(`${until}T23:59:59`).toISOString() : null, reason: reason || null }),
      });
      onSaved(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.updateFailed);
      setBusy(false);
    }
  };

  const field = 'w-full min-h-10 border border-line bg-paper rounded-lg px-3 py-2 text-sm';
  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="comp-title" className="rounded-2xl p-0 backdrop:bg-ink/40 w-[min(32rem,calc(100vw-2rem))]">
      <form onSubmit={save} className="p-6 space-y-4 text-ink">
        <h2 id="comp-title" className="font-display font-bold text-3xl leading-none break-words">{t.compTitle(user.email)}</h2>
        <p className="text-sm text-graphite">{t.compHelp}</p>
        <label className="block text-sm">
          <span className="block font-medium mb-1">{t.compPlan}</span>
          <select value={plan} onChange={e => setPlan(e.target.value as PlanId)} className={field}>
            {PLAN_IDS.map(id => <option key={id} value={id}>{PLANS[id].name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="block font-medium mb-1">{t.compUntil}</span>
          <input type="date" value={until} onChange={e => setUntil(e.target.value)} disabled={plan === 'free'} className={field} />
        </label>
        <label className="block text-sm">
          <span className="block font-medium mb-1">{t.compReason}</span>
          <input value={reason} onChange={e => setReason(e.target.value)} maxLength={200} disabled={plan === 'free'} className={field} />
        </label>
        <p role="alert" className="text-sm text-red-700 empty:hidden">{error}</p>
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={() => dialog.current?.close()} className="btn-secondary">{t.compCancel}</button>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {t.compSave}
          </button>
        </div>
      </form>
    </dialog>
  );
}

type Health = {
  configured: boolean;
  server: 'sandbox' | 'production';
  token: 'ok' | 'missing' | 'refused' | 'unreachable';
  products: { plan: PaidPlanId; id: string | null; name: string | null; amount: number | null; expected: number; problems: string[] }[];
  webhookSecret: boolean;
  lastWebhookAt: string | null;
  apiVersion: { sent: string; answered: string | null };
  ignoredWebhooks: { receivedAt: string; type: string; reason: string }[];
};

// Whether payments can work, checked against Polar when the page opens
function BillingHealth({ locale }: { locale: Locale }) {
  const t = adminMessages[locale];
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    request<Health>(locale, '/api/admin/billing-health').then(setHealth).catch(err => setError(err.message));
  }, [locale]);

  const price = (agorot: number | null) => (agorot === null ? '—' : `₪${agorot / 100}`);
  const rows = health && [
    { ok: health.configured, text: health.configured ? t.billingServer(health.server) : t.billingNotConfigured },
    { ok: health.token === 'ok', text: t.billingToken[health.token] },
    ...health.products.map(product => ({
      ok: product.problems.length === 0,
      text: t.billingProduct(PLANS[product.plan].name, product.problems.length ? product.problems.join(', ') : price(product.amount)),
    })),
    { ok: health.webhookSecret, text: t.billingWebhookSecret(health.webhookSecret) },
    { ok: true, text: t.billingLastWebhook(health.lastWebhookAt && formatDate(health.lastWebhookAt, locale)) },
    { ok: !health.apiVersion.answered || health.apiVersion.answered === health.apiVersion.sent, text: t.billingVersion(health.apiVersion.sent, health.apiVersion.answered) },
  ];
  const allOk = rows?.every(row => row.ok);
  return (
    <section className={card}>
      <h2 className={sectionTitle}>{t.billing}</h2>
      <p className="text-sm text-graphite mt-3 mb-4 max-w-2xl">{t.billingSub}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!rows ? (
        !error && <div role="status" className="flex items-center gap-2 text-sm text-graphite"><Loader2 size={16} className="animate-spin" /> {appMessages[locale].shell.loading}</div>
      ) : (
        <>
          {allOk && <p className="mb-3 text-sm font-semibold"><span className="bg-lime text-ink rounded px-1">{t.billingOk}</span></p>}
          <ul className="space-y-1.5 text-sm">
            {rows.map(row => (
              <li key={row.text} className={row.ok ? '' : 'text-red-700 font-semibold'}>
                <span aria-hidden="true">{row.ok ? '✓' : '✗'}</span> {row.text}
              </li>
            ))}
          </ul>
          <h3 className="font-semibold mt-6 mb-2">{t.ignored}</h3>
          {health!.ignoredWebhooks.length === 0 ? (
            <p className="text-sm text-graphite">{t.ignoredNone}</p>
          ) : (
            <ul className="space-y-1 text-sm text-graphite">
              {health!.ignoredWebhooks.map(item => (
                <li key={`${item.receivedAt}-${item.type}`}><bdi>{t.ignoredRow(item.type, item.reason, formatDate(item.receivedAt, locale))}</bdi></li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

type SupportRequest = {
  id: string;
  createdAt: string;
  category: string;
  status: 'open' | 'done';
  name: string | null;
  email: string | null;
  idNumber: string | null;
  plan: string | null;
  page: string | null;
  message: string | null;
};

// Cancellations and contact messages, open ones first
function SupportRequests({ locale }: { locale: Locale }) {
  const t = adminMessages[locale];
  const [requests, setRequests] = useState<SupportRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    request<{ requests: SupportRequest[] }>(locale, '/api/admin/requests').then(data => setRequests(data.requests)).catch(err => setError(err.message));
  }, [locale]);

  const close = async (id: string) => {
    try {
      await request(locale, `/api/admin/requests/${encodeURIComponent(id)}/done`, { method: 'POST' });
      setRequests(prev => prev?.map(item => (item.id === id ? { ...item, status: 'done' } : item)) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : t.updateFailed);
    }
  };

  return (
    <section className={card}>
      <h2 className={sectionTitle}>{t.requests}</h2>
      <p className="text-sm text-graphite mt-3 mb-4 max-w-2xl">{t.requestsSub}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!requests ? (
        !error && <div role="status" className="flex items-center gap-2 text-sm text-graphite"><Loader2 size={16} className="animate-spin" /> {appMessages[locale].shell.loading}</div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-graphite">{t.noRequests}</p>
      ) : (
        <ul className="divide-y divide-line border-t border-ink">
          {requests.map(item => (
            <li key={item.id} className={`py-4 text-sm ${item.status === 'done' ? 'text-graphite' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  <span dir="ltr">{item.id}</span> · {t.categories[item.category] ?? item.category} · {item.status === 'open' ? t.requestOpen : t.requestClosed}
                  <span className="ms-2 font-normal text-graphite">{formatDate(item.createdAt, locale)}</span>
                </p>
                {item.status === 'open' && (
                  <button type="button" onClick={() => close(item.id)} aria-label={t.requestDoneNamed(item.id)} className="btn-secondary !min-h-10 !py-1.5">
                    {t.requestDone}
                  </button>
                )}
              </div>
              <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
                {(['name', 'email', 'idNumber', 'plan', 'page', 'message'] as const).map(key => item[key] && (
                  <div key={key} className="contents">
                    <dt className="text-graphite">{t.requestFields[key]}</dt>
                    <dd className="break-words whitespace-pre-line"><bdi>{item[key]}</bdi></dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminPanel({ me }: { me: PublicUser }) {
  return <AppShell user={me} active="admin">{locale => <Dashboard me={me} locale={locale} />}</AppShell>;
}
