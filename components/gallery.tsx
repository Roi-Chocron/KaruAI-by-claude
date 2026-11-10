'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { AppShell, PageHeading } from '@/components/app-shell';
import { appMessages, type AppMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
import type { CarouselMeta, PublicUser } from '@/types';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600], ['month', 30 * 24 * 3600], ['week', 7 * 24 * 3600],
  ['day', 24 * 3600], ['hour', 3600], ['minute', 60],
];

function timeAgo(iso: string, locale: Locale, justNow: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return justNow;
}

const Thumbnail = ({ carousel, t }: { carousel: CarouselMeta; t: AppMessages['gallery'] }) => {
  const [failed, setFailed] = useState(false);
  if (carousel.slideCount === 0 || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-mist text-graphite">
        <ImageOff size={28} strokeWidth={1.5} />
        <span className="text-xs font-medium">{carousel.slideCount === 0 ? t.empty : t.noPreview}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/carousels/${carousel.id}/thumbnail?v=${encodeURIComponent(carousel.updatedAt)}`}
      alt=""
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
};

function CarouselGrid({ locale }: { locale: Locale }) {
  const t = appMessages[locale].gallery;
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
      .catch(err => setError(err instanceof Error ? err.message : t.loadFailed));
  }, [t.loadFailed]);

  // `prompt` (one of the empty state's ideas) goes into the new carousel's chat box
  const createCarousel = async (prompt?: string) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/carousels', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (res.status === 402) {
        // The plan's monthly carousel limit is used up
        setIsCreating(false);
        if (confirm(`${data?.error ?? t.limitReached}\n\n${t.seePlans}`)) router.push('/billing');
        return;
      }
      if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
      router.push(`/carousel?id=${data.id}${prompt ? `&prompt=${encodeURIComponent(prompt)}` : ''}`);
    } catch (err) {
      setIsCreating(false);
      alert(err instanceof Error ? err.message : t.createFailed);
    }
  };

  const deleteCarousel = async (carousel: CarouselMeta) => {
    if (!confirm(t.confirmDelete(carousel.title || t.untitled))) return;
    const res = await fetch(`/api/carousels/${carousel.id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert(t.deleteFailed);
      return;
    }
    setCarousels(prev => prev?.filter(item => item.id !== carousel.id) ?? null);
  };

  const newButton = (
    <button onClick={() => createCarousel()} disabled={isCreating} className="btn-primary self-start sm:self-auto disabled:opacity-60">
      {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
      {t.newCarousel}
    </button>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeading title={t.title} sub={t.sub} action={carousels?.length ? newButton : undefined} />

      {error && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{error}</p>}

      {!error && carousels === null && (
        <div className="flex items-center gap-2 text-sm text-graphite"><Loader2 size={16} className="animate-spin" /> {appMessages[locale].shell.loading}</div>
      )}

      {carousels?.length === 0 && (
        <div className="rounded-2xl bg-lime p-8 sm:p-12 lg:p-16 grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-end">
          <div>
            <h2 className="font-display font-bold text-6xl sm:text-7xl lg:text-8xl leading-[0.88]">
              {t.emptyTitle.before}
              <span className="underline decoration-[0.06em] underline-offset-[0.12em] whitespace-nowrap">{t.emptyTitle.marked}</span>
            </h2>
            <p className="mt-6 text-lg max-w-md">{t.emptyBody}</p>
            <button onClick={() => createCarousel()} disabled={isCreating} className="btn-primary mt-8 text-base px-6 py-3.5 disabled:opacity-60">
              {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {t.newCarousel}
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">{t.emptyIdeas}</p>
            <ul className="space-y-2">
              {t.ideas.map(idea => (
                <li key={idea}>
                  <button
                    onClick={() => createCarousel(idea)}
                    disabled={isCreating}
                    className="w-full text-start rounded-xl bg-paper px-4 py-3.5 border border-ink/10 hover:border-ink transition-colors"
                  >
                    {idea}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {carousels && carousels.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {carousels.map(carousel => {
            const title = carousel.title || t.untitled;
            return (
              <div key={carousel.id} className="group min-w-0">
                <button
                  onClick={() => router.push(`/carousel?id=${carousel.id}`)}
                  aria-label={title}
                  className="relative block w-full aspect-[4/5] rounded-xl overflow-hidden bg-paper border border-line group-hover:border-ink transition-colors"
                >
                  <Thumbnail carousel={carousel} t={t} />
                </button>
                <div className="flex items-start justify-between gap-2 mt-3">
                  <button onClick={() => router.push(`/carousel?id=${carousel.id}`)} className="min-w-0 text-start">
                    <p className="font-semibold truncate" dir="auto">{title}</p>
                    <p className="text-sm text-graphite">
                      {t.slides(carousel.slideCount)} · {t.edited(timeAgo(carousel.updatedAt, locale, t.justNow))}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteCarousel(carousel)}
                    title={t.delete}
                    aria-label={`${t.delete}: ${title}`}
                    className="p-1.5 -m-1 rounded-lg text-graphite hover:text-red-700 hover:bg-mist md:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function Gallery({ user }: { user: PublicUser }) {
  return <AppShell user={user} active="carousels">{locale => <CarouselGrid locale={locale} />}</AppShell>;
}
