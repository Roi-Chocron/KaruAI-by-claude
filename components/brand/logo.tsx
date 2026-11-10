import Link from 'next/link';

// The mark: three slides stacked, the front one lime
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <rect x="4" y="10" width="28" height="28" rx="6" fill="#E5E5E5" />
      <rect x="10" y="7" width="28" height="28" rx="6" fill="#0A0A0A" />
      <rect x="16" y="4" width="28" height="28" rx="6" fill="#C8F135" />
    </svg>
  );
}

// Mark and wordmark. The wordmark is Latin in both languages, so it stays left-to-right.
export function Logo({ href = '/', className = '' }: { href?: string; className?: string }) {
  return (
    <Link href={href} dir="ltr" aria-label="KaruAI" className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-[22px] font-extrabold tracking-[-0.03em] leading-none">karu</span>
    </Link>
  );
}
