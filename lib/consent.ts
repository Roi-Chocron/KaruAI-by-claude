'use client';

import { useEffect, useState } from 'react';

// The visitor's cookie choice: 'all' allows analytics and session replay, 'essential' only what the app needs
// to work (the session). null until they choose. Stored in a cookie for a year.
export type Consent = 'all' | 'essential';

const COOKIE = 'karu_consent';
const EVENT = 'karu-consent';

export function getConsent(): Consent | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find(part => part.startsWith(`${COOKIE}=`))?.split('=')[1];
  return value === 'all' || value === 'essential' ? value : null;
}

export function setConsent(consent: Consent | null) {
  document.cookie = consent
    ? `${COOKIE}=${consent}; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`
    : `${COOKIE}=; path=/; max-age=0`;
  window.dispatchEvent(new Event(EVENT));
}

export function useConsent(): Consent | null | undefined {
  // undefined until mounted, so the server-rendered HTML never shows the banner by mistake
  const [consent, setState] = useState<Consent | null | undefined>(undefined);
  useEffect(() => {
    const update = () => setState(getConsent());
    update();
    window.addEventListener(EVENT, update);
    return () => window.removeEventListener(EVENT, update);
  }, []);
  return consent;
}
