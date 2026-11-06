'use client';

// The dashboard is the standalone editor in public/advanced_dashboard_editor.html
export default function App() {
  return (
    <iframe
      title="KaruAI Dashboard"
      src="/advanced_dashboard_editor.html"
      className="block h-screen w-screen border-0"
    />
  );
}
