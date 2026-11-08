import { notFound, redirect } from 'next/navigation';
import CarouselEditor from '@/components/carousel-editor';
import { getCurrentUser } from '@/lib/auth';
import { getOwnedCarousel } from '@/lib/carousel-store';

export default async function CarouselPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/carousel/${id}`)}`);
  try {
    getOwnedCarousel(id, user);
  } catch {
    notFound();
  }
  return <CarouselEditor carouselId={id} />;
}
