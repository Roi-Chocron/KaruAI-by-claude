import { NotFoundPage } from '@/components/not-found-page';

// The English title is in the static HTML; the page switches it to Hebrew in the browser when needed
export const metadata = { title: 'Page not found - KaruAI' };

export default function NotFound() {
  return <NotFoundPage />;
}
