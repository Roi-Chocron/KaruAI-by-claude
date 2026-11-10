import type { ReactNode } from 'react';
import type { HomeMessages } from '@/messages/home';

// A sample carousel drawn in HTML: the kind of 4:5 slides KaruAI produces. Decorative; the container labels it.

type Theme = { bg: string; title: string; body: string; num: string };

const THEMES: Theme[] = [
  { bg: 'bg-lime', title: 'text-ink', body: 'text-ink/80', num: 'text-ink' },
  { bg: 'bg-paper border border-line', title: 'text-ink', body: 'text-graphite', num: 'text-ink' },
  { bg: 'bg-ink', title: 'text-paper', body: 'text-paper/70', num: 'text-lime' },
  { bg: 'bg-mist', title: 'text-ink', body: 'text-graphite', num: 'text-ink' },
  { bg: 'bg-lime', title: 'text-ink', body: 'text-ink/80', num: 'text-ink' },
];

// Sizes inside a slide are in cqw (percent of the slide's width), so the text scales with the slide
function Slide({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className={`relative flex-none aspect-[4/5] rounded-2xl overflow-hidden snap-start [container-type:inline-size] ${className}`}>
      <div className="absolute inset-0 p-[8cqw] flex flex-col items-start">{children}</div>
    </div>
  );
}

export function ExampleCarousel({ t, slideClass }: { t: HomeMessages['example']; slideClass: string }) {
  const total = t.items.length + 2;
  const counter = (n: number, tone: string) => (
    <span className={`absolute top-[7cqw] end-[8cqw] text-[3.6cqw] font-semibold tabular-nums ${tone}`} dir="ltr">
      {n}/{total}
    </span>
  );

  return (
    <>
      <Slide className={`${slideClass} bg-ink`}>
        {counter(1, 'text-paper/60')}
        <span className="mt-auto font-display font-bold text-lime text-[13cqw] leading-[0.9]">{t.cover}</span>
        <span className="mt-[7cqw] h-[1.4cqw] w-[16cqw] bg-lime" />
      </Slide>
      {t.items.map((item, i) => {
        const theme = THEMES[i % THEMES.length];
        return (
          <Slide key={item.title} className={`${slideClass} ${theme.bg}`}>
            {counter(i + 2, theme.body)}
            <span className={`font-display font-bold text-[22cqw] leading-none ${theme.num}`} dir="ltr">
              0{i + 1}
            </span>
            <span className={`mt-auto font-display font-bold text-[13cqw] leading-[0.92] ${theme.title}`}>{item.title}</span>
            <span className={`mt-[4cqw] text-[4.6cqw] leading-snug ${theme.body}`}>{item.body}</span>
          </Slide>
        );
      })}
      <Slide className={`${slideClass} bg-paper border border-line`}>
        {counter(total, 'text-graphite')}
        <span className="mt-auto font-display font-bold text-ink text-[14cqw] leading-[1.05]">
          <span className="marker">{t.end}</span>
        </span>
        <span className="mt-[5cqw] text-[4.4cqw] font-semibold text-graphite" dir="ltr">{t.handle}</span>
      </Slide>
    </>
  );
}
