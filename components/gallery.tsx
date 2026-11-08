'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, ImageOff, Loader2, LogOut, Plus, Shield, Trash2 } from 'lucide-react';
import type { CarouselMeta } from '@/types';

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600], ['month', 30 * 24 * 3600], ['week', 7 * 24 * 3600],
  ['day', 24 * 3600], ['hour', 3600], ['minute', 60],
];

function timeAgo(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

const Thumbnail = ({ carousel }: { carousel: CarouselMeta }) => {
  const [failed, setFailed] = useState(false);
  if (carousel.slideCount === 0 || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
        <ImageOff size={32} />
        <span className="text-xs font-medium text-gray-400">{carousel.slideCount === 0 ? 'Empty' : 'No preview'}</span>
      </div>
    );
  }
  return (
    <img
      src={`/api/carousels/${carousel.id}/thumbnail?v=${encodeURIComponent(carousel.updatedAt)}`}
      alt=""
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
};

type SignedInUser = { id: string; email: string; name: string; role: 'user' | 'admin' };

export default function Gallery({ user }: { user: SignedInUser }) {
  const router = useRouter();
  const [carousels, setCarousels] = useState<CarouselMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetch('/api/carousels')
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
        setCarousels(data.carousels);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load the carousels.'));
  }, []);

  const createCarousel = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/carousels', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
      router.push(`/carousel/${data.id}`);
    } catch (err) {
      setIsCreating(false);
      alert(err instanceof Error ? err.message : 'Could not create a carousel.');
    }
  };

  const logOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const deleteCarousel = async (carousel: CarouselMeta) => {
    if (!confirm(`Delete "${carousel.title || 'Untitled carousel'}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/carousels/${carousel.id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Could not delete the carousel.');
      return;
    }
    setCarousels(prev => prev?.filter(item => item.id !== carousel.id) ?? null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <header className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow">
            <Bot className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">KaruAI</span>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <a href="/admin" className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-100">
              <Shield size={16} /> Admin
            </a>
          )}
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-slate-800" dir="auto">{user.name || user.email}</p>
            {user.name && <p className="text-xs text-gray-400">{user.email}</p>}
          </div>
          <button onClick={logOut} title="Log out" className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
            <LogOut size={18} />
          </button>
          <button
            onClick={createCarousel}
            disabled={isCreating}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            New carousel
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Your carousels</h1>
        <p className="text-sm text-gray-500 mb-8">Everything is saved automatically. Open a carousel to keep working on it.</p>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">{error}</p>}

        {!error && carousels === null && (
          <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        )}

        {carousels?.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
            <Bot size={40} className="mx-auto text-indigo-300 mb-4" />
            <p className="font-semibold text-slate-700 mb-1">No carousels yet</p>
            <p className="text-sm text-gray-500 mb-6">Create your first one and describe it to KaruAI.</p>
            <button onClick={createCarousel} disabled={isCreating} className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60">
              New carousel
            </button>
          </div>
        )}

        {carousels && carousels.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            <button
              onClick={createCarousel}
              disabled={isCreating}
              className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              <Plus size={32} />
              <span className="text-sm font-semibold">New carousel</span>
            </button>
            {carousels.map(carousel => (
              <div key={carousel.id} className="group">
                <button
                  onClick={() => router.push(`/carousel/${carousel.id}`)}
                  className="relative block w-full aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm group-hover:shadow-lg group-hover:border-indigo-300 transition-all"
                >
                  <Thumbnail carousel={carousel} />
                </button>
                <div className="flex items-start justify-between gap-2 mt-3">
                  <button onClick={() => router.push(`/carousel/${carousel.id}`)} className="min-w-0 text-left">
                    <p className="font-semibold text-sm text-slate-800 truncate" dir="auto">{carousel.title || 'Untitled carousel'}</p>
                    <p className="text-xs text-gray-400">
                      {carousel.slideCount} slide{carousel.slideCount === 1 ? '' : 's'} · edited {timeAgo(carousel.updatedAt)}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteCarousel(carousel)}
                    title="Delete carousel"
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
