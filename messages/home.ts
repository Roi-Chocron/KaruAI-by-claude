import type { Messages } from '@/lib/i18n';
import type { PlanId } from '@/shared/plans';

// A headline with one phrase on the lime marker: `before` + `marked` + `after`
type Marked = { before: string; marked: string; after: string };

const en = {
  meta: {
    title: 'KaruAI - Instagram carousels from a single idea',
    description: 'Write an idea and get a designed Instagram carousel: copy, layout and images for every slide, all editable.',
  },
  nav: { how: 'How it works', editor: 'Editor', pricing: 'Pricing', login: 'Log in', start: 'Start for free', menu: 'Menu', otherLanguage: 'עברית' },
  hero: {
    title: { before: 'Carousels that stop ', marked: 'the scroll.', after: '' } as Marked,
    sub: 'Write an idea and get a designed Instagram carousel: copy, layout and images for every slide. Then change anything in the editor.',
    cta: 'Start for free',
    secondary: 'How it works',
    swipe: 'Swipe',
    examplesLabel: 'An example carousel made with KaruAI',
  },
  example: {
    cover: '5 mistakes small businesses make on Instagram',
    items: [
      { title: 'Posting without a plan', body: 'Pick three topics you know best and rotate them.' },
      { title: 'The same post everywhere', body: "Instagram isn't LinkedIn. Write for the feed you're in." },
      { title: 'No reason to stop', body: 'The first slide has one job: make people swipe.' },
      { title: 'No call to action', body: 'Tell people what to do next: save, share or send a message.' },
      { title: 'Quitting after two weeks', body: 'Reach builds slowly. Keep posting.' },
    ],
    end: 'Save this for your next post',
    handle: '@yourbrand',
  },
  how: {
    title: 'How it works',
    steps: [
      { title: 'Describe it', body: 'Type a topic, paste a blog post or list your points.' },
      { title: 'Get the slides', body: 'KaruAI writes the copy, lays out every slide at 1080×1350 and creates images to match.' },
      { title: 'Make it yours', body: 'Change text, colors and images in the editor, then download PNG files or a ZIP.' },
    ],
  },
  editor: {
    title: 'Every slide stays editable',
    sub: 'The AI makes the first version. The editor gives you control over every element.',
    features: [
      { title: 'Chat with the design', body: 'Ask for a darker background or shorter text, and the slides update.' },
      { title: 'Move anything', body: 'Drag, resize and restyle every text, shape and image.' },
      { title: 'An image for each slide', body: 'Generate a new image, or keep a slide text-only.' },
      { title: 'Ready to post', body: 'Download each slide as a PNG, or the whole carousel as a ZIP.' },
    ],
    chatUser: 'Make the background black and the title lime',
    chatAi: 'Done. I updated all 7 slides.',
    chatInput: 'Ask for a change',
  },
  pricing: {
    title: 'Pricing',
    sub: 'Start free. Upgrade when you post every week.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    perMonth: '/ month',
    billedYearly: (total: number) => `$${total} billed yearly`,
    choose: (plan: string) => `Choose ${plan}`,
    startFree: 'Start for free',
  },
  cta: {
    title: { before: 'Your next carousel starts with ', marked: 'one sentence.', after: '' } as Marked,
    button: 'Start for free',
  },
  footer: {
    tagline: 'Instagram carousels from a single idea.',
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
    title: 'KaruAI - קרוסלות לאינסטגרם מרעיון אחד',
    description: 'כותבים רעיון ומקבלים קרוסלה מעוצבת לאינסטגרם: טקסט, עימוד ותמונות לכל שקף, והכל ניתן לעריכה.',
  },
  nav: { how: 'איך זה עובד', editor: 'העורך', pricing: 'מחירים', login: 'התחברות', start: 'התחילו בחינם', menu: 'תפריט', otherLanguage: 'English' },
  hero: {
    title: { before: 'קרוסלות שעוצרות את ', marked: 'הגלילה.', after: '' },
    sub: 'כותבים רעיון ומקבלים קרוסלה מעוצבת לאינסטגרם: טקסט, עימוד ותמונות לכל שקף. אחר כך משנים כל פרט בעורך.',
    cta: 'התחילו בחינם',
    secondary: 'איך זה עובד',
    swipe: 'החליקו',
    examplesLabel: 'דוגמה לקרוסלה שנוצרה ב־KaruAI',
  },
  example: {
    cover: '5 טעויות שעסקים קטנים עושים באינסטגרם',
    items: [
      { title: 'מפרסמים בלי תוכנית', body: 'בחרו שלושה נושאים שאתם מכירים הכי טוב ותחליפו ביניהם.' },
      { title: 'אותו פוסט בכל מקום', body: 'אינסטגרם זה לא לינקדאין. כתבו לפיד שאתם נמצאים בו.' },
      { title: 'אין סיבה לעצור', body: 'לשקף הראשון יש תפקיד אחד: לגרום לאנשים להחליק.' },
      { title: 'אין קריאה לפעולה', body: 'אמרו לאנשים מה לעשות עכשיו: לשמור, לשתף או לשלוח הודעה.' },
      { title: 'מוותרים אחרי שבועיים', body: 'חשיפה נבנית לאט. תמשיכו לפרסם.' },
    ],
    end: 'שמרו את זה לפוסט הבא',
    handle: '@yourbrand',
  },
  how: {
    title: 'איך זה עובד',
    steps: [
      { title: 'מתארים', body: 'כותבים נושא, מדביקים פוסט מהבלוג או רושמים את הנקודות שלכם.' },
      { title: 'מקבלים שקפים', body: 'KaruAI כותב את הטקסט, מעמד כל שקף ב־1080×1350 ויוצר תמונות שמתאימות לו.' },
      { title: 'מתאימים לעצמכם', body: 'משנים טקסט, צבעים ותמונות בעורך, ומורידים קובצי PNG או ZIP.' },
    ],
  },
  editor: {
    title: 'כל שקף נשאר עריך',
    sub: 'ה־AI יוצר את הגרסה הראשונה, ובעורך אתם שולטים בכל אלמנט.',
    features: [
      { title: 'מדברים עם העיצוב', body: 'מבקשים רקע כהה יותר או טקסט קצר יותר, והשקפים מתעדכנים.' },
      { title: 'מזיזים הכל', body: 'גוררים, משנים גודל ומעצבים מחדש כל טקסט, צורה ותמונה.' },
      { title: 'תמונה לכל שקף', body: 'יוצרים תמונה חדשה, או משאירים שקף עם טקסט בלבד.' },
      { title: 'מוכן לפרסום', body: 'מורידים כל שקף כ־PNG, או את כל הקרוסלה כ־ZIP.' },
    ],
    chatUser: 'תעשה רקע שחור וכותרת בליים',
    chatAi: 'בוצע. עדכנתי את כל 7 השקפים.',
    chatInput: 'בקשו שינוי',
  },
  pricing: {
    title: 'מחירים',
    sub: 'מתחילים בחינם. משדרגים כשמפרסמים כל שבוע.',
    monthly: 'חודשי',
    yearly: 'שנתי',
    perMonth: '/ חודש',
    billedYearly: total => `$${total} בחיוב שנתי`,
    choose: plan => `בחירה ב־${plan}`,
    startFree: 'התחילו בחינם',
  },
  cta: {
    title: { before: 'הקרוסלה הבאה שלכם מתחילה ', marked: 'במשפט אחד.', after: '' },
    button: 'התחילו בחינם',
  },
  footer: {
    tagline: 'קרוסלות לאינסטגרם מרעיון אחד.',
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
