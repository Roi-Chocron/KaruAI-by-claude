'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, KeyRound, Loader2, Shield, Trash2, Users } from 'lucide-react';
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

const SETTING_LABELS: Record<string, { label: string; help: string; secret: boolean }> = {
  gemini_api_key: { label: 'Gemini API key', help: 'Used to generate and edit carousels.', secret: true },
  pollinations_api_key: { label: 'Pollinations API key', help: 'Used to generate slide images.', secret: true },
  gemini_model: { label: 'Gemini model', help: 'The model that designs the carousels, e.g. gemini-3-flash-preview.', secret: false },
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
  return data as T;
}

const SettingRow = ({ setting, onSaved }: { setting: Setting; onSaved: (setting: Setting) => void }) => {
  const meta = SETTING_LABELS[setting.key];
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
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const sourceLabel = setting.source === 'admin'
    ? `Set here · ${formatDate(setting.updatedAt)}`
    : setting.source === 'env' ? `From the ${setting.envName} secret`
    : meta.secret ? 'Not set' : 'Default';
  const missing = setting.source === 'none' && meta.secret;

  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-slate-800">{meta.label}</p>
          <p className="text-xs text-gray-500 mb-2">{meta.help}</p>
          <p className="text-xs">
            <span className="font-mono text-slate-700">{setting.value || '—'}</span>
            <span className={`ml-2 ${missing ? 'text-red-500' : 'text-gray-400'}`}>{sourceLabel}</span>
          </p>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); if (draft.trim()) save(draft.trim()); }}
          className="flex items-center gap-2 shrink-0"
        >
          <input
            type={meta.secret ? 'password' : 'text'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={meta.secret ? 'Paste a new key' : 'New model name'}
            autoComplete="off"
            className="w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={busy || !draft.trim()} className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            Save
          </button>
          {setting.source === 'admin' && (
            <button type="button" disabled={busy} onClick={() => save(null)} className="text-sm font-semibold text-gray-500 hover:text-red-600 px-2" title="Remove and fall back to the Worker secret">
              Clear
            </button>
          )}
        </form>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
};

// AI requests per day over the last two weeks, as simple bars
function DailyChart({ daily }: { daily: Stats['daily'] }) {
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const byDay = new Map(daily.map(row => [row.day, row]));
  const max = Math.max(1, ...daily.map(row => row.messages + row.images));
  return (
    <div className="flex items-end gap-1.5 h-32">
      {days.map(day => {
        const row = byDay.get(day);
        const total = (row?.messages ?? 0) + (row?.images ?? 0);
        return (
          <div key={day} className="flex-1 h-full flex flex-col items-center gap-1" title={`${day}: ${row?.messages ?? 0} messages, ${row?.images ?? 0} images, ${(row?.tokens ?? 0).toLocaleString()} tokens`}>
            <div className="flex-1 w-full flex items-end">
              <div className="w-full bg-indigo-500 rounded-t" style={{ height: `${(total / max) * 100}%`, minHeight: total ? 2 : 0 }} />
            </div>
            <span className="text-[10px] text-gray-400">{day.slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPanel({ me }: { me: PublicUser }) {
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
      alert(err instanceof Error ? err.message : 'Could not update the user.');
    }
  };

  const toggleSuspended = (user: AdminUser) => {
    const suspend = !user.suspendedAt;
    if (suspend && !confirm(`Suspend ${user.email}? They are signed out and cannot sign in until you unsuspend them.`)) return;
    updateUser(user, { suspended: suspend });
  };

  const removeUser = async (user: AdminUser) => {
    if (!confirm(`Delete ${user.email} and their ${user.carouselCount} carousel(s)? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      setUsers(prev => prev?.filter(item => item.id !== user.id) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete the user.');
    }
  };

  const tiles = [
    { label: 'Users', value: stats?.users },
    { label: 'Active in the last 7 days', value: stats?.activeLast7Days },
    { label: 'Carousels', value: stats?.carousels },
    { label: 'Paying plans', value: stats ? (stats.plans.pro ?? 0) + (stats.plans.agency ?? 0) : undefined },
    { label: 'AI messages this month', value: stats?.month.messages },
    { label: 'AI images this month', value: stats?.month.images },
    { label: 'Tokens this month', value: stats?.month.tokens },
    { label: 'Suspended', value: stats?.suspended },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <header className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="Back to carousels"><ArrowLeft size={18} /></a>
          <Shield className="text-indigo-600" size={20} />
          <span className="text-xl font-bold tracking-tight text-slate-900">Admin</span>
        </div>
        <span className="text-sm text-gray-500">{me.email}</span>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">{error}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiles.map(tile => (
            <div key={tile.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{tile.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{tile.value?.toLocaleString() ?? '—'}</p>
            </div>
          ))}
        </div>

        {stats && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><BarChart3 size={18} /> AI requests, last 14 days</h2>
              <p className="text-sm text-gray-500">
                {PLAN_IDS.map(id => `${PLANS[id].name}: ${stats.plans[id] ?? 0}`).join(' · ')}
              </p>
            </div>
            <DailyChart daily={stats.daily} />
          </section>
        )}

        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 font-bold text-slate-900 mb-1"><KeyRound size={18} /> API keys</h2>
          <p className="text-sm text-gray-500 mb-2">Keys saved here take effect right away and override the Worker secrets. Saved keys are never shown again in full.</p>
          {!settings ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          ) : (
            settings.map(setting => (
              <SettingRow key={setting.key} setting={setting} onSaved={next => setSettings(prev => prev?.map(item => (item.key === next.key ? next : item)) ?? null)} />
            ))
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 font-bold text-slate-900 mb-4"><Users size={18} /> Users</h2>
          {!users ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Plan</th>
                    <th className="py-3 pr-4">Carousels</th>
                    <th className="py-3 pr-4" title="New carousels / AI messages / AI images this month">This month</th>
                    <th className="py-3 pr-4">Tokens</th>
                    <th className="py-3 pr-4">Joined</th>
                    <th className="py-3 pr-4">Last active</th>
                    <th className="py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isMe = user.id === me.id;
                    return (
                      <tr key={user.id} className={`border-b border-gray-100 last:border-0 ${user.suspendedAt ? 'bg-red-50/50' : ''}`}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-800" dir="auto">{user.name || '—'}{isMe && <span className="ml-2 text-xs font-medium text-indigo-600">(you)</span>}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.suspendedAt && <p className="text-xs font-semibold text-red-600">Suspended {formatDate(user.suspendedAt)}</p>}
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={user.role}
                            disabled={isMe}
                            onChange={e => updateUser(user, { role: e.target.value })}
                            title={isMe ? 'You cannot change your own role' : undefined}
                            className={`border rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-70 ${user.role === 'admin' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-slate-700'}`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={user.plan}
                            disabled={isMe}
                            onChange={e => updateUser(user, { plan: e.target.value })}
                            className="border border-gray-200 bg-white rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-70"
                          >
                            {PLAN_IDS.map(id => <option key={id} value={id}>{PLANS[id].name}</option>)}
                          </select>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{user.carouselCount}</td>
                        <td className="py-3 pr-4 text-slate-700 whitespace-nowrap">{user.usage.carousels} / {user.usage.messages} / {user.usage.images}</td>
                        <td className="py-3 pr-4 text-slate-700">{user.usage.tokens.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{formatDate(user.lastSeenAt)}</td>
                        <td className="py-3 text-right whitespace-nowrap">
                          {!isMe && (
                            <>
                              <button onClick={() => toggleSuspended(user)} className={`text-xs font-semibold px-2 py-1 rounded-lg ${user.suspendedAt ? 'text-green-700 hover:bg-green-50' : 'text-amber-700 hover:bg-amber-50'}`}>
                                {user.suspendedAt ? 'Unsuspend' : 'Suspend'}
                              </button>
                              <button onClick={() => removeUser(user)} title="Delete user" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
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
    </div>
  );
}
