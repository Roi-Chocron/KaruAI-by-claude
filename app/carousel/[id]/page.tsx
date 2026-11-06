import App from '../../../karuai_dashboard';

export default async function CarouselPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <App carouselId={id} />;
}
