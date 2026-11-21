'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CarouselEditor from '@/components/carousel-editor';
import MobileEditorNotice from '@/components/mobile-editor-notice';
import { useLocale } from '@/lib/locale';
import { RequireAuth } from '@/lib/session';
import { editorMessages } from '@/messages/editor';

const FRAME_ID = 'karu-editor-frame';

// /carousel?id=<id>[&prompt=<text>]. The editor itself loads the carousel and shows a message when it is not the
// user's; a `prompt` (from the gallery's ideas) is typed into the chat of a new carousel, not sent.
function Editor() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const locale = useLocale();
  // Until the editor names the tab after the carousel
  useEffect(() => {
    document.title = editorMessages[locale].tabTitle;
  }, [locale]);
  return (
    <RequireAuth>
      {() => (
        <>
          <CarouselEditor carouselId={id} prompt={params.get('prompt')} frameId={FRAME_ID} />
          <MobileEditorNotice frameId={FRAME_ID} />
        </>
      )}
    </RequireAuth>
  );
}

export default function CarouselPage() {
  return (
    <Suspense fallback={null}>
      <Editor />
    </Suspense>
  );
}
