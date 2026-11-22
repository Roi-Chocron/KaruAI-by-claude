import Link from 'next/link';
import { LegalPage, legalMetadata } from '@/components/legal-page';
import { BusinessValue, EmailLink, PhoneLink, Registration } from '@/components/business';
import { BUSINESS } from '@/shared/business';

export const metadata = legalMetadata('en', '/contact', 'Contact us - KaruAI', 'How to reach KaruAI: email, phone and mail, for help with your account, billing, privacy or accessibility.');

// Every way to reach us, from shared/business.ts; missing details show as lime placeholders
export default function ContactPage() {
  const b = BUSINESS;
  return (
    <LegalPage path="/contact" title="Contact us" updated="November 2026" translated={false}>
      <section>
        <h2>How to reach us</h2>
        <p>We&apos;re happy to help with your account, a payment, a cancellation, privacy, accessibility or anything else.</p>
        <ul className="space-y-1.5 ps-2">
          <li><strong>Email:</strong> <EmailLink email={b.supportEmail} missing="support email" /></li>
          <li>
            <strong>Phone:</strong> <PhoneLink phone={b.phone} missing="phone number" />
            {' ('}<BusinessValue value={b.phoneHours} missing="phone hours" />{')'}
          </li>
          <li><strong>Mail:</strong> <BusinessValue value={b.address} missing="business address" /></li>
        </ul>
        <p>We reply <BusinessValue value={b.replyTime} missing="reply time, e.g. within 2 business days" />.</p>
      </section>

      <section>
        <h2>Specific requests</h2>
        <ul className="space-y-1.5 ps-2">
          <li><strong>Cancel a subscription:</strong> <Link href="/cancel">cancel online</Link>, or by email, phone or mail as above.</li>
          <li><strong>Refunds:</strong> see our <Link href="/refund">refund policy</Link>.</li>
          <li><strong>Privacy and your data:</strong> <EmailLink email={b.privacyEmail} missing="privacy email" /></li>
          <li>
            <strong>Accessibility:</strong> our accessibility coordinator,{' '}
            <EmailLink email={b.accessibilityCoordinator.email ?? b.accessibilityEmail} missing="accessibility email" /> (see the{' '}
            <Link href="/accessibility">accessibility statement</Link>)
          </li>
          <li><strong>Legal notices:</strong> <EmailLink email={b.legalEmail} missing="legal email" /></li>
        </ul>
      </section>

      <section>
        <h2>Business details</h2>
        <ul className="space-y-1.5 ps-2">
          <li><strong>Business name:</strong> <BusinessValue value={b.legalName} missing="business name" /></li>
          <li>
            <strong>Registration:</strong>{' '}
            <Registration locale="en" />
          </li>
          <li><strong>Address:</strong> <BusinessValue value={b.address} missing="business address" /></li>
        </ul>
      </section>
    </LegalPage>
  );
}
