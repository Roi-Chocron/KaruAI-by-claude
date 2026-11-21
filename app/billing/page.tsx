import { ProtectedBillingPage } from '@/components/billing';
import { appMessages } from '@/messages/app';

// The static HTML is English; the page switches the tab title to the visitor's language as soon as it runs
export const metadata = {
  title: `${appMessages.en.billing.title} - KaruAI`,
  description: 'Your KaruAI plan, this month’s usage and the other plans.',
};

export default function BillingRoute() {
  return <ProtectedBillingPage />;
}
