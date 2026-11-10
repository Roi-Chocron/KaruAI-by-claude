'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import { MonthlyYearlyToggle, PricingCards } from '@/components/pricing-cards';
import { Logo } from '@/components/brand/logo';
import { MarkedText } from '@/components/brand/marked-text';
import { ExampleCarousel } from '@/components/home/example-carousel';
import { homeMessages } from '@/messages/home';
import { localePath, type Locale } from '@/lib/i18n';

export default function KaruAIHome({ locale = 'en' }: { locale?: Locale }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(false);
  const t = homeMessages[locale];
  const Forward = locale === 'he' ? ArrowLeft : ArrowRight;
  const home = localePath(locale, '/');
  const otherLanguage = localePath(locale === 'he' ? 'en' : 'he', '/');

  const navLinks = [
    { href: '#how-it-works', label: t.nav.how },
    { href: '#editor', label: t.nav.editor },
    { href: '#pricing', label: t.nav.pricing },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Logo href={home} />

          <div className="hidden md:flex items-center gap-8 text-[15px]">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="text-graphite hover:text-ink transition-colors">{link.label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href={otherLanguage} className="px-3 py-2 text-sm text-graphite hover:text-ink transition-colors" lang={locale === 'he' ? 'en' : 'he'}>
              {t.nav.otherLanguage}
            </Link>
            <Link href="/login" className="px-3 py-2 text-[15px] font-medium text-ink hover:text-graphite transition-colors">{t.nav.login}</Link>
            <Link href="/login" className="btn-primary !py-2.5">{t.nav.start}</Link>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 -me-2"
            aria-label={t.nav.menu}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-paper px-4 pt-2 pb-6">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-lg border-b border-line">
                {link.label}
              </a>
            ))}
            <Link href={otherLanguage} className="block py-3 text-lg border-b border-line" lang={locale === 'he' ? 'en' : 'he'}>{t.nav.otherLanguage}</Link>
            <div className="pt-5 grid grid-cols-2 gap-3">
              <Link href="/login" className="btn-secondary">{t.nav.login}</Link>
              <Link href="/login" className="btn-primary">{t.nav.start}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero: an oversized headline, and a sample carousel that runs off the edge of the page */}
      <header className="pt-14 md:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-[clamp(4rem,9.5vw,10rem)] leading-[0.88]">
            <MarkedText text={t.hero.title} />
          </h1>
          <div className="mt-8 md:mt-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <p className="text-lg md:text-xl leading-relaxed text-graphite max-w-xl">{t.hero.sub}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login" className="btn-primary text-base px-6 py-3.5">
                {t.hero.cta}
                <Forward className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" className="btn-secondary text-base px-6 py-3.5">{t.hero.secondary}</a>
            </div>
          </div>
          <p className="mt-14 mb-4 text-sm text-graphite">{t.hero.examplesLabel}</p>
        </div>
        <div
          role="region"
          aria-label={t.hero.examplesLabel}
          tabIndex={0}
          className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 lg:scroll-px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))] pb-16 md:pb-24 px-4 sm:px-6 lg:px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ExampleCarousel t={t.example} slideClass="w-[72vw] sm:w-[44vw] md:w-[30vw] lg:w-[21rem]" />
        </div>
      </header>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-line scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <h2 className="font-display font-bold text-6xl md:text-8xl leading-none mb-12 md:mb-16">{t.how.title}</h2>
          <ol className="grid md:grid-cols-3 border-t border-ink">
            {t.how.steps.map((step, i) => (
              <li key={step.title} className="pt-6 pb-10 md:pe-10 border-b md:border-b-0 border-line md:[&:not(:first-child)]:border-s md:[&:not(:first-child)]:ps-8">
                <span className="font-display font-bold text-7xl leading-none" dir="ltr">0{i + 1}</span>
                <h3 className="mt-6 text-2xl font-bold">{step.title}</h3>
                <p className="mt-3 text-graphite leading-relaxed max-w-sm">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The editor */}
      <section id="editor" className="bg-ink text-paper scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div>
            <h2 className="font-display font-bold text-6xl md:text-8xl leading-[0.9]">{t.editor.title}</h2>
            <p className="mt-6 text-lg text-paper/70 max-w-md">{t.editor.sub}</p>
            <dl className="mt-12 grid sm:grid-cols-2 gap-x-10 gap-y-8">
              {t.editor.features.map(feature => (
                <div key={feature.title} className="border-t border-paper/20 pt-4">
                  <dt className="font-semibold text-lg">{feature.title}</dt>
                  <dd className="mt-2 text-paper/70 leading-relaxed">{feature.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* A sketch of the editor: one slide and the AI chat beside it */}
          <div aria-hidden="true" className="rounded-2xl bg-paper text-ink p-3 sm:p-4 grid grid-cols-[1fr_minmax(0,0.85fr)] gap-3 sm:gap-4">
            <div className="rounded-xl bg-mist p-4 sm:p-6 flex items-center justify-center">
              <div className="w-full max-w-[15rem] aspect-[4/5] rounded-xl bg-ink p-[8%] flex flex-col [container-type:inline-size]">
                <span className="text-[4cqw] font-semibold text-paper/60 self-end" dir="ltr">1/7</span>
                <span className="mt-auto font-display font-bold text-lime text-[15cqw] leading-[0.9]">{t.example.cover}</span>
                <span className="mt-4 h-1 w-10 bg-lime" />
              </div>
            </div>
            <div className="flex flex-col gap-3 text-[13px] leading-snug">
              <div className="self-end max-w-[90%] rounded-xl rounded-ee-sm bg-ink text-paper px-3 py-2">{t.editor.chatUser}</div>
              <div className="self-start max-w-[90%] rounded-xl rounded-es-sm bg-mist px-3 py-2">{t.editor.chatAi}</div>
              <div className="mt-auto flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-graphite">
                <span className="truncate">{t.editor.chatInput}</span>
                <span className="ms-2 grid place-items-center w-6 h-6 rounded-md bg-lime text-ink flex-none">
                  <Forward className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <h2 className="font-display font-bold text-6xl md:text-8xl leading-none">{t.pricing.title}</h2>
              <p className="mt-4 text-lg text-graphite">{t.pricing.sub}</p>
            </div>
            <MonthlyYearlyToggle yearly={yearly} onChange={setYearly} locale={locale} />
          </div>

          <PricingCards
            yearly={yearly}
            locale={locale}
            action={plan => (
              <Link href="/login" className={`w-full ${plan.highlighted ? 'btn-lime' : 'btn-secondary'}`}>
                {plan.monthlyPrice === 0 ? t.pricing.startFree : t.pricing.choose(plan.name)}
              </Link>
            )}
          />
        </div>
      </section>

      {/* Closing call to action */}
      <section className="bg-lime">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <h2 className="font-display font-bold text-[clamp(3.5rem,9vw,8rem)] leading-[0.88] max-w-[16ch]">
            {t.cta.title.before}
            <span className="underline decoration-[0.06em] underline-offset-[0.12em] whitespace-nowrap">{t.cta.title.marked}</span>
            {t.cta.title.after}
          </h2>
          <Link href="/login" className="btn-primary text-lg px-8 py-4 self-start lg:self-auto">
            {t.cta.button}
            <Forward className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo href={home} />
            <p className="mt-4 text-graphite max-w-xs">{t.footer.tagline}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-4">{t.footer.product}</h3>
            <ul className="space-y-2.5 text-graphite">
              {navLinks.map(link => (
                <li key={link.href}><a href={link.href} className="hover:text-ink transition-colors">{link.label}</a></li>
              ))}
              <li><Link href="/login" className="hover:text-ink transition-colors">{t.nav.login}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-4">{t.footer.legal}</h3>
            <ul className="space-y-2.5 text-graphite">
              <li><Link href="/terms" className="hover:text-ink transition-colors">{t.footer.terms}</Link></li>
              <li><Link href="/privacy" className="hover:text-ink transition-colors">{t.footer.privacy}</Link></li>
              <li><Link href="/cookies" className="hover:text-ink transition-colors">{t.footer.cookies}</Link></li>
              <li><Link href="/refund" className="hover:text-ink transition-colors">{t.footer.refund}</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-line flex flex-wrap items-center justify-between gap-4 text-sm text-graphite">
          <p>© {new Date().getFullYear()} KaruAI. {t.footer.rights}</p>
          <Link href={otherLanguage} className="hover:text-ink transition-colors" lang={locale === 'he' ? 'en' : 'he'}>{t.nav.otherLanguage}</Link>
        </div>
      </footer>
    </div>
  );
}
