import type { Messages } from '@/lib/i18n';

const en = {
  title: 'Sign in to KaruAI',
  sub: 'New here? Signing in with Google creates your free account.',
  google: 'Continue with Google',
  agree: { before: 'By continuing you agree to our ', terms: 'Terms of Service', and: ' and ', privacy: 'Privacy Policy', after: '.' },
  panelTitle: { before: 'One sentence in.\n', marked: 'A whole carousel', after: ' out.' },
  panelNote: 'The free plan is included. No card needed.',
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
  title: 'התחברות ל־KaruAI',
  sub: 'חדשים כאן? ההתחברות עם Google פותחת לכם חשבון חינמי.',
  google: 'המשך עם Google',
  agree: { before: 'בהמשך אתם מסכימים ל', terms: 'תנאי השימוש', and: ' ול', privacy: 'מדיניות הפרטיות', after: ' שלנו.' },
  panelTitle: { before: 'משפט אחד נכנס.\n', marked: 'קרוסלה שלמה', after: ' יוצאת.' },
  panelNote: 'התוכנית החינמית כלולה. בלי כרטיס אשראי.',
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
