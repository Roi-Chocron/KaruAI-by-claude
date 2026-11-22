// The business behind KaruAI, as Israeli law asks a seller to name itself (Consumer Protection Law 14ג: name, ID or
// registration number and address before a distance sale; IS 5568: an accessibility coordinator). Every legal page,
// footer, the contact page and the cancel page read it from here.
// null means not known yet: the pages show a lime placeholder, and a production build stops while any is left
// (lib/launch-guard.ts). The public email addresses can also come from NEXT_PUBLIC_*_EMAIL at build time.

export type RegistrationType = 'exempt-dealer' | 'licensed-dealer' | 'company';

export interface BusinessDetails {
    legalName: string | null;
    legalNameHe: string | null;
    // עוסק פטור / עוסק מורשה / חברה בע"מ, and its number (ת"ז, ע.מ. or ח.פ.)
    registrationType: RegistrationType | null;
    registrationNumber: string | null;
    address: string | null;
    addressHe: string | null;
    phone: string | null;
    phoneHours: string | null;
    phoneHoursHe: string | null;
    supportEmail: string | null;
    privacyEmail: string | null;
    accessibilityEmail: string | null;
    legalEmail: string | null;
    // How soon support answers, e.g. "within 2 business days"
    replyTime: string | null;
    replyTimeHe: string | null;
    accessibilityCoordinator: { name: string | null; nameHe: string | null; email: string | null; phone: string | null };
}

export const BUSINESS: BusinessDetails = {
    legalName: null,
    legalNameHe: null,
    registrationType: null,
    registrationNumber: null,
    address: null,
    addressHe: null,
    phone: null,
    phoneHours: null,
    phoneHoursHe: null,
    // Read one by one, so Next writes the values into the pages at build time
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || null,
    privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || null,
    accessibilityEmail: process.env.NEXT_PUBLIC_ACCESSIBILITY_EMAIL || null,
    legalEmail: process.env.NEXT_PUBLIC_LEGAL_EMAIL || null,
    replyTime: null,
    replyTimeHe: null,
    accessibilityCoordinator: { name: null, nameHe: null, email: null, phone: null },
};

// The fields still missing, by name, for the launch guard
export function missingBusinessDetails(details: BusinessDetails = BUSINESS): string[] {
    const missing: string[] = [];
    for (const [key, value] of Object.entries(details)) {
        if (value === null) missing.push(key);
        else if (typeof value === 'object') {
            for (const [inner, innerValue] of Object.entries(value)) if (innerValue === null) missing.push(`${key}.${inner}`);
        }
    }
    return missing;
}

export const REGISTRATION_LABELS: Record<RegistrationType, { en: string; he: string }> = {
    'exempt-dealer': { en: 'Exempt dealer (Osek Patur)', he: 'עוסק פטור' },
    'licensed-dealer': { en: 'Licensed dealer (Osek Murshe)', he: 'עוסק מורשה' },
    company: { en: 'Company', he: 'חברה בע"מ' },
};
