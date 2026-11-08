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
                <strong>Account Details:</strong> Email address, user name, and securely hashed passwords (using Scrypt).
              </li>
              <li>
                <strong>User Content:</strong> Prompts, carousel slide text, uploaded assets, and generated images stored in your workspace.
              </li>
              <li>
                <strong>Billing Data:</strong> Payment details are processed securely through accredited payment processors; we do not store full credit card numbers on our servers.
              </li>
              <li>
                <strong>Technical Information:</strong> IP address, browser type, device details, and authentication session cookies to maintain your login.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. How We Use Information</h2>
            <p className="leading-relaxed text-slate-600">
              We collect and use your data for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
              <li>To provide, operate, and maintain the AI carousel generator service.</li>
              <li>To manage your account, authenticate sessions, and protect against unauthorized access.</li>
              <li>To handle payments, issue invoices, and manage subscription tiers.</li>
              <li>To deliver technical support and respond to customer inquiries.</li>
              <li>To enhance platform performance, AI prompts, and user experience.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Sharing of Information</h2>
            <p className="leading-relaxed text-slate-600">
              We never sell or rent your personal information. We may share necessary data with trusted service providers strictly to perform essential operations (such as cloud hosting, AI model API inference, and payment processing), or if required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Data Security</h2>
            <p className="leading-relaxed text-slate-600">
              We implement industry-standard technical measures, including TLS/HTTPS encryption in transit and secure cryptographic hashing for passwords, to safeguard your information against unauthorized access, loss, or disclosure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">6. Your Rights</h2>
            <p className="leading-relaxed text-slate-600">
              You have the right to access your personal data, request corrections, or request deletion of your account and related carousels at any time by reaching out to our support team.
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
