'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CarouselEditor from '@/components/carousel-editor';
import { RequireAuth } from '@/lib/session';

// /carousel?id=<id>. The editor itself loads the carousel and shows a message when it is not the user's.
function Editor() {
  const id = useSearchParams().get('id') ?? '';
  return <RequireAuth>{() => <CarouselEditor carouselId={id} />}</RequireAuth>;
}

export default function CarouselPage() {
  return (
    <Suspense fallback={null}>
      <Editor />
    </Suspense>
  );
}
