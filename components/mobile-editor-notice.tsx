'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Monitor } from 'lucide-react';
import { dirOf } from '@/lib/i18n';
import { useLocale } from '@/lib/locale';
import { editorMessages } from '@/messages/editor';

// The editor's own layout needs at least 1024px (below that it keeps that width and scrolls)
const NARROW = '(max-width: 1023px)';
const DISMISSED_KEY = 'karuai-mobile-editor-notice';

// The editor is built for a computer screen. On narrow screens this covers it with a short note; the user can
// go back to the gallery or continue anyway (remembered for this browser tab).
export default function MobileEditorNotice({ frameId }: { frameId: string }) {
  const locale = useLocale();
  const t = editorMessages[locale].notice;
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISSED_KEY) === '1';
    } catch {}
    if (dismissed) return;
    const query = window.matchMedia(NARROW);
    const update = () => setShow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // While the notice is up, the editor behind it can't be reached with the keyboard or a screen reader
  useEffect(() => {
    const frame = document.getElementById(frameId);
    frame?.toggleAttribute('inert', show);
    return () => frame?.removeAttribute('inert');
  }, [show, frameId]);

  const continueAnyway = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {}
    setShow(false);
  };

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') continueAnyway();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-editor-notice-title"
      aria-describedby="mobile-editor-notice-body"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 overflow-y-auto"
      dir={dirOf(locale)}
      lang={locale}
    >
      <div className="w-full max-w-sm rounded-2xl border border-ink bg-paper p-6 sm:p-8 text-ink">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-lime" aria-hidden="true">
          <Monitor size={24} />
        </span>
        <h2 id="mobile-editor-notice-title" className="font-display font-bold text-4xl leading-[0.95] mb-3">
          {t.title}
        </h2>
        <p id="mobile-editor-notice-body" className="text-[15px] leading-relaxed text-graphite mb-7">
          {t.body}
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/dashboard" className="btn-primary w-full">
            {t.back}
          </Link>
          <button type="button" onClick={continueAnyway} autoFocus className="btn-secondary w-full">
            {t.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
