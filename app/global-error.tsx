"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, type CSSProperties } from "react";

// Replaces the root layout when it fails, so it can't count on the site's stylesheet, fonts or the visitor's
// language: inline styles only, and both languages on the page (English, then Hebrew laid out right-to-left)
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

  const heading: CSSProperties = { fontSize: "clamp(32px, 8vw, 48px)", lineHeight: 1.05, margin: 0, fontWeight: 800, letterSpacing: "-0.02em" };
  const marker: CSSProperties = { background: "#C8F135", padding: "0 6px", borderRadius: 6, whiteSpace: "nowrap" };
  const text: CSSProperties = { color: "#525252", fontSize: 18, lineHeight: 1.5, margin: "16px 0 0" };
  const button: CSSProperties = { font: "600 15px system-ui, sans-serif", minHeight: 44, padding: "10px 20px", borderRadius: 10, cursor: "pointer", flex: "1 1 auto" };

  return (
    <html lang="en" dir="ltr">
      <head>
        <title>Something went wrong · משהו השתבש - KaruAI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", background: "#FFFFFF", color: "#0A0A0A", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ boxSizing: "border-box", width: "100%", maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
          <section lang="en" dir="ltr">
            <h1 style={heading}>
              Something broke on <span style={marker}>our side.</span>
            </h1>
            <p style={text}>We&apos;ve been notified. Try again, and if it keeps happening, reload the page.</p>
          </section>
          <section lang="he" dir="rtl" style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #E5E5E5" }}>
            <h2 style={heading}>
              משהו נשבר <span style={marker}>אצלנו.</span>
            </h2>
            <p style={text}>קיבלנו על זה התראה. נסו שוב, ואם זה חוזר, טענו את הדף מחדש.</p>
          </section>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
            <button type="button" onClick={reset} style={{ ...button, background: "#0A0A0A", color: "#FFFFFF", border: "1px solid #0A0A0A" }}>
              Try again · <span lang="he">נסו שוב</span>
            </button>
            <button type="button" onClick={() => window.location.reload()} style={{ ...button, background: "#FFFFFF", color: "#0A0A0A", border: "1px solid #0A0A0A" }}>
              Reload · <span lang="he">טעינה מחדש</span>
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
