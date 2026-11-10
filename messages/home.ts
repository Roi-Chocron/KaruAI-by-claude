import type { Messages } from '@/lib/i18n';
import type { PlanId } from '@/shared/plans';
import type { Marked } from '@/components/brand/marked-text';


const en = {
  meta: {
    title: 'KaruAI - Turn one sentence into an Instagram carousel',
    description: 'Tell KaruAI what you want to say. It writes the slides, designs them and leaves the final touches to you.',
  },
  nav: { how: 'How it works', editor: 'Editor', pricing: 'Pricing', login: 'Log in', start: 'Try it free', menu: 'Menu', otherLanguage: 'עברית' },
  hero: {
    title: { before: "Got an idea?\nYou've got ", marked: 'a carousel.', after: '' } as Marked,
    sub: 'Tell KaruAI what you want to say. It writes the slides, designs them and leaves the final touches to you.',
    cta: 'Make your first carousel',
    secondary: 'How it works',
    examplesLabel: 'Made in KaruAI from one line: "Instagram mistakes small businesses make"',
  },
  example: {
    cover: '5 Instagram mistakes that cost small businesses customers',
    items: [
      { title: 'Posting whenever you remember', body: 'Pick three topics and a schedule you can actually keep.' },
      { title: 'Copy-pasting from LinkedIn', body: 'Same post, different crowd. Rewrite it for the feed.' },
      { title: 'A first slide nobody swipes', body: 'Slide one sells slide two. Lead with the payoff.' },
      { title: 'Ending without an ask', body: 'Save, share, send a DM. Pick one and say it.' },
      { title: 'Quitting in week three', body: 'Reach compounds. The accounts that win are the ones still posting.' },
    ],
    end: 'Save this for your next post',
    handle: '@yourbrand',
  },
  how: {
    title: 'From blank page to posted',
    steps: [
      { title: 'Say what you want to say', body: "A topic, a rough draft, a messy list of bullet points. KaruAI works with whatever you've got." },
      { title: 'Get a finished draft', body: 'Copy, layout and images for every slide, sized 1080×1350 for the feed.' },
      { title: 'Tweak it and post', body: 'Change what you like in the editor, download, and it’s ready for Instagram.' },
    ],
  },
  editor: {
    title: "Nothing's locked.",
    sub: 'Every word, color and image on every slide is yours to change, by hand or just by asking.',
    features: [
      { title: 'Ask in plain words', body: '"Darker background, shorter title." The slides update.' },
      { title: 'Or do it by hand', body: 'Drag, resize and restyle any text, shape or image.' },
      { title: 'Images that fit the slide', body: 'Generate a new one, or keep the slide clean and text-only.' },
      { title: 'Download and post', body: 'One PNG per slide, or the whole carousel in a single ZIP.' },
    ],
    chatUser: 'Darker background, shorter title',
    chatAi: 'Done. All 7 slides updated.',
    chatInput: 'What should change?',
  },
  pricing: {
    title: 'Pricing',
    sub: "Start on the free plan. Upgrade when a carousel a week isn't enough.",
    monthly: 'Monthly',
    yearly: 'Yearly',
    perMonth: '/ month',
    billedYearly: (total: number) => `$${total} billed yearly`,
    choose: (plan: string) => `Get ${plan}`,
    startFree: 'Start free',
  },
  cta: {
    title: { before: 'Your next carousel is ', marked: 'one sentence', after: ' away.' } as Marked,
    button: 'Make your first carousel',
  },
  footer: {
    tagline: 'Instagram carousels, written and designed from one sentence.',
    product: 'Product',
    legal: 'Legal',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    cookies: 'Cookie Policy',
    refund: 'Refund Policy',
    rights: 'All rights reserved.',
  },
};

export type HomeMessages = typeof en;

const he: HomeMessages = {
  meta: {
    title: 'KaruAI - ממשפט אחד לקרוסלה באינסטגרם',
    description: 'ספרו ל־KaruAI מה אתם רוצים להגיד. הוא כותב את השקפים, מעצב אותם ומשאיר לכם את הליטוש האחרון.',
  },
  nav: { how: 'איך זה עובד', editor: 'העורך', pricing: 'מחירים', login: 'התחברות', start: 'נסו בחינם', menu: 'תפריט', otherLanguage: 'English' },
  hero: {
    title: { before: 'יש לכם רעיון?\nיש לכם ', marked: 'קרוסלה.', after: '' },
    sub: 'ספרו ל־KaruAI מה אתם רוצים להגיד. הוא כותב את השקפים, מעצב אותם ומשאיר לכם את הליטוש האחרון.',
    cta: 'צרו את הקרוסלה הראשונה',
    secondary: 'איך זה עובד',
    examplesLabel: 'נוצר ב־KaruAI משורה אחת: "טעויות שעסקים קטנים עושים באינסטגרם"',
  },
  example: {
    cover: '5 טעויות באינסטגרם שעולות לעסקים קטנים בלקוחות',
    items: [
      { title: 'מפרסמים כשנזכרים', body: 'בחרו שלושה נושאים ולוח זמנים שבאמת תעמדו בו.' },
      { title: 'מעתיקים מלינקדאין', body: 'אותו פוסט, קהל אחר. כתבו אותו מחדש בשביל הפיד.' },
      { title: 'שקף ראשון שאף אחד לא מחליק', body: 'השקף הראשון מוכר את השני. פתחו עם השורה התחתונה.' },
      { title: 'מסיימים בלי לבקש כלום', body: 'לשמור, לשתף, לשלוח הודעה. בחרו אחד ותגידו אותו.' },
      { title: 'מוותרים בשבוע השלישי', body: 'חשיפה מצטברת. מי שמנצח הוא מי שעדיין מפרסם.' },
    ],
    end: 'שמרו לפוסט הבא',
    handle: '@yourbrand',
  },
  how: {
    title: 'מדף ריק לפוסט מוכן',
    steps: [
      { title: 'אומרים מה רוצים להגיד', body: 'נושא, טיוטה, רשימת נקודות מבולגנת. KaruAI עובד עם מה שיש לכם.' },
      { title: 'מקבלים טיוטה גמורה', body: 'טקסט, עימוד ותמונות לכל שקף, בגודל 1080×1350 שמתאים לפיד.' },
      { title: 'מלטשים ומפרסמים', body: 'משנים מה שרוצים בעורך, מורידים, וזה מוכן לאינסטגרם.' },
    ],
  },
  editor: {
    title: 'שום דבר לא נעול.',
    sub: 'כל מילה, צבע ותמונה בכל שקף פתוחים לשינוי, בעכבר או פשוט בבקשה.',
    features: [
      { title: 'מבקשים במילים', body: '"רקע כהה יותר, כותרת קצרה יותר." והשקפים מתעדכנים.' },
      { title: 'או עושים את זה ביד', body: 'גוררים, מגדילים ומעצבים כל טקסט, צורה ותמונה.' },
      { title: 'תמונות שמתאימות לשקף', body: 'יוצרים תמונה חדשה, או משאירים את השקף נקי, רק עם טקסט.' },
      { title: 'מורידים ומפרסמים', body: 'PNG לכל שקף, או את כל הקרוסלה ב־ZIP אחד.' },
    ],
    chatUser: 'רקע כהה יותר, כותרת קצרה יותר',
    chatAi: 'בוצע. כל 7 השקפים עודכנו.',
    chatInput: 'מה לשנות?',
  },
  pricing: {
    title: 'מחירים',
    sub: 'מתחילים בתוכנית החינמית. משדרגים כשקרוסלה בשבוע כבר לא מספיקה.',
    monthly: 'חודשי',
    yearly: 'שנתי',
    perMonth: '/ חודש',
    billedYearly: total => `$${total} בחיוב שנתי`,
    choose: plan => `שדרוג ל־${plan}`,
    startFree: 'מתחילים בחינם',
  },
  cta: {
    title: { before: 'הקרוסלה הבאה שלכם במרחק ', marked: 'משפט אחד.', after: '' },
    button: 'צרו את הקרוסלה הראשונה',
  },
  footer: {
    tagline: 'קרוסלות לאינסטגרם, כתובות ומעוצבות ממשפט אחד.',
    product: 'מוצר',
    legal: 'מידע משפטי',
    terms: 'תנאי שימוש',
    privacy: 'מדיניות פרטיות',
    cookies: 'מדיניות עוגיות',
    refund: 'מדיניות החזרים',
    rights: 'כל הזכויות שמורות.',
  },
};

export const homeMessages: Messages<HomeMessages> = { en, he };

// The plan texts in Hebrew; English comes from shared/plans.ts. Keep the two in step when the plans change.
export const planCopyHe: Record<PlanId, { badge: string; description: string; features: string[] }> = {
  free: {
    badge: 'חינם',
    description: 'כדי לנסות את KaruAI וליצור את הקרוסלות הראשונות.',
    features: ['5 קרוסלות חדשות בחודש', '40 הודעות עיצוב ל־AI בחודש', '20 תמונות AI בחודש', 'עורך מלא, ייצוא PNG ו־ZIP', 'סימן מים קטן של KaruAI בקבצים'],
  },
  pro: {
    badge: 'הכי פופולרי',
    description: 'ליוצרים ומשווקים שמפרסמים כל שבוע.',
    features: ['50 קרוסלות חדשות בחודש', '600 הודעות עיצוב ל־AI בחודש', '300 תמונות AI בחודש', 'בלי סימן מים', 'תמיכה במייל'],
  },
  agency: {
    badge: 'לצוותים',
    description: 'לסוכנויות שמייצרות תוכן לכמה מותגים.',
    features: ['קרוסלות ללא הגבלה', '2,500 הודעות עיצוב ל־AI בחודש', '1,200 תמונות AI בחודש', 'בלי סימן מים', 'תמיכה בעדיפות'],
  },
};
