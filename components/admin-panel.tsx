'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, Shield, Trash2, Users } from 'lucide-react';

type Me = { id: string; email: string; name: string; role: 'user' | 'admin' };
type Setting = { key: string; value: string; source: 'admin' | 'env' | 'none'; envName: string; updatedAt: string | null };
type AdminUser = Me & { createdAt: string; lastLoginAt: string | null; lastSeenAt: string | null; carouselCount: number };

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

export default function AdminPanel({ me }: { me: Me }) {
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [totalCarousels, setTotalCarousels] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<{ settings: Setting[] }>('/api/admin/settings').then(data => setSettings(data.settings)).catch(err => setError(err.message));
    request<{ users: AdminUser[]; totalCarousels: number }>('/api/admin/users')
      .then(data => { setUsers(data.users); setTotalCarousels(data.totalCarousels); })
      .catch(err => setError(err.message));
  }, []);

  const changeRole = async (user: AdminUser, role: 'user' | 'admin') => {
    try {
      await request(`/api/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
      setUsers(prev => prev?.map(item => (item.id === user.id ? { ...item, role } : item)) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not change the role.');
    }
  };

  const removeUser = async (user: AdminUser) => {
    if (!confirm(`Delete ${user.email} and their ${user.carouselCount} carousel(s)? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      setUsers(prev => prev?.filter(item => item.id !== user.id) ?? null);
      setTotalCarousels(count => count - user.carouselCount);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete the user.');
    }
  };

  const stats = [
    { label: 'Users', value: users?.length ?? '—' },
    { label: 'Admins', value: users?.filter(user => user.role === 'admin').length ?? '—' },
    { label: 'Carousels', value: users ? totalCarousels : '—' },
    { label: 'Active in the last 24 h', value: users?.filter(user => user.lastSeenAt && Date.now() - Date.parse(user.lastSeenAt) < 24 * 3600 * 1000).length ?? '—' },
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
          {stats.map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

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
                    <th className="py-3 pr-4">Carousels</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 pr-4">Last login</th>
                    <th className="py-3 pr-4">Last active</th>
                    <th className="py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isMe = user.id === me.id;
                    return (
                      <tr key={user.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-800" dir="auto">{user.name || '—'}{isMe && <span className="ml-2 text-xs font-medium text-indigo-600">(you)</span>}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={user.role}
                            disabled={isMe}
                            onChange={e => changeRole(user, e.target.value as 'user' | 'admin')}
                            title={isMe ? 'You cannot change your own role' : undefined}
                            className={`border rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-70 ${user.role === 'admin' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-slate-700'}`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{user.carouselCount}</td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{formatDate(user.lastLoginAt)}</td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{formatDate(user.lastSeenAt)}</td>
                        <td className="py-3 text-right">
                          {!isMe && (
                            <button onClick={() => removeUser(user)} title="Delete user" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                              <Trash2 size={16} />
                            </button>
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
