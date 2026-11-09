import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - KaruAI',
  description: 'Privacy Policy and data protection standards for KaruAI users.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" dir="ltr">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Karu<span className="text-blue-600">AI</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-100">
              <Shield className="w-4 h-4" />
              <span>Data Protection & Privacy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500">
              Last updated: November 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Overview</h2>
            <p className="leading-relaxed text-slate-600">
              At <strong>KaruAI</strong>, we respect your privacy and are committed to protecting personal data. This Privacy Policy describes how we collect, store, and process information when you use our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
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

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. How We Use Information</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
              <li>To provide the AI carousel generator: designing slides from your prompts and generating images.</li>
              <li>To manage your account and sessions and protect the service against abuse.</li>
              <li>To apply the limits of your plan and, once payments are available, to manage your subscription.</li>
              <li>To answer support requests.</li>
              <li>With your consent, to understand how KaruAI is used and improve it.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Service Providers</h2>
            <p className="leading-relaxed text-slate-600">
              We never sell or rent your personal information. We share data only with providers that run parts of the service for us:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
              <li><strong>Cloudflare</strong> hosts the application and stores your account and carousels.</li>
              <li><strong>Google</strong> handles sign-in, and its Gemini API receives your prompts and current carousel to design the slides.</li>
              <li><strong>Pollinations.ai</strong> receives the image descriptions (not your account details) to generate slide images.</li>
              <li><strong>Sentry</strong> receives error reports so we can fix problems.</li>
              <li><strong>PostHog, Google Analytics and Microsoft Clarity</strong> receive usage analytics, only if you accept analytics cookies.</li>
              <li>A payment provider will process payments once paid plans open; we will never store full card numbers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Data Security and Retention</h2>
            <p className="leading-relaxed text-slate-600">
              All traffic is encrypted with HTTPS. Session cookies are HttpOnly and only a hash of each session token is stored. We keep your data while your account exists; daily usage records are deleted after a year. When you delete your account, your carousels and images are deleted too.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">6. Your Rights</h2>
            <p className="leading-relaxed text-slate-600">
              You can download all your data and delete your account at any time on the <Link href="/account" className="text-blue-600 underline">Account</Link> page, and change your cookie choices on the <Link href="/cookies" className="text-blue-600 underline">Cookie Policy</Link> page. For corrections or any other request, contact us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">7. Contact Us</h2>
            <p className="leading-relaxed text-slate-600">
              For any questions regarding this Privacy Policy, please email us at <strong>privacy@karuai.com</strong>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
