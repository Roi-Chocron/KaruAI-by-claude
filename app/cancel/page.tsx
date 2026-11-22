import { LegalPage, legalMetadata } from '@/components/legal-page';
import { CancelSubscription } from '@/components/cancel-page';

export const metadata = legalMetadata('en', '/cancel', 'Cancel subscription - KaruAI', 'Cancel your KaruAI subscription online, by email, by phone or by mail, with or without signing in.');

export default function CancelPage() {
  return (
    <LegalPage path="/cancel" title="Cancel subscription" updated="November 2026" translated={false}>
      <CancelSubscription locale="en" />
    </LegalPage>
  );
}
