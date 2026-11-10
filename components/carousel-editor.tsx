'use client';

// The editor is the standalone page in public/advanced_dashboard_editor.html; it loads and autosaves
// the carousel given by ?id=. A `prompt` is typed into its chat (not sent) when the chat is still empty.
export default function App({ carouselId, prompt }: { carouselId: string; prompt?: string }) {
  const params = new URLSearchParams({ id: carouselId });
  if (prompt) params.set('prompt', prompt);
  return (
    <iframe
      title="KaruAI Editor"
      src={`/advanced_dashboard_editor.html?${params}`}
      className="block h-screen w-screen border-0"
    />
  );
}
