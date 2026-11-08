import { redirect } from 'next/navigation';
import BillingPage from '@/billing_subscription';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'Billing & Subscription - KaruAI',
  description: 'Manage your plan, billing history, and payment methods.',
};

export default async function BillingRoute() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/billing');
  }

  return <BillingPage />;
}
