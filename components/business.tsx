import type { ReactNode } from 'react';
import { BUSINESS, REGISTRATION_LABELS } from '@/shared/business';
import type { Locale } from '@/lib/i18n';

// Text still to be filled in before launch, marked clearly on the page
export function Placeholder({ children }: { children: ReactNode }) {
  return <mark className="bg-lime text-ink rounded px-1 font-semibold">[{children}]</mark>;
}

// Business details on the pages (see shared/business.ts): the value, or a lime placeholder naming what is missing

export function BusinessValue({ value, missing }: { value: string | null; missing: string }) {
  return value ? <>{value}</> : <Placeholder>{missing}</Placeholder>;
}

export function EmailLink({ email, missing }: { email: string | null; missing: string }) {
  return email ? <a href={`mailto:${email}`} dir="ltr" className="underline underline-offset-2">{email}</a> : <Placeholder>{missing}</Placeholder>;
}

export function PhoneLink({ phone, missing }: { phone: string | null; missing: string }) {
  return phone ? <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} dir="ltr" className="underline underline-offset-2">{phone}</a> : <Placeholder>{missing}</Placeholder>;
}

// "Licensed dealer (Osek Murshe) 123456789", or a placeholder
export function Registration({ locale }: { locale: Locale }) {
  const { registrationType, registrationNumber } = BUSINESS;
  return registrationType && registrationNumber
    ? <>{`${REGISTRATION_LABELS[registrationType][locale]} ${registrationNumber}`}</>
    : <Placeholder>{COPY[locale].registration}</Placeholder>;
}

const COPY = {
  en: {
    title: 'Business details',
    operatedBy: 'KaruAI is operated by',
    name: 'business name',
    registration: 'registration type and number',
    address: 'business address',
    email: 'support email',
    phone: 'phone number',
  },
  he: {
    title: 'פרטי העוסק',
    operatedBy: 'KaruAI מופעל על ידי',
    name: 'שם העסק',
    registration: 'סוג העוסק ומספרו',
    address: 'כתובת העסק',
    email: 'מייל התמיכה',
    phone: 'מספר הטלפון',
  },
};

// One line for the footers: who runs the site, their number, address and how to reach them
export function BusinessDetailsLine({ locale, className = '' }: { locale: Locale; className?: string }) {
  const t = COPY[locale];
  const b = BUSINESS;
  const parts: ReactNode[] = [
    <BusinessValue key="address" value={locale === 'he' ? b.addressHe : b.address} missing={t.address} />,
    <EmailLink key="email" email={b.supportEmail} missing={t.email} />,
    <PhoneLink key="phone" phone={b.phone} missing={t.phone} />,
  ];
  return (
    <p className={`text-sm text-graphite leading-relaxed ${className}`}>
      <span className="font-semibold text-ink">{t.title}: </span>
      {t.operatedBy} <BusinessValue value={locale === 'he' ? b.legalNameHe : b.legalName} missing={t.name} />
      {' ('}<Registration locale={locale} />{'). '}
      {parts.map((part, index) => <span key={index}>{index > 0 && ' · '}{part}</span>)}
    </p>
  );
}
