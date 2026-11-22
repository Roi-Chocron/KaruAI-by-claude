import type { Messages } from '@/lib/i18n';

const en = {
  tabTitle: 'Sign in',
  title: 'Sign in to KaruAI',
  sub: 'New here? Signing in with Google creates your free account.',
  google: 'Continue with Google',
  contact: 'Contact us',
  agree: { before: 'By continuing you agree to our ', terms: 'Terms of Service', and: ' and ', privacy: 'Privacy Policy', after: '.' },
  panelTitle: { before: 'One sentence in.\n', marked: 'A whole carousel', after: ' out.' },
  panelNote: 'The free plan is included. No card needed.',
  dev: {
    title: 'Dev login (local development only)',
    email: 'Email',
    placeholder: 'you@example.com',
    submit: 'Sign in',
    busy: 'Signing in…',
    errors: {
      invalid: 'Enter a valid email address.',
      refused: 'Dev login is turned off on this server.',
      suspended: 'This account is suspended. Contact support.',
      network: "Couldn't reach the server. Check that the API is running and try again.",
      failed: "Couldn't sign in. Try again.",
    },
  },
  errors: {
    cancelled: 'Google sign-in was cancelled.',
    state: 'That sign-in link expired. Try again.',
    failed: "Google sign-in didn't go through. Try again.",
    unverified: "Your Google account doesn't have a verified email address.",
    config: 'Google sign-in is not set up yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).',
    rate: 'Too many sign-in attempts. Wait a few minutes and try again.',
    suspended: 'This account is suspended. Contact support.',
  } as Record<string, string>,
};

const he: typeof en = {
  tabTitle: 'התחברות',
  title: 'התחברות ל־KaruAI',
  sub: 'חדשים כאן? ההתחברות עם Google פותחת לכם חשבון חינמי.',
  google: 'המשך עם Google',
  contact: 'צור קשר',
  agree: { before: 'בהמשך אתם מסכימים ל', terms: 'תנאי השימוש', and: ' ול', privacy: 'מדיניות הפרטיות', after: ' שלנו.' },
  panelTitle: { before: 'משפט אחד נכנס.\n', marked: 'קרוסלה שלמה', after: ' יוצאת.' },
  panelNote: 'התוכנית החינמית כלולה. בלי כרטיס אשראי.',
  dev: {
    title: 'התחברות פיתוח (לפיתוח מקומי בלבד)',
    email: 'מייל',
    placeholder: 'you@example.com',
    submit: 'התחברות',
    busy: 'מתחברים…',
    errors: {
      invalid: 'הזינו כתובת מייל תקינה.',
      refused: 'התחברות הפיתוח כבויה בשרת הזה.',
      suspended: 'החשבון הזה מושעה. פנו לתמיכה.',
      network: 'אין חיבור לשרת. בדקו שה־API פועל ונסו שוב.',
      failed: 'ההתחברות לא הצליחה. נסו שוב.',
    },
  },
  errors: {
    cancelled: 'ההתחברות עם Google בוטלה.',
    state: 'קישור ההתחברות פג. נסו שוב.',
    failed: 'ההתחברות עם Google לא הצליחה. נסו שוב.',
    unverified: 'לחשבון Google שלכם אין כתובת מייל מאומתת.',
    config: 'ההתחברות עם Google עוד לא הוגדרה (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).',
    rate: 'יותר מדי ניסיונות התחברות. חכו כמה דקות ונסו שוב.',
    suspended: 'החשבון הזה מושעה. פנו לתמיכה.',
  },
};

export const authMessages: Messages<typeof en> = { en, he };
