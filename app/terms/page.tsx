import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - KaruAI',
  description: 'Terms of Service for using the KaruAI platform and AI carousel generation services.',
};

export default function TermsPage() {
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
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500">
              Last updated: November 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p className="leading-relaxed text-slate-600">
              Welcome to <strong>KaruAI</strong> ("Service", "Platform", "we", "us"). By accessing, registering, or using our website and AI design generation services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Account Registration & Security</h2>
            <p className="leading-relaxed text-slate-600">
              To use the platform you sign in with a Google account. You are responsible for keeping that Google account secure and for all activities that occur under your KaruAI account. We may suspend accounts that abuse the service or break these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. Acceptable Use Policy</h2>
            <p className="leading-relaxed text-slate-600">
              You agree to use KaruAI only for lawful purposes. You must not:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
              <li>Generate, upload, or share content that is abusive, defamatory, hateful, or pornographic.</li>
              <li>Attempt to reverse engineer, decompile, or compromise the platform's systems and API endpoints.</li>
              <li>Circumvent account limits, usage quotas, or create automated bot accounts to exploit free allowances.</li>
              <li>Infringe upon the intellectual property, copyright, or trademark rights of any third party.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Intellectual Property & Content Ownership</h2>
            <p className="leading-relaxed text-slate-600">
              All rights, titles, and interests in the KaruAI platform, code, branding, logos, and UI components remain our exclusive property. As between you and KaruAI, you retain ownership of the text prompts and carousels you create, subject to compliance with applicable AI model licensing terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Subscriptions & Payments</h2>
            <p className="leading-relaxed text-slate-600">
              We provide free and premium subscription plans (Pro, Agency). Subscriptions are billed in advance on a recurring monthly or annual basis. For cancellation conditions and refund eligibility, please review our <Link href="/refund" className="text-blue-600 hover:underline">Refund & Cancellation Policy</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">6. Disclaimer of Warranties</h2>
            <p className="leading-relaxed text-slate-600">
              The service is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for high performance and uptime, we make no representations or warranties that the service will be uninterrupted or error-free. AI-generated results may occasionally vary or contain inaccuracies, and you are responsible for reviewing output prior to publishing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">7. Changes to Terms</h2>
            <p className="leading-relaxed text-slate-600">
              We reserve the right to modify or replace these terms at any time. Continued use of the platform after any such modifications constitutes your acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">8. Contact Information</h2>
            <p className="leading-relaxed text-slate-600">
              If you have any questions or feedback regarding these Terms, please contact us at <strong>support@karuai.com</strong>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
