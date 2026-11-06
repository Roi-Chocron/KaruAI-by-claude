import { notFound, redirect } from 'next/navigation';
import App from '../../../karuai_dashboard';
import { getCurrentUser } from '../../../karu_auth';
import { getOwnedCarousel } from '../../../carousel_store';

export default async function CarouselPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/carousel/${id}`)}`);
  try {
    getOwnedCarousel(id, user);
  } catch {
    notFound();
  }
  return <App carouselId={id} />;
}
