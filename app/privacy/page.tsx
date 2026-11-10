import Link from 'next/link';
import { LegalPage } from '@/components/legal-page';

export const metadata = {
  title: 'Privacy Policy - KaruAI',
  description: 'Privacy Policy and data protection standards for KaruAI users.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 2026">

      <section>
        <h2>1. Overview</h2>
        <p>
          At <strong>KaruAI</strong>, we respect your privacy and are committed to protecting personal data. This Privacy Policy describes how we collect, store, and process information when you use our platform.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite pl-2">
          <li>
            <strong>Account Details:</strong> When you sign in with Google we receive your name, email address, profile picture and Google account ID. We never see or store a password.
          </li>
          <li>
            <strong>User Content:</strong> Your prompts, carousel slides and text, uploaded images, generated images, and the editing and conversation history of each carousel.
          </li>
          <li>
            <strong>Usage Data:</strong> How many carousels, AI messages and AI images you use each month, and the AI tokens they consume, so we can apply your plan&apos;s limits.
          </li>
          <li>
            <strong>Technical Information:</strong> Your IP address (used for rate limiting and security), browser type, and the session cookie that keeps you signed in.
          </li>
          <li>
            <strong>Analytics:</strong> Only if you accept analytics cookies: how you use the site (page views, clicks and, in production, masked session recordings).
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Information</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite pl-2">
          <li>To provide the AI carousel generator: designing slides from your prompts and generating images.</li>
          <li>To manage your account and sessions and protect the service against abuse.</li>
          <li>To apply the limits of your plan and, once payments are available, to manage your subscription.</li>
          <li>To answer support requests.</li>
          <li>With your consent, to understand how KaruAI is used and improve it.</li>
        </ul>
      </section>

      <section>
        <h2>4. Service Providers</h2>
        <p>
          We never sell or rent your personal information. We share data only with providers that run parts of the service for us:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-graphite pl-2">
          <li><strong>Cloudflare</strong> hosts the application and stores your account and carousels.</li>
          <li><strong>Google</strong> handles sign-in, and its Gemini API receives your prompts and current carousel to design the slides.</li>
          <li><strong>Pollinations.ai</strong> receives the image descriptions (not your account details) to generate slide images.</li>
          <li><strong>Sentry</strong> receives error reports so we can fix problems.</li>
          <li><strong>PostHog, Google Analytics and Microsoft Clarity</strong> receive usage analytics, only if you accept analytics cookies.</li>
          <li>A payment provider will process payments once paid plans open; we will never store full card numbers.</li>
        </ul>
      </section>

      <section>
        <h2>5. Data Security and Retention</h2>
        <p>
          All traffic is encrypted with HTTPS. Session cookies are HttpOnly and only a hash of each session token is stored. We keep your data while your account exists; daily usage records are deleted after a year. When you delete your account, your carousels and images are deleted too.
        </p>
      </section>

      <section>
        <h2>6. Your Rights</h2>
        <p>
          You can download all your data and delete your account at any time on the <Link href="/account" className="underline">Account</Link> page, and change your cookie choices on the <Link href="/cookies" className="underline">Cookie Policy</Link> page. For corrections or any other request, contact us.
        </p>
      </section>

      <section>
        <h2>7. Contact Us</h2>
        <p>
          For any questions regarding this Privacy Policy, please email us at <strong>privacy@karuai.com</strong>.
        </p>
      </section>
    </LegalPage>
  );
}
