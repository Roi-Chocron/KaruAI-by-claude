'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Palette, Folder, Sparkles, Image as ImageIcon, Layout, CheckCircle, ChevronRight, Menu, X } from 'lucide-react';

export default function KaruAIHome() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="ltr">
      
      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Karu<span className="text-blue-600">AI</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">How it Works</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Pricing</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium px-4 py-2 transition-colors">
                Log in
              </Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5">
                Sign up free
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900 focus:outline-none p-2"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-4 shadow-xl absolute w-full">
            <a href="#features" className="block text-slate-600 font-medium p-2 rounded-lg hover:bg-slate-50">Features</a>
            <a href="#how-it-works" className="block text-slate-600 font-medium p-2 rounded-lg hover:bg-slate-50">How it Works</a>
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/login" className="w-full text-center border-2 border-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                Log in
              </Link>
              <Link href="/register" className="w-full text-center bg-blue-600 text-white font-medium px-6 py-3 rounded-xl shadow-md">
                Sign up free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-8 border border-blue-100">
            <Sparkles className="w-4 h-4" />
            <span>The new version of KaruAI is available now!</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight max-w-4xl mx-auto">
            Create stunning carousels <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              at the speed of AI
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Turn simple ideas and texts into gorgeous visual designs for Instagram and LinkedIn in seconds, no design skills required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl transition-all transform hover:-translate-y-1 text-lg shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2">
              Start creating for free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-10 rounded-2xl transition-all text-lg border-2 border-slate-200 shadow-sm flex items-center justify-center gap-2">
              <Layout className="w-5 h-5" />
              View examples
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mockup / Preview Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-20">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 md:p-4 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
          <div className="bg-slate-100 rounded-2xl aspect-[16/9] flex items-center justify-center relative overflow-hidden border border-slate-200">
            {/* Fake App UI */}
            <div className="absolute inset-0 bg-white flex">
               <div className="w-64 bg-slate-50 border-l border-slate-200 p-6 hidden md:block">
                  <div className="h-8 bg-slate-200 rounded-lg w-3/4 mb-8"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                  </div>
               </div>
               <div className="flex-1 p-8 bg-slate-100/50 flex flex-col">
                  <div className="h-12 bg-white border border-slate-200 rounded-xl mb-8 flex items-center px-4 shadow-sm w-full max-w-2xl mx-auto">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex-1 flex gap-6 overflow-hidden">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col ${i === 3 ? 'hidden lg:flex' : ''}`}>
                         <div className="aspect-square bg-blue-50 rounded-xl mb-4 flex items-center justify-center border border-blue-100">
                            <ImageIcon className="w-12 h-12 text-blue-300" />
                         </div>
                         <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                         <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Everything you need to stand out
            </h2>
            <p className="text-lg text-slate-600">
              Our platform provides an end-to-end solution for creating eye-catching visual content that drives high engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Lightning Fast AI</h3>
              <p className="text-slate-600 leading-relaxed">
                Enter a short text or idea, and our AI will generate a complete, designed, and ready-to-publish carousel in seconds.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Palette className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Flexible Editing</h3>
              <p className="text-slate-600 leading-relaxed">
                Advanced editing interface that allows you to change texts, swap images, play with colors, and tailor the content exactly to your brand.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Folder className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Organized Workspace</h3>
              <p className="text-slate-600 leading-relaxed">
                A smart personal workspace where all your projects are saved. Organize in folders, duplicate successful carousels, and manage everything in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-bold text-blue-600 uppercase tracking-wide">Plans & Pricing</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose the perfect plan for your creative needs
            </p>
            <p className="mt-4 text-lg text-slate-600">
              Start for free and upgrade anytime. All plans include access to our cutting-edge AI generation engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Starter Plan */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">Free</span>
                </div>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                  Perfect for beginners exploring AI-powered carousel and post creation.
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-slate-500 text-sm"> / month</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Up to 5 carousels per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Standard image resolution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Basic carousel editor</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <span className="w-5 h-5 inline-flex items-center justify-center font-bold text-slate-400">✕</span>
                    <span>Includes KaruAI watermark</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <span className="w-5 h-5 inline-flex items-center justify-center font-bold text-slate-400">✕</span>
                    <span>Community support only</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full block text-center py-3 px-4 rounded-xl font-semibold border-2 border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="rounded-3xl border-2 border-blue-600 bg-white p-8 flex flex-col justify-between shadow-xl relative scale-105 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold py-1 px-4 rounded-full uppercase tracking-wider shadow">
                Most Popular
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Pro</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Recommended</span>
                </div>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                  For creators, marketers, and freelancers who publish content consistently.
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">$29</span>
                  <span className="text-slate-500 text-sm"> / month</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-medium">Up to 50 carousels per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>High Definition (HD) export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>No watermarks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Advanced editor + Unlimited AI image generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Priority email & chat support</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full block text-center py-3 px-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all"
              >
                Choose Pro
              </Link>
            </div>

            {/* Agency / Enterprise Plan */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Agency</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">For Teams</span>
                </div>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                  For agencies and teams managing multiple brands and client accounts.
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">$79</span>
                  <span className="text-slate-500 text-sm"> / month</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-medium">Unlimited carousels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Ultra HD 4K exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Custom brand kits (fonts, palettes, logos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Team collaboration & workspace sharing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Dedicated account manager & VIP SLA</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full block text-center py-3 px-4 rounded-xl font-semibold border-2 border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)"/>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to take your content to the next level?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of content creators who already use KaruAI to produce amazing carousels with less effort.
          </p>
          <Link href="/register" className="inline-block bg-white text-blue-600 hover:bg-slate-50 font-bold py-4 px-12 rounded-2xl text-xl shadow-2xl transition-transform transform hover:scale-105">
            Sign up now - It's free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-blue-500 w-6 h-6" />
                <span className="font-bold text-xl text-white">KaruAI</span>
              </div>
              <p className="text-slate-400 max-w-sm">
                The leading AI platform for creating carousels and visual content on social media.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Examples</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support & Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
                <li><Link href="/billing" className="hover:text-white transition-colors">Billing & Subscription</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-sm flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} KaruAI. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              {/* Social placeholders */}
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"></div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
