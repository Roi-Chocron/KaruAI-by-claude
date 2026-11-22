import Link from 'next/link';
import { BusinessValue, EmailLink, Registration } from '@/components/business';
import { BUSINESS } from '@/shared/business';
import { LegalPage, legalMetadata } from '@/components/legal-page';

export const metadata = legalMetadata('en', '/terms', 'Terms of Service - KaruAI', 'Terms of Service for using the KaruAI platform and AI carousel generation services.');

export default function TermsPage() {
  return (
    <LegalPage path="/terms" title="Terms of Service" updated="November 2026">

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          Welcome to <strong>KaruAI</strong> ("Service", "Platform", "we", "us"), operated by <BusinessValue value={BUSINESS.legalName} missing="business name" /> (<Registration locale="en" />), <BusinessValue value={BUSINESS.address} missing="business address" />. By accessing, registering, or using our website and AI design generation services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Account Registration & Security</h2>
        <p>
          To use the platform you sign in with a Google account. You are responsible for keeping that Google account secure and for all activities that occur under your KaruAI account. We may suspend accounts that abuse the service or break these terms.
        </p>
      </section>

      <section>
        <h2>3. Acceptable Use Policy</h2>
        <p>
          You agree to use KaruAI only for lawful purposes. You must not:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li>Generate, upload, or share content that is abusive, defamatory, hateful, or pornographic.</li>
          <li>Attempt to reverse engineer, decompile, or compromise the platform's systems and API endpoints.</li>
          <li>Circumvent account limits, usage quotas, or create automated bot accounts to exploit free allowances.</li>
          <li>Infringe upon the intellectual property, copyright, or trademark rights of any third party.</li>
        </ul>
      </section>

      <section>
        <h2>4. Intellectual Property & Content Ownership</h2>
        <p>
          All rights, titles, and interests in the KaruAI platform, code, branding, logos, and UI components remain our exclusive property. As between you and KaruAI, you retain ownership of the text prompts and carousels you create, subject to compliance with applicable AI model licensing terms.
        </p>
      </section>

      <section>
        <h2>5. Subscriptions & Payments</h2>
        <p>
          We provide a free plan and paid subscription plans (Basic, Pro, VIP). Paid plans are priced in Israeli shekels, including VAT, and billed in advance every month until you cancel. Payments are processed by Polar (polar.sh), which sells the subscription to you as our reseller and merchant of record. You can cancel at any time, including on the <Link href="/cancel">Cancel subscription</Link> page; within 14 days of your first payment you get your money back minus the days you used. The full terms are in our <Link href="/refund">Cancellation & Refund Policy</Link>.
        </p>
      </section>

      <section>
        <h2>6. Disclaimer of Warranties</h2>
        <p>
          The service is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for high performance and uptime, we make no representations or warranties that the service will be uninterrupted or error-free. AI-generated results may occasionally vary or contain inaccuracies, and you are responsible for reviewing output prior to publishing.
        </p>
      </section>

      <section>
        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these terms at any time. Continued use of the platform after any such modifications constitutes your acceptance of the new terms.
        </p>
      </section>

      <section>
        <h2>8. Contact Information</h2>
        <p>
          If you have any questions or feedback regarding these Terms, please contact us at <EmailLink email={BUSINESS.supportEmail} missing="support email" />.
        </p>
      </section>
    </LegalPage>
  );
}
