'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { BusinessDetailsLine } from '@/components/business';
import { LanguageSwitch } from '@/components/language-switch';
import { UserLocaleRoot } from '@/components/locale-root';
import { logOut } from '@/lib/session';
import { useTabTitle } from '@/lib/tab-title';
import { appMessages } from '@/messages/app';
import { localePath, type Locale } from '@/lib/i18n';
import type { PublicUser } from '@/types';

export type AppSection = 'carousels' | 'billing' | 'account' | 'admin';

export function Avatar({ user, size = 32 }: { user: PublicUser; size?: number }) {
  return user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" width={size} height={size} className="rounded-full" />
  ) : (
    <span style={{ width: size, height: size }} className="rounded-full bg-lime text-ink grid place-items-center text-sm font-bold">
      {(user.name || user.email)[0].toUpperCase()}
    </span>
  );
}

// The header and page frame of the signed-in pages, in the visitor's language
export function AppShell({ user, active, children }: { user: PublicUser; active: AppSection; children: (locale: Locale) => ReactNode }) {
  return <UserLocaleRoot>{locale => <Frame user={user} active={active} locale={locale}>{children(locale)}</Frame>}</UserLocaleRoot>;
}

function Frame({ user, active, locale, children }: { user: PublicUser; active: AppSection; locale: Locale; children: ReactNode }) {
  const t = appMessages[locale].shell;
  const [open, setOpen] = useState(false);
  const links: { id: AppSection; href: string; label: string }[] = [
    { id: 'carousels', href: '/dashboard', label: t.carousels },
    { id: 'billing', href: '/billing', label: t.billing },
    { id: 'account', href: '/account', label: t.account },
    ...(user.role === 'admin' ? [{ id: 'admin' as const, href: '/admin', label: t.admin }] : []),
  ];

  // The phone menu closes with Escape, and by itself once the window is wide enough for the full header
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    const wide = window.matchMedia('(min-width: 1024px)');
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 xl:gap-10 min-w-0">
            <Logo href="/dashboard" className="shrink-0" />
            <nav aria-label={t.nav} className="hidden lg:flex items-center gap-1 text-[15px]">
              {links.map(link => (
                <Link
                  key={link.id}
                  href={link.href}
                  aria-current={link.id === active ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${link.id === active ? 'bg-mist text-ink font-semibold' : 'text-graphite hover:text-ink'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden lg:flex items-center gap-4 min-w-0">
            <LanguageSwitch locale={locale} />
            {/* The name shows on wide screens; below that the avatar alone links to the account */}
            <Link href="/account" className="flex items-center gap-2.5 min-w-0 rounded-lg" title={user.email}>
              <span className="sr-only xl:not-sr-only text-sm font-medium max-w-[12rem] truncate" dir="auto">{user.name || user.email}</span>
              <Avatar user={user} />
            </Link>
            <button onClick={logOut} title={t.logOut} aria-label={t.logOut} className="grid place-items-center h-10 w-10 -me-2 rounded-lg text-graphite hover:text-ink hover:bg-mist">
              <LogOut size={18} className="rtl:-scale-x-100" aria-hidden="true" />
            </button>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden grid place-items-center h-11 w-11 -me-2.5 rounded-lg"
            aria-label={open ? t.closeMenu : t.menu}
            aria-expanded={open}
            aria-controls="app-menu"
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
        {open && (
          <div id="app-menu" className="lg:hidden border-t border-line max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-5">
              <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-3 py-4 border-b border-line">
                <Avatar user={user} size={36} />
                <span className="min-w-0">
                  <span className="block font-medium truncate" dir="auto">{user.name || user.email}</span>
                  {user.name && <span className="block text-sm text-graphite truncate" dir="ltr">{user.email}</span>}
                </span>
              </Link>
              <nav aria-label={t.nav}>
                {links.map(link => (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={link.id === active ? 'page' : undefined}
                    className={`block py-3 text-lg border-b border-line ${link.id === active ? 'font-semibold' : 'text-graphite'}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center justify-between pt-3">
                <LanguageSwitch locale={locale} className="!text-base" />
                <button onClick={logOut} className="flex items-center gap-2 min-h-11 -me-2 px-2 rounded-lg text-graphite hover:text-ink">
                  <LogOut size={18} className="rtl:-scale-x-100" aria-hidden="true" /> {t.logOut}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      {/* A failed renewal: shown on every signed-in page while Polar retries the card (the plan stays meanwhile) */}
      {user.paymentIssue && active !== 'billing' && (
        <div role="alert" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <p className="text-sm text-amber-900 rounded-xl border border-amber-500 bg-amber-50 p-4">
            {t.paymentIssue(new Date(user.paymentIssue.graceEndsAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB', { dateStyle: 'long' }))}{' '}
            <Link href="/billing" className="font-semibold underline underline-offset-4">{t.paymentIssueLink}</Link>
          </p>
        </div>
      )}
      {children}
      {/* The accessibility statement has to be reachable from every page (IS 5568) */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8 border-t border-line">
        <nav aria-label={t.footer} className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-graphite">
          {(['accessibility', 'terms', 'privacy', 'contact', 'cancel'] as const).map(page => (
            <Link key={page} href={localePath(locale, `/${page}`)} className="inline-flex items-center min-h-10 hover:text-ink">
              {t[page]}
            </Link>
          ))}
        </nav>
        <BusinessDetailsLine locale={locale} className="mt-3" />
      </footer>
    </div>
  );
}

// The title row every signed-in page starts with; it also names the browser tab
export function PageHeading({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  useTabTitle(`${title} - KaruAI`);
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
      <div>
        <h1 className="font-display font-bold text-6xl md:text-7xl leading-[0.9]">{title}</h1>
        {sub && <p className="mt-3 text-graphite">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
