'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageOff, Loader2, Plus, Trash2, X } from 'lucide-react';
import { AppShell, PageHeading } from '@/components/app-shell';
import StarterPrompts from '@/components/starter-prompts';
import { appMessages, type AppMessages, type TimeUnit } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
import type { CarouselMeta, PublicUser } from '@/types';

const UNITS: [TimeUnit, number][] = [
  ['year', 365 * 24 * 3600], ['month', 30 * 24 * 3600], ['week', 7 * 24 * 3600],
  ['day', 24 * 3600], ['hour', 3600], ['minute', 60],
];

// "2 weeks ago", "yesterday", "לפני שבועיים", "אתמול"
function timeAgo(iso: string, t: AppMessages['gallery']) {
  // A clock running behind the server's would otherwise make it negative
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return t.ago(Math.round(seconds / size), unit);
  }
  return t.justNow;
}

const Thumbnail = ({ carousel, t }: { carousel: CarouselMeta; t: AppMessages['gallery'] }) => {
  const [failed, setFailed] = useState(false);
  if (carousel.slideCount === 0 || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-mist text-graphite">
        <ImageOff size={28} strokeWidth={1.5} aria-hidden="true" />
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

// A modal in the page's language and direction (the browser's confirm() is neither); Escape or Cancel closes it
function Dialog({ title, body, busy = false, onClose, children }: {
  title: string;
  body: string;
  // While true (a delete in flight) Escape and clicks outside are ignored
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={event => busy && event.preventDefault()}
      onClick={event => event.target === ref.current && !busy && onClose()}
      aria-labelledby="gallery-dialog-title"
      aria-describedby="gallery-dialog-body"
      className="w-[calc(100%-2rem)] max-w-md rounded-2xl bg-paper text-ink p-0 shadow-2xl backdrop:bg-ink/40"
    >
      <div className="p-6 sm:p-8">
        <h2 id="gallery-dialog-title" className="font-display font-bold text-3xl leading-none">{title}</h2>
        <p id="gallery-dialog-body" className="mt-4 text-graphite break-words" dir="auto">{body}</p>
        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">{children}</div>
      </div>
    </dialog>
  );
}

type Prompt = { kind: 'delete'; carousel: CarouselMeta } | { kind: 'limit'; limit?: number };

function CarouselGrid({ locale }: { locale: Locale }) {
  const t = appMessages[locale].gallery;
  const router = useRouter();
  const [carousels, setCarousels] = useState<CarouselMeta[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // What a failed create or delete says, until it is dismissed or the next try
  const [actionError, setActionError] = useState<string | null>(null);
  // The starter prompt being created from, or true for a blank carousel
  const [creating, setCreating] = useState<string | boolean>(false);
  const [dialog, setDialog] = useState<Prompt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/carousels')
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data?.carousels)) throw new Error(data?.error || `Request failed with status ${res.status}`);
        setCarousels(data.carousels);
      })
      .catch(err => {
        console.error('Loading the carousels failed:', err);
        setLoadFailed(true);
      });
  }, []);

  // With a prompt (one of the empty gallery's examples) the editor opens with it typed into the chat
  const createCarousel = async (prompt?: string) => {
    if (creating !== false) return;
    setCreating(prompt ?? true);
    setActionError(null);
    try {
      const res = await fetch('/api/carousels', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (res.status === 402) {
        // The plan's monthly carousel limit is used up
        setCreating(false);
        setDialog({ kind: 'limit', limit: typeof data?.limit === 'number' ? data.limit : undefined });
        return;
      }
      if (!res.ok || !data?.id) throw new Error(data?.error || `Request failed with status ${res.status}`);
      router.push(`/carousel?id=${data.id}${prompt ? `&prompt=${encodeURIComponent(prompt)}` : ''}`);
    } catch (err) {
      console.error('Creating a carousel failed:', err);
      setCreating(false);
      setActionError(t.createFailed);
    }
  };

  const deleteCarousel = async (carousel: CarouselMeta) => {
    setIsDeleting(true);
    setActionError(null);
    const res = await fetch(`/api/carousels/${carousel.id}`, { method: 'DELETE' }).catch(() => null);
    setIsDeleting(false);
    setDialog(null);
    if (!res?.ok) {
      setActionError(t.deleteFailed);
      return;
    }
    setCarousels(prev => prev?.filter(item => item.id !== carousel.id) ?? null);
  };

  const newButton = (
    <button onClick={() => createCarousel()} disabled={creating !== false} className="btn-primary self-start sm:self-auto disabled:opacity-60 disabled:cursor-wait">
      {creating === true ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
      {creating === true ? t.creating : t.newCarousel}
    </button>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <PageHeading title={t.title} sub={t.sub} action={carousels?.length ? newButton : undefined} />

      {actionError && (
        <div role="alert" className="mb-8 flex items-start justify-between gap-3 text-sm text-red-700 border border-red-700 rounded-xl ps-4 pe-2 py-2">
          <p className="py-2">{actionError}</p>
          <button onClick={() => setActionError(null)} aria-label={t.dismiss} title={t.dismiss} className="shrink-0 grid place-items-center h-9 w-9 rounded-lg hover:bg-red-50">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {loadFailed && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{t.loadFailed}</p>}

      {!loadFailed && carousels === null && (
        <div role="status" className="flex items-center gap-2 text-sm text-graphite">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {appMessages[locale].shell.loading}
        </div>
      )}

      {carousels?.length === 0 && (
        <div className="rounded-2xl bg-lime p-6 sm:p-12 lg:p-16 grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-end">
          <div>
            <h2 className="font-display font-bold text-5xl sm:text-7xl lg:text-8xl leading-[0.88] break-words">
              {t.emptyTitle.before}
              <span className="underline decoration-[0.06em] underline-offset-[0.12em] sm:whitespace-nowrap">{t.emptyTitle.marked}</span>
            </h2>
            <p className="mt-6 text-lg max-w-md">{t.emptyBody}</p>
            <button onClick={() => createCarousel()} disabled={creating !== false} className="btn-primary mt-8 text-base px-6 py-3.5 disabled:opacity-60 disabled:cursor-wait">
              {creating === true ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
              {creating === true ? t.creating : t.newCarousel}
            </button>
          </div>
          <StarterPrompts locale={locale} onPick={createCarousel} pending={creating} />
        </div>
      )}

      {carousels && carousels.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-8">
          {carousels.map(carousel => {
            const title = carousel.title || t.untitled;
            const href = `/carousel?id=${carousel.id}`;
            return (
              <li key={carousel.id} className="group min-w-0">
                {/* The title below is the link screen readers and the keyboard use; the picture is a second target for the mouse */}
                <Link
                  href={href}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="relative block w-full aspect-[4/5] rounded-xl overflow-hidden bg-paper border border-line group-hover:border-ink transition-colors"
                >
                  <Thumbnail carousel={carousel} t={t} />
                </Link>
                <div className="flex items-start justify-between gap-1 mt-3">
                  <Link href={href} className="min-w-0 text-start rounded-md">
                    <span className="block font-semibold truncate" dir="auto">{title}</span>
                    <span className="block text-sm text-graphite">
                      {/* On a narrow card it breaks at the dot, not inside "2 weeks ago" */}
                      <span className="whitespace-nowrap">{t.slides(carousel.slideCount)}</span>
                      {' · '}
                      <span className="whitespace-nowrap">{t.edited(timeAgo(carousel.updatedAt, t))}</span>
                    </span>
                  </Link>
                  <button
                    onClick={() => setDialog({ kind: 'delete', carousel })}
                    title={t.delete}
                    aria-label={t.deleteNamed(title)}
                    className="shrink-0 grid place-items-center h-10 w-10 -mt-2 -me-2 rounded-lg text-graphite hover:text-red-700 hover:bg-mist [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog?.kind === 'delete' && (
        <Dialog title={t.confirmDeleteTitle} body={t.confirmDelete(dialog.carousel.title || t.untitled)} busy={isDeleting} onClose={() => setDialog(null)}>
          <button onClick={() => setDialog(null)} disabled={isDeleting} className="btn-secondary">{t.cancel}</button>
          <button onClick={() => deleteCarousel(dialog.carousel)} disabled={isDeleting} className="btn bg-red-700 text-paper hover:bg-red-800 disabled:opacity-60 disabled:cursor-wait">
            {isDeleting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {isDeleting ? t.deleting : t.delete}
          </button>
        </Dialog>
      )}

      {dialog?.kind === 'limit' && (
        <Dialog title={t.limitTitle} body={t.limitReached(dialog.limit)} onClose={() => setDialog(null)}>
          <button onClick={() => setDialog(null)} className="btn-secondary">{t.cancel}</button>
          <Link href="/billing" className="btn-primary">{t.seePlans}</Link>
        </Dialog>
      )}
    </main>
  );
}

export default function Gallery({ user }: { user: PublicUser }) {
  return <AppShell user={user} active="carousels">{locale => <CarouselGrid locale={locale} />}</AppShell>;
}
