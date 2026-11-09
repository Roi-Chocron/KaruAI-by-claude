import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Cookie, ShieldCheck, BarChart3, Sliders, AlertCircle } from 'lucide-react';
import { CookieSettingsButton } from '@/components/cookie-banner';

export const metadata = {
  title: 'Cookie & Tracking Policy - KaruAI',
  description: 'Details about the cookies, tracking technologies, analytics, and error monitoring tools used on KaruAI.',
};

export default function CookiesPage() {
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
              <Cookie className="w-4 h-4" />
              <span>Cookies & Tracking Technologies</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Cookie & Tracking Policy
            </h1>
            <p className="text-sm text-slate-500">
              Last updated: November 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. What Are Cookies and Tracking Technologies?</h2>
            <p className="leading-relaxed text-slate-600">
              Cookies and local storage are small text files and data fragments stored on your device when you browse websites. Tracking technologies such as analytics scripts, session logs, and error monitors help us keep the platform secure, understand how our features are used, and diagnose software issues to ensure a smooth user experience.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">2. Categories of Cookies & Tools We Use</h2>
            <p className="leading-relaxed text-slate-600">
              KaruAI uses only the necessary and performance tools required to operate our AI carousel generation service reliably:
            </p>

            <div className="space-y-4">
              {/* Category 1 */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">1. Strictly Necessary & Authentication Cookies</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  These cookies are essential for you to log in, navigate the application, and securely access your private carousels and billing workspace. The platform cannot function properly without them.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Name / Identifier</th>
                        <th className="p-2.5">Provider</th>
                        <th className="p-2.5">Purpose</th>
                        <th className="p-2.5">Lifespan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600">karu_session</td>
                        <td className="p-2.5">KaruAI (First-party)</td>
                        <td className="p-2.5">Secure HTTP-only session token to authenticate logged-in users and safeguard account access.</td>
                        <td className="p-2.5">30 days</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600">karu_signed_in</td>
                        <td className="p-2.5">KaruAI (First-party)</td>
                        <td className="p-2.5">Tells the site that you are signed in, so the home page can open your carousels. Contains no personal data.</td>
                        <td className="p-2.5">30 days</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600">karu_oauth</td>
                        <td className="p-2.5">KaruAI (First-party)</td>
                        <td className="p-2.5">Protects the Google sign-in against forgery while you are signing in.</td>
                        <td className="p-2.5">10 minutes</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600">karu_consent</td>
                        <td className="p-2.5">KaruAI (First-party)</td>
                        <td className="p-2.5">Remembers your cookie choice.</td>
                        <td className="p-2.5">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category 2 */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900">2. Product Analytics & User Experience (PostHog)</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We use <strong>PostHog</strong> to understand user interactions, measure carousel generation feature adoption, and improve workflow efficiency.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Tool / Cookies</th>
                        <th className="p-2.5">Provider</th>
                        <th className="p-2.5">Purpose & Privacy Protections</th>
                        <th className="p-2.5">Lifespan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600">ph_* / posthog-js</td>
                        <td className="p-2.5">PostHog</td>
                        <td className="p-2.5">
                          Tracks page navigation and interaction events. In production environments where session replay is enabled, all text and input fields are strictly masked to guarantee sensitive user content is never captured.
                        </td>
                        <td className="p-2.5">Up to 1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category 3 */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900">3. Performance & Error Monitoring (Sentry)</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We integrate <strong>Sentry</strong> to capture real-time client and server application exceptions, API timeouts, and performance bottlenecks, allowing our engineering team to detect and resolve bugs rapidly.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Tool / Service</th>
                        <th className="p-2.5">Provider</th>
                        <th className="p-2.5">Purpose</th>
                        <th className="p-2.5">Lifespan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600">@sentry/nextjs</td>
                        <td className="p-2.5">Sentry (Functional Telemetry)</td>
                        <td className="p-2.5">Captures error call stacks and diagnostic metadata when unexpected runtime errors occur in the browser or server endpoints.</td>
                        <td className="p-2.5">Session / Event-based</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. Third-Party Advertising</h2>
            <p className="leading-relaxed text-slate-600">
              KaruAI does <strong>not</strong> host third-party commercial advertisements, nor do we sell your browsing behavior or personal information to third-party ad networks or data brokers.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-slate-700" />
              <h2 className="text-xl font-bold text-slate-900">4. How You Can Manage Cookies</h2>
            </div>
            <p className="leading-relaxed text-slate-600">
              Most modern web browsers allow you to control cookie settings through their preferences:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-2">
              <li>Analytics cookies and session recordings are used only after you choose &quot;Accept all&quot; in the cookie banner. You can change your choice at any time with the button below.</li>
              <li>You can configure your browser to block or alert you about all cookies.</li>
              <li>You can clear existing cookies and cached local storage at any time via your browser settings.</li>
              <li>Please note: Blocking essential session cookies will prevent you from signing in and generating carousels on KaruAI.</li>
            </ul>
            <CookieSettingsButton />
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Contact Us</h2>
            <p className="leading-relaxed text-slate-600">
              If you have any questions or feedback regarding our use of cookies or tracking technologies, please feel free to reach out to us at{' '}
              <a href="mailto:privacy@karuai.com" className="text-blue-600 font-semibold hover:underline">
                privacy@karuai.com
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
