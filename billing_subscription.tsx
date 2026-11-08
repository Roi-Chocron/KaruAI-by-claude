'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BillingPage() {
  // Mock states for frontend interactivity
  const [isYearly, setIsYearly] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Icons implemented as inline SVGs
  const Icons = {
    CreditCard: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
    ),
    Download: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
    ),
    Zap: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    ),
    Check: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    ),
    AlertCircle: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
    )
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans" dir="ltr">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="mb-2">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing & Subscription</h1>
            <p className="text-slate-500 mt-1">Manage your plan, view billing history, and update your payment method.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Main info - Plan & Usage) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Current Plan Card */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-slate-900">Current Plan: Free Trial</h2>
                      <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
                        Active
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">
                      Your trial ends in <span className="font-semibold text-slate-800">5 days</span> (November 12, 2026).
                    </p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-3xl font-bold text-slate-900">$0</div>
                    <div className="text-sm text-slate-500">per month</div>
                  </div>
                </div>

                {/* Plan Features */}
                <ul className="mt-6 space-y-3">
                  {['Up to 5 carousels per month', 'Standard image quality', 'Watermark on images'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="text-green-500"><Icons.Check /></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Call to Action Bar */}
              <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <p className="text-sm text-slate-600">
                  Upgrade to <strong className="text-slate-900">Pro</strong> to remove limits and the watermark.
                </p>
                <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20">
                  <Icons.Zap />
                  Upgrade to Pro
                </button>
              </div>
            </section>

            {/* Usage/Quota Card */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Current Month Usage</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Carousels created</span>
                    <span className="text-slate-500 font-semibold">4 / 5</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    You have used 80% of your monthly quota. Quota resets on December 1st.
                  </p>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column (Payment & Quick Links) */}
          <div className="space-y-8">
            
            {/* Payment Method Card */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h2>
              
              <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl mb-4 bg-slate-50/70">
                <div className="bg-white p-2 rounded shadow-sm border border-slate-200 text-slate-700">
                  <Icons.CreditCard />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Mastercard ending in 4242</p>
                  <p className="text-xs text-slate-500">Expires: 12/28</p>
                </div>
              </div>
              
              <button className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
                Update payment method
              </button>
            </section>

            {/* Quick Actions / Danger Zone */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
                <Icons.AlertCircle />
                Danger Zone
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Canceling your subscription will stop future charges. Access will be maintained until the end of the current billing cycle.
              </p>
              <button 
                onClick={() => setShowCancelModal(true)}
                className="w-full text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel Subscription
              </button>
            </section>

          </div>
        </div>

        {/* Billing History Section */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">Billing History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Date</th>
                  <th scope="col" className="px-6 py-4 font-medium">Description</th>
                  <th scope="col" className="px-6 py-4 font-medium">Status</th>
                  <th scope="col" className="px-6 py-4 font-medium">Amount</th>
                  <th scope="col" className="px-6 py-4 font-medium text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-slate-800">October 1, 2026</td>
                  <td className="px-6 py-4 text-slate-600">Pro Monthly Subscription</td>
                  <td className="px-6 py-4">
                    <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">$49.00</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center gap-1 p-1">
                      <Icons.Download />
                      <span className="sr-only">Download invoice</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-slate-800">September 1, 2026</td>
                  <td className="px-6 py-4 text-slate-600">Pro Monthly Subscription</td>
                  <td className="px-6 py-4">
                    <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">$49.00</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center gap-1 p-1">
                      <Icons.Download />
                      <span className="sr-only">Download invoice</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Are you sure?</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Canceling your subscription will downgrade you to the Free plan at the end of the billing cycle. You will lose access to premium features like watermark removal and high-resolution images.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Keep Plan
              </button>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm shadow-red-500/20"
              >
                Yes, cancel subscription
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
