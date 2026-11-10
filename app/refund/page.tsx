import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';

export const metadata = {
  title: 'Refund & Cancellation Policy - KaruAI',
  description: 'Cancellation and refund terms for subscriptions and purchases on KaruAI.',
};

export default function RefundPage() {
  return (
    <LegalPage title="Cancellation & Refund Policy" updated="November 2026">

      <section>
        <h2>1. Subscription Cancellation</h2>
        <p>
          You can cancel your recurring monthly or annual subscription at any time directly through your <Link href="/billing">Billing & Subscription</Link> dashboard or by contacting customer support.
        </p>
        <p>
          Upon cancellation:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-graphite pl-2">
          <li>Automatic renewal charges will immediately cease for all subsequent cycles.</li>
          <li>You will retain full access to paid plan features until the end of your current active billing cycle.</li>
          <li>After the billing period ends, your account will downgrade to the free Starter plan, preserving all your previous carousels.</li>
        </ul>
      </section>

      <section>
        <h2>2. Refund Eligibility</h2>
        <p>
          Because KaruAI provides instant computational resources and AI image generation upon signup:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-graphite pl-2">
          <li>
            <strong>Monthly Plans:</strong> Monthly subscription fees are non-refundable once the billing period has commenced and generations have occurred.
          </li>
          <li>
            <strong>Annual Plans:</strong> If you cancel an annual plan within the first 14 days of purchase, you are eligible for a prorated refund (minus the standard one-month fee for resources consumed).
          </li>
          <li>
            <strong>Technical Issues:</strong> If a persistent technical defect on our end completely prevents you from using the service, we will evaluate your case for a full or partial refund.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How to Request a Refund</h2>
        <p>
          To submit a cancellation or refund inquiry:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-graphite pl-2">
          <li>Send an email to <strong>support@karuai.com</strong> with the subject "Refund Request".</li>
          <li>Provide your registered account email and invoice or transaction ID.</li>
          <li>Our support team will review and reply within 1–2 business days.</li>
        </ul>
      </section>

      <section>
        <h2>4. Processing Time</h2>
        <p>
          Approved refunds are credited back to the original method of payment (credit card, debit card, or payment provider) within 5–10 business days depending on your bank's processing timelines.
        </p>
      </section>
    </LegalPage>
  );
}
