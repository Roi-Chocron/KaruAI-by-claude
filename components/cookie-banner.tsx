'use client';

import Link from 'next/link';
import { setConsent, useConsent } from '@/lib/consent';

export function CookieBanner() {
  const consent = useConsent();
  if (consent !== null) return null;
  return (
    <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:max-w-md z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 text-sm text-slate-700" dir="ltr" role="dialog" aria-label="Cookie consent">
      <p className="mb-4">
        We use essential cookies to keep you signed in. With your consent we also use analytics cookies to understand how
        KaruAI is used and improve it. <Link href="/cookies" className="text-blue-600 underline">Cookie Policy</Link>
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setConsent('essential')} className="px-4 py-2 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50">
          Essential only
        </button>
        <button onClick={() => setConsent('all')} className="px-4 py-2 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700">
          Accept all
        </button>
      </div>
    </div>
  );
}

// Lets visitors change their mind (on the Cookie Policy page)
export function CookieSettingsButton() {
  return (
    <button onClick={() => setConsent(null)} className="px-4 py-2 rounded-xl font-semibold border border-slate-300 hover:bg-slate-50">
      Change cookie settings
    </button>
  );
}
