import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy - KaruAI',
  description: 'Cancellation and refund terms for subscriptions and purchases on KaruAI.',
};

export default function RefundPage() {
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
              <RefreshCw className="w-4 h-4" />
              <span>Customer Satisfaction</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Cancellation & Refund Policy
            </h1>
            <p className="text-sm text-slate-500">
              Last updated: November 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Subscription Cancellation</h2>
            <p className="leading-relaxed text-slate-600">
              You can cancel your recurring monthly or annual subscription at any time directly through your <Link href="/billing" className="text-blue-600 hover:underline">Billing & Subscription</Link> dashboard or by contacting customer support.
            </p>
            <p className="leading-relaxed text-slate-600">
              Upon cancellation:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
              <li>Automatic renewal charges will immediately cease for all subsequent cycles.</li>
              <li>You will retain full access to paid plan features until the end of your current active billing cycle.</li>
              <li>After the billing period ends, your account will downgrade to the free Starter plan, preserving all your previous carousels.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Refund Eligibility</h2>
            <p className="leading-relaxed text-slate-600">
              Because KaruAI provides instant computational resources and AI image generation upon signup:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
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

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. How to Request a Refund</h2>
            <p className="leading-relaxed text-slate-600">
              To submit a cancellation or refund inquiry:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
              <li>Send an email to <strong>support@karuai.com</strong> with the subject "Refund Request".</li>
              <li>Provide your registered account email and invoice or transaction ID.</li>
              <li>Our support team will review and reply within 1–2 business days.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Processing Time</h2>
            <p className="leading-relaxed text-slate-600">
              Approved refunds are credited back to the original method of payment (credit card, debit card, or payment provider) within 5–10 business days depending on your bank's processing timelines.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
