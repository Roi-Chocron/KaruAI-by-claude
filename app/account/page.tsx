import { ProtectedAccountPage } from '@/components/account';

// The static page carries the English title; the page renames the tab in the visitor's language once it loads
export const metadata = { title: 'Account - KaruAI' };

export default function AccountRoute() {
  return <ProtectedAccountPage />;
}
