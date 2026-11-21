'use client';

import { useEffect } from 'react';

// Names the browser tab in the visitor's language. The exported HTML carries the route's static (English) title, and
// Next writes it back into <head> after hydration or a client-side navigation, sometimes after this effect has run,
// so the title is put back whenever <head> changes while the page is open.
export function useTabTitle(title: string) {
  useEffect(() => {
    const apply = () => {
      if (document.title !== title) document.title = title;
      document.querySelectorAll('head title').forEach(el => {
        if (el.textContent !== title) el.textContent = title;
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);
}
