'use client';

import { useLocale } from '@/lib/locale';
import { editorMessages } from '@/messages/editor';

// The editor is the standalone page in public/advanced_dashboard_editor.html; it loads and autosaves
// the carousel given by ?id= (and puts ?prompt= in the chat box of a new carousel)
export default function App({ carouselId, prompt, frameId }: { carouselId: string; prompt?: string | null; frameId?: string }) {
  const t = editorMessages[useLocale()];
  const params = new URLSearchParams({ id: carouselId });
  if (prompt) params.set('prompt', prompt);
  return (
    <iframe
      id={frameId}
      title={t.frameTitle}
      src={`/advanced_dashboard_editor.html?${params}`}
      className="block h-screen w-screen border-0"
    />
  );
}
