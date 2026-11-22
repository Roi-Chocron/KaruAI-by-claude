import { LegalPage, legalMetadata } from '@/components/legal-page';
import { CancelSubscription } from '@/components/cancel-page';

export const metadata = legalMetadata('he', '/cancel', 'ביטול עסקה - KaruAI', 'ביטול המינוי ל־KaruAI באתר, במייל, בטלפון או בדואר, עם התחברות או בלי.');

export default function CancelPageHe() {
  return (
    <LegalPage locale="he" path="/cancel" title="ביטול עסקה" updated="נובמבר 2026" translated={false}>
      <CancelSubscription locale="he" />
    </LegalPage>
  );
}
