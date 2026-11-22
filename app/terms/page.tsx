import Link from 'next/link';
import { BusinessValue, EmailLink, Registration } from '@/components/business';
import { BUSINESS } from '@/shared/business';
import { LegalPage, legalMetadata } from '@/components/legal-page';

export const metadata = legalMetadata('en', '/terms', 'Terms of Service - KaruAI', 'The terms for using KaruAI: who may use it, your content and AI output, paid plans, cancellation, liability and the law that applies.');

// Drafted with the recommended defaults (no lawyer review yet, see TODO.md). For consumers in Israel the Hebrew
// version (app/he/terms) is the binding one.
export default function TermsPage() {
  return (
    <LegalPage path="/terms" title="Terms of Service" updated="November 2026" translated={false}>

      <section>
        <p className="text-sm text-graphite">
          For consumers in Israel, the <Link href="/he/terms" lang="he" hrefLang="he">Hebrew version of these terms</Link> is the binding one.
        </p>
      </section>

      <section>
        <h2>1. Who we are</h2>
        <p>
          <strong>KaruAI</strong> (&quot;we&quot;, &quot;us&quot;, &quot;the service&quot;) is operated by <BusinessValue value={BUSINESS.legalName} missing="business name" /> (<Registration locale="en" />),{' '}
          <BusinessValue value={BUSINESS.address} missing="business address" />. You can reach us at <EmailLink email={BUSINESS.supportEmail} missing="support email" /> or
          through the <Link href="/contact">contact page</Link>. By signing in or using KaruAI you agree to these terms; if you don&apos;t, please don&apos;t use it.
        </p>
      </section>

      <section>
        <h2>2. You must be 18 or older</h2>
        <p>KaruAI is for adults only. By signing in you confirm that you are at least 18 years old.</p>
      </section>

      <section>
        <h2>3. Your account</h2>
        <p>
          You sign in with your Google account, one account per person. You are responsible for keeping that Google account secure and for what happens in
          your KaruAI account. Tell us right away if you think someone else is using it.
        </p>
      </section>

      <section>
        <h2>4. The service</h2>
        <p>
          KaruAI writes and designs Instagram carousels with artificial intelligence and lets you edit and export them. What each plan includes, and its
          monthly limits, is on the <Link href="/#pricing">pricing section</Link> and your <Link href="/billing">Plan and billing</Link> page. We keep improving
          KaruAI and may change features; we work to keep it available, but it may sometimes be down for maintenance or because of a provider&apos;s outage.
        </p>
        <p>
          The AI features use Google Gemini (text and design) and Pollinations (images). While we use the free tier of Google&apos;s Gemini API, its terms
          don&apos;t allow serving users in the European Economic Area, the United Kingdom or Switzerland, so the AI features are not available there for
          now, and Google may use what you send to the AI to improve its products. Don&apos;t put personal, confidential or sensitive information in your
          requests.
        </p>
      </section>

      <section>
        <h2>5. Your content</h2>
        <p>
          What you write and upload (text, photos, logos) stays yours. You give us a licence to store, process and display it, and to send it to the AI
          providers named above, only so that we can run the service for you. You confirm that you have the rights to everything you upload, including the
          consent of people who appear in your photos.
        </p>
      </section>

      <section>
        <h2>6. AI output</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li>As far as the law allows, the slides, texts and images KaruAI creates for you are yours to use, including commercially.</li>
          <li>AI output may be similar to what others receive, and in some countries it may not be protected by copyright.</li>
          <li>
            AI can be wrong. Check facts, names, prices and claims before you publish, and make sure the content doesn&apos;t infringe anyone&apos;s
            trademark or show real people in a misleading way.
          </li>
          <li>Label AI-generated content where a platform or the law requires it (Instagram, for example, asks for this for realistic images).</li>
          <li>
            Images are made with the Z-Image Turbo model (Alibaba Tongyi) and, when it is unavailable, FLUX.1 [schnell] (Black Forest Labs), both under the
            Apache 2.0 licence, through Pollinations. We may change models.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. What you may not do</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li>Create sexual or pornographic content, content that sexualizes minors, or graphic violence.</li>
          <li>Create deepfakes, impersonate a real person or business, or use others&apos; logos and trademarks without the right to.</li>
          <li>Create content that is illegal, hateful, harassing, defamatory, deceptive or spam.</li>
          <li>Get around the plan limits or safety filters, run automated scripts against the service, resell access, or harm the service or other users.</li>
        </ul>
        <p>We block requests that break these rules, and we may suspend accounts that break them.</p>
      </section>

      <section>
        <h2>8. Paid plans</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li>
            Paid plans are sold by Polar (polar.sh), our reseller and merchant of record, which handles the payment, the receipt and the VAT. Your card
            statement shows Polar.
          </li>
          <li>Prices are in Israeli shekels and include VAT. A plan renews every month until you cancel.</li>
          <li>We will tell you about a price change by email at least 30 days before it applies to you; you can cancel before then.</li>
          <li>If a renewal payment fails, your plan stays for 7 days while the card is tried again, then moves to the free plan.</li>
          <li>
            You can cancel at any time, including on the <Link href="/cancel">Cancel subscription</Link> page. Cancellation and refunds follow our{' '}
            <Link href="/refund">Cancellation &amp; Refund Policy</Link>.
          </li>
        </ul>
      </section>

      <section>
        <h2>9. Suspension, termination and deletion</h2>
        <p>
          You can delete your account at any time on your <Link href="/account">Account</Link> page; a paid plan then ends with a refund of the unused days.
          We may suspend or close an account that breaks these terms or the law, and will tell you why unless the law forbids it. When an account is deleted
          we delete its carousels and images, except what the law requires us to keep.
        </p>
      </section>

      <section>
        <h2>10. Warranties and liability</h2>
        <p>
          KaruAI is provided &quot;as is&quot;. To the extent the law allows, we are not liable for indirect or consequential damage (such as lost profit or
          data), and our total liability for any claim is limited to what you paid us in the 12 months before it, or ₪100 if you use the free plan.
          Nothing in these terms limits rights that the law, including consumer protection law, does not allow to be limited.
        </p>
      </section>

      <section>
        <h2>11. Changes to these terms</h2>
        <p>
          We will tell you about a material change by email or in the app at least 30 days before it takes effect. If you don&apos;t agree, you can cancel
          and delete your account before then.
        </p>
      </section>

      <section>
        <h2>12. Law and courts</h2>
        <p>
          These terms are governed by the laws of the State of Israel. The courts of Tel Aviv-Jaffa have jurisdiction, without taking away a consumer&apos;s
          right to sue where the law allows them to.
        </p>
      </section>

      <section>
        <h2>13. Copyright and other notices</h2>
        <p>
          To report content that infringes your rights, or to send us a legal notice, write to <EmailLink email={BUSINESS.legalEmail} missing="legal email" />.
          KaruAI is not affiliated with, sponsored or endorsed by Instagram or Meta.
        </p>
      </section>
    </LegalPage>
  );
}
