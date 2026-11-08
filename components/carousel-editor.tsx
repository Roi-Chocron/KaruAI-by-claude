'use client';

// The editor is the standalone page in public/advanced_dashboard_editor.html; it loads and autosaves
// the carousel given by ?id=
export default function App({ carouselId }: { carouselId: string }) {
  return (
    <iframe
      title="KaruAI Editor"
      src={`/advanced_dashboard_editor.html?id=${encodeURIComponent(carouselId)}`}
      className="block h-screen w-screen border-0"
    />
  );
}
