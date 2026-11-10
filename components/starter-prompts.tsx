'use client';

import { Sparkles } from 'lucide-react';

// Example prompts for a new user's empty gallery. Picking one creates a carousel and opens the editor with the
// prompt already typed into the chat (not sent), so the user can change it first.
export const STARTER_PROMPTS = [
  '5 tips for better sleep, in a calm night-sky style',
  'Launch announcement for a new coffee shop opening this Friday',
  'The 4 biggest mistakes first-time home buyers make',
  'A weekly meal-prep plan for busy parents, bright and friendly',
];

export default function StarterPrompts({ onPick, disabled }: { onPick: (prompt: string) => void; disabled?: boolean }) {
  return (
    <section aria-labelledby="starter-prompts-heading" className="mt-8 text-left max-w-xl mx-auto">
      <h2 id="starter-prompts-heading" className="text-sm font-semibold text-slate-700 mb-3 text-center">
        Or start from an example
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {STARTER_PROMPTS.map(prompt => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onPick(prompt)}
              disabled={disabled}
              className="w-full h-full flex items-start gap-2 text-left text-sm text-slate-700 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-60 transition-colors"
            >
              <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
