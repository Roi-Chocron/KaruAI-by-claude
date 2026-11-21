'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import { appMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';

// Example prompts for a new user's empty gallery. Picking one creates a carousel and opens the editor with the
// prompt already typed into the chat (not sent), so the user can change it first.
export default function StarterPrompts({ locale, onPick, pending }: {
  locale: Locale;
  onPick: (prompt: string) => void;
  // The prompt whose carousel is being created, or true while a blank one is
  pending: string | boolean;
}) {
  const t = appMessages[locale].gallery.starter;
  return (
    <section aria-labelledby="starter-prompts-heading">
      <h3 id="starter-prompts-heading" className="font-semibold">{t.heading}</h3>
      <p id="starter-prompts-note" className="mt-1 mb-4 text-sm">{t.note}</p>
      <ul className="space-y-2">
        {t.prompts.map(prompt => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onPick(prompt)}
              disabled={pending !== false}
              aria-describedby="starter-prompts-note"
              className="group w-full min-h-12 flex items-center justify-between gap-3 text-start rounded-xl bg-paper px-4 py-3.5 border border-ink/10 hover:border-ink disabled:hover:border-ink/10 disabled:cursor-wait transition-colors"
            >
              <span>{prompt}</span>
              {pending === prompt ? (
                <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-graphite group-hover:text-ink group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 transition-transform"
                />
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
