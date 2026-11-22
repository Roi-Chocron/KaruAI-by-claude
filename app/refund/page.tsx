import Link from 'next/link';
import { BusinessValue, EmailLink, PhoneLink } from '@/components/business';
import { BUSINESS } from '@/shared/business';
import { LegalPage, legalMetadata } from '@/components/legal-page';
import { PLANS } from '@/shared/plans';

export const metadata = legalMetadata('en', '/refund', 'Cancellation & Refund Policy - KaruAI', 'How to cancel a KaruAI subscription, when you get money back, and what happens to your account after a plan ends.');

// Follows the Israeli Consumer Protection Law (sections 13ד, 14ג, 14ה and 14ט). For consumers in Israel the Hebrew
// version (app/he/refund) is the binding one.
export default function RefundPage() {
  const free = PLANS.free.limits;
  return (
    <LegalPage path="/refund" title="Cancellation & Refund Policy" updated="November 2026" translated={false}>

      <section>
        <p className="text-sm text-graphite">
          For consumers in Israel, the <Link href="/he/refund" lang="he" hrefLang="he">Hebrew version of this policy</Link> is the binding one.
        </p>
      </section>

      <section>
        <h2>1. Cancel at any time, in any of these ways</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li><strong>Online:</strong> on the <Link href="/cancel">Cancel subscription</Link> page, with or without signing in, or under &quot;Manage subscription&quot; on your <Link href="/billing">Plan and billing</Link> page.</li>
          <li><strong>Email:</strong> <EmailLink email={BUSINESS.supportEmail} missing="support email" /></li>
          <li><strong>Phone:</strong> <PhoneLink phone={BUSINESS.phone} missing="phone number" /></li>
          <li><strong>Mail:</strong> <BusinessValue value={BUSINESS.address} missing="business address" /></li>
        </ul>
        <p>
          When you cancel by email, phone or mail, tell us your name and the email address of your KaruAI account (your ID number helps us find it). We stop
          the charges within 3 business days of receiving the request and confirm the cancellation in writing. Online cancellation takes effect at once.
        </p>
      </section>

      <section>
        <h2>2. Within 14 days of your first payment</h2>
        <p>
          You may cancel within 14 days of the day you subscribed and get your payment back, minus the value of the days you already used. We don&apos;t
          charge a cancellation fee.
        </p>
      </section>

      <section>
        <h2>3. After the first 14 days</h2>
        <p>You choose one of these:</p>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li><strong>Cancel at the end of the period:</strong> you keep your plan until the end of the month you paid for and you are not charged again.</li>
          <li><strong>End now:</strong> your plan ends right away and you get back the part of the current month you haven&apos;t used, in proportion to the days left.</li>
        </ul>
        <p>If a fault on our side keeps you from using KaruAI, tell us and we will refund the time you couldn&apos;t use it.</p>
      </section>

      <section>
        <h2>4. How and when you get the money</h2>
        <p>
          Payments are handled by Polar (polar.sh), our reseller and merchant of record, so the charge on your card shows Polar. Refunds go back to the card
          you paid with within 14 days of the cancellation; your bank may take a few more days to show them.
        </p>
      </section>

      <section>
        <h2>5. After a paid plan ends</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li>Your account moves to the free plan: {free.carouselsPerMonth} new carousels, {free.aiMessagesPerMonth} AI messages and {free.aiImagesPerMonth} AI images a month.</li>
          <li>New exports carry the small KaruAI watermark again.</li>
          <li>All your carousels stay in your account, and you can still open, edit and export them.</li>
        </ul>
      </section>

      <section>
        <h2>6. Questions</h2>
        <p>
          Write to <EmailLink email={BUSINESS.supportEmail} missing="support email" /> or see the <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
