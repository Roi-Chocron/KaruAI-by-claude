'use client';

// The editor is the standalone page in public/advanced_dashboard_editor.html; it loads and autosaves
// the carousel given by ?id= (and puts ?prompt= in the chat box of a new carousel)
export default function App({ carouselId, prompt }: { carouselId: string; prompt?: string | null }) {
  return (
    <iframe
      title="KaruAI Editor"
      src={`/advanced_dashboard_editor.html?id=${encodeURIComponent(carouselId)}${prompt ? `&prompt=${encodeURIComponent(prompt)}` : ''}`}
      className="block h-screen w-screen border-0"
    />
  );
}
