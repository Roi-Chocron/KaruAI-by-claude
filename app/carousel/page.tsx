'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CarouselEditor from '@/components/carousel-editor';
import { RequireAuth } from '@/lib/session';

// /carousel?id=<id>[&prompt=<text>]. The editor itself loads the carousel and shows a message when it is not the user's.
function Editor() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const prompt = params.get('prompt') ?? undefined;
  return <RequireAuth>{() => <CarouselEditor carouselId={id} prompt={prompt} />}</RequireAuth>;
}

export default function CarouselPage() {
  return (
    <Suspense fallback={null}>
      <Editor />
    </Suspense>
  );
}
