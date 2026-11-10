'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { LanguageSwitch } from '@/components/language-switch';
import { UserLocaleRoot } from '@/components/locale-root';
import { logOut } from '@/lib/session';
import { appMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
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

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Logo href="/dashboard" />
            <nav className="hidden md:flex items-center gap-1 text-[15px]">
              {links.map(link => (
                <Link
                  key={link.id}
                  href={link.href}
                  aria-current={link.id === active ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg transition-colors ${link.id === active ? 'bg-mist text-ink font-semibold' : 'text-graphite hover:text-ink'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitch locale={locale} />
            <Link href="/account" className="flex items-center gap-2.5" title={user.email}>
              <span className="text-sm font-medium max-w-[12rem] truncate" dir="auto">{user.name || user.email}</span>
              <Avatar user={user} />
            </Link>
            <button onClick={logOut} title={t.logOut} aria-label={t.logOut} className="p-2 -m-2 text-graphite hover:text-ink">
              <LogOut size={18} className="rtl:-scale-x-100" />
            </button>
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 -me-2" aria-label={t.menu} aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-line px-4 pb-5">
            <div className="flex items-center gap-3 py-4 border-b border-line">
              <Avatar user={user} size={36} />
              <div className="min-w-0">
                <p className="font-medium truncate" dir="auto">{user.name || user.email}</p>
                {user.name && <p className="text-sm text-graphite truncate">{user.email}</p>}
              </div>
            </div>
            {links.map(link => (
              <Link key={link.id} href={link.href} className={`block py-3 text-lg border-b border-line ${link.id === active ? 'font-semibold' : ''}`}>
                {link.label}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-4">
              <LanguageSwitch locale={locale} className="!text-base" />
              <button onClick={logOut} className="flex items-center gap-2 text-graphite">
                <LogOut size={18} className="rtl:-scale-x-100" /> {t.logOut}
              </button>
            </div>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

// The title row every signed-in page starts with
export function PageHeading({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
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
