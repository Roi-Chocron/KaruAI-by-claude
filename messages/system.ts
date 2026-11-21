import type { Messages } from '@/lib/i18n';
import type { Marked } from '@/components/brand/marked-text';

// The pages around the site: the 404 page and the cookie banner

const en = {
  notFound: {
    tabTitle: 'Page not found - KaruAI',
    code: 'Error 404',
    title: { before: "This slide\ndoesn't ", marked: 'exist.', after: '' } as Marked,
    body: 'The link may be broken, or the page has moved.',
    home: 'Back to the home page',
    logIn: 'Log in',
    carousels: 'My carousels',
    account: 'Account',
  },
  cookies: {
    label: 'Cookie consent',
    text: 'We use essential cookies to keep you signed in. With your consent we also use analytics cookies to understand how KaruAI is used and improve it.',
    policy: 'Cookie Policy',
    essential: 'Essential only',
    all: 'Accept all',
    change: 'Change cookie settings',
  },
};

const he: typeof en = {
  notFound: {
    tabTitle: 'הדף לא נמצא - KaruAI',
    code: 'שגיאה 404',
    title: { before: 'השקף הזה\nלא ', marked: 'קיים.', after: '' },
    body: 'אולי הקישור שבור, ואולי הדף עבר למקום אחר.',
    home: 'חזרה לדף הבית',
    logIn: 'התחברות',
    carousels: 'הקרוסלות שלי',
    account: 'החשבון שלי',
  },
  cookies: {
    label: 'הסכמה לעוגיות',
    text: 'אנחנו משתמשים בעוגיות חיוניות כדי שתישארו מחוברים. בהסכמתכם נשתמש גם בעוגיות סטטיסטיקה כדי להבין איך משתמשים ב־KaruAI ולשפר אותו.',
    policy: 'מדיניות העוגיות',
    essential: 'רק חיוניות',
    all: 'אישור הכל',
    change: 'שינוי הגדרות העוגיות',
  },
};

export const systemMessages: Messages<typeof en> = { en, he };
