"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Replaces the root layout when it fails, so it can't count on the site's stylesheet or fonts: inline styles only
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const button = { font: "600 15px system-ui, sans-serif", padding: "12px 20px", borderRadius: 10, cursor: "pointer" };

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", background: "#FFFFFF", color: "#0A0A0A", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
          <h1 style={{ fontSize: 48, lineHeight: 1, margin: 0, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Something broke on <span style={{ background: "#C8F135", padding: "0 6px", borderRadius: 6 }}>our side.</span>
          </h1>
          <p style={{ color: "#525252", fontSize: 18, lineHeight: 1.5 }}>We&apos;ve been notified. Try again, and if it keeps happening, reload the page.</p>
          <p dir="rtl" lang="he" style={{ color: "#525252", fontSize: 18, lineHeight: 1.5 }}>משהו נשבר אצלנו וקיבלנו על זה התראה. נסו שוב, ואם זה חוזר, טענו את הדף מחדש.</p>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button onClick={reset} style={{ ...button, background: "#0A0A0A", color: "#FFFFFF", border: "none" }}>Try again · נסו שוב</button>
            <button onClick={() => window.location.reload()} style={{ ...button, background: "#FFFFFF", color: "#0A0A0A", border: "1px solid #0A0A0A" }}>Reload · טעינה מחדש</button>
          </div>
        </main>
      </body>
    </html>
  );
}
