import { ProtectedBillingPage } from '@/components/billing';

export const metadata = {
  title: 'Billing & Subscription - KaruAI',
  description: 'Manage your plan, billing history, and payment methods.',
};

export default function BillingRoute() {
  return <ProtectedBillingPage />;
}
