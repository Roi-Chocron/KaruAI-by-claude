import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata = { title: 'Page not found - KaruAI' };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center font-sans" dir="ltr">
      <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
        <Sparkles className="text-white w-7 h-7" />
      </div>
      <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">404</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">This page doesn&apos;t exist</h1>
      <p className="mt-3 text-slate-500 max-w-md">The link may be broken, or the page may have moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="px-5 py-3 rounded-xl font-semibold border-2 border-slate-200 text-slate-700 hover:bg-white">Home</Link>
        <Link href="/dashboard" className="px-5 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700">My carousels</Link>
      </div>
    </div>
  );
}
