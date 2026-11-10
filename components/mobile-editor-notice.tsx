'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Monitor } from 'lucide-react';

const NARROW = '(max-width: 899px)';
const DISMISSED_KEY = 'karuai-mobile-editor-notice';

// The editor is built for a computer screen. On narrow screens this covers it with a short note; the user can
// go back to the gallery or continue anyway (remembered for this browser tab).
export default function MobileEditorNotice() {
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

  if (!show) return null;

  const continueAnyway = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {}
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-editor-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      dir="ltr"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <Monitor size={36} className="mx-auto mb-3 text-indigo-600" aria-hidden="true" />
        <h2 id="mobile-editor-notice-title" className="text-lg font-bold text-slate-900 mb-2">
          The editor works best on a computer
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Designing slides needs a bigger screen. Open this carousel on a laptop or desktop for the full editor.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Back to my carousels
          </Link>
          <button
            type="button"
            onClick={continueAnyway}
            autoFocus
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-gray-50"
          >
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
}
