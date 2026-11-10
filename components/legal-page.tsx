import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

// The frame of the legal pages (English only for now): header, title and the text column
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink" dir="ltr">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <Link href="/" className="flex items-center gap-1.5 text-sm text-graphite hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <h1 className="font-display font-bold text-6xl md:text-8xl leading-[0.9]">{title}</h1>
        <p className="mt-4 text-sm text-graphite">Last updated: {updated}</p>
        <div className="legal mt-12 space-y-10 border-t border-ink pt-10">{children}</div>
      </main>
    </div>
  );
}
