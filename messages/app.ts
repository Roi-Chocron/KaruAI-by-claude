import type { Messages } from '@/lib/i18n';

// The signed-in pages: the shared header, the gallery, billing and account

// How long ago a carousel was edited is counted in these (the browsers' own Hebrew wording is broken)
export type TimeUnit = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const en = {
  shell: {
    carousels: 'Carousels',
    billing: 'Plan and billing',
    account: 'Account',
    admin: 'Admin',
    logOut: 'Log out',
    menu: 'Open menu',
    closeMenu: 'Close menu',
    nav: 'Main',
    loading: 'Loading…',
  },
  gallery: {
    title: 'Your carousels',
    sub: 'Everything saves as you go.',
    newCarousel: 'New carousel',
    creating: 'Creating…',
    untitled: 'Untitled carousel',
    empty: 'Empty',
    noPreview: 'No preview',
    slides: (n: number) => (n === 0 ? 'No slides' : n === 1 ? '1 slide' : `${n} slides`),
    edited: (when: string) => `edited ${when}`,
    justNow: 'just now',
    ago: (n: number, unit: TimeUnit) => {
      if (n === 1 && unit === 'day') return 'yesterday';
      if (n === 1 && unit !== 'minute' && unit !== 'hour') return `last ${unit}`;
      return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
    },
    delete: 'Delete carousel',
    deleteNamed: (title: string) => `Delete ${title}`,
    confirmDeleteTitle: 'Delete this carousel?',
    confirmDelete: (title: string) => `"${title}" and its slides will be deleted. This can't be undone.`,
    deleting: 'Deleting…',
    cancel: 'Cancel',
    dismiss: 'Dismiss',
    deleteFailed: "Couldn't delete the carousel. Try again.",
    createFailed: "Couldn't create a carousel. Try again.",
    loadFailed: "Couldn't load your carousels. Refresh the page to try again.",
    limitTitle: 'Monthly limit reached',
    limitReached: (limit?: number) =>
      limit
        ? `Your plan includes ${limit === 1 ? '1 new carousel' : `${limit} new carousels`} a month, and you've used them all. Upgrade your plan or wait for next month.`
        : "You've used all the new carousels your plan includes this month. Upgrade your plan or wait for next month.",
    seePlans: 'See the plans',
    emptyTitle: { before: 'Start with ', marked: 'one sentence.', after: '' },
    emptyBody: 'Open a new carousel, tell KaruAI what it should say, and the slides appear. You can change everything after.',
    starter: {
      heading: 'Or start from an example',
      note: 'The editor opens with the example typed in, so you can change it before you send.',
      prompts: [
        '5 tips for better sleep, in a calm night-sky style',
        'Launch announcement for a new coffee shop opening this Friday',
        '5 myths about my industry that customers still believe',
        'The checklist I wish I had when I started',
      ],
    },
  },
  billing: {
    title: 'Plan and billing',
    sub: "Your plan, this month's usage and the other plans.",
    current: 'Your plan',
    perMonth: '/ month',
    resets: (date: string) => `Limits reset on ${date}.`,
    carousels: 'New carousels',
    messages: 'AI design messages',
    images: 'AI images',
    unlimited: 'Unlimited',
    payment: 'Payment method',
    paymentBody: 'Online payments are on the way. Until then, contact us to change your plan.',
    invoices: 'Invoices',
    invoicesBody: 'No invoices yet.',
    plans: 'Plans',
    yourPlan: 'Your current plan',
    soon: 'Coming soon',
    loadFailed: "Couldn't load your plan.",
    usedOf: (used: string, limit: string) => `${used} of ${limit} used`,
    usedUnlimited: (used: string) => `${used} used, no limit`,
    limitReached: (what: string) => `This month's limit is used up: ${what}.`,
    seePlans: 'See the bigger plans',
  },
  account: {
    title: 'Account',
    profile: 'Profile',
    signedInAs: 'Signed in with Google as',
    name: 'Name',
    save: 'Save',
    saved: 'Saved',
    nameSaved: 'Your name is saved.',
    saveFailed: "Couldn't save the name.",
    nameInvalid: 'The name must be 1 to 100 characters.',
    plan: (name: string) => `Plan: ${name}`,
    managePlan: 'Plan and billing',
    thisMonth: (label: string) => `${label} this month`,
    data: 'Your data',
    download: 'Download my data',
    logOutAll: 'Sign out everywhere',
    confirmLogOutAll: 'Sign out on every device, this one included?',
    downloadNote: (n: number) => `A JSON file with your account, usage and every carousel (${n}).`,
    deleteTitle: 'Delete account',
    deleteBody: (n: number) =>
      n === 0
        ? "Deletes your account. This can't be undone."
        : `Deletes your account, ${n === 1 ? 'your carousel and its images' : `all ${n} carousels and their images`}. This can't be undone.`,
    // The email is wrapped in left-to-right isolation marks so it reads correctly inside right-to-left text
    confirmPlaceholder: (email: string) => `Type \u2066${email}\u2069 to confirm`,
    confirmLabel: (email: string) => `Type \u2066${email}\u2069 to confirm deleting your account`,
    confirmDelete: 'Delete your account and all your carousels for good? This can’t be undone.',
    confirmMismatch: 'Type your email address to confirm.',
    onlyAdmin: 'You are the only admin. Make someone else an admin before deleting your account.',
    deleting: 'Deleting…',
    deleteButton: 'Delete account',
    deleteFailed: "Couldn't delete the account.",
    loadFailed: "Couldn't load your account.",
  },
};

export type AppMessages = typeof en;

const he: AppMessages = {
  shell: {
    carousels: 'קרוסלות',
    billing: 'תוכנית ותשלום',
    account: 'חשבון',
    admin: 'ניהול',
    logOut: 'התנתקות',
    menu: 'פתיחת התפריט',
    closeMenu: 'סגירת התפריט',
    nav: 'ראשי',
    loading: 'טוען…',
  },
  gallery: {
    title: 'הקרוסלות שלכם',
    sub: 'הכל נשמר תוך כדי עבודה.',
    newCarousel: 'קרוסלה חדשה',
    creating: 'יוצרים…',
    untitled: 'קרוסלה ללא שם',
    empty: 'ריקה',
    noPreview: 'אין תצוגה מקדימה',
    slides: n => (n === 0 ? 'אין שקפים' : n === 1 ? 'שקף אחד' : n === 2 ? 'שני שקפים' : `${n} שקפים`),
    edited: when => `נערכה ${when}`,
    justNow: 'הרגע',
    ago: (n, unit) => {
      // [one, two, many] and, for day/week/month/year, the word for "last ..."
      const words: Record<TimeUnit, [string, string, string]> = {
        minute: ['לפני דקה', 'לפני שתי דקות', 'דקות'],
        hour: ['לפני שעה', 'לפני שעתיים', 'שעות'],
        day: ['אתמול', 'שלשום', 'ימים'],
        week: ['בשבוע שעבר', 'לפני שבועיים', 'שבועות'],
        month: ['בחודש שעבר', 'לפני חודשיים', 'חודשים'],
        year: ['בשנה שעברה', 'לפני שנתיים', 'שנים'],
      };
      const [one, two, many] = words[unit];
      return n === 1 ? one : n === 2 ? two : `לפני ${n} ${many}`;
    },
    delete: 'מחיקת הקרוסלה',
    deleteNamed: title => `מחיקת ${title}`,
    confirmDeleteTitle: 'למחוק את הקרוסלה?',
    confirmDelete: title => `"${title}" והשקפים שלה יימחקו. אי אפשר לבטל את זה.`,
    deleting: 'מוחקים…',
    cancel: 'ביטול',
    dismiss: 'סגירה',
    deleteFailed: 'לא הצלחנו למחוק את הקרוסלה. נסו שוב.',
    createFailed: 'לא הצלחנו ליצור קרוסלה. נסו שוב.',
    loadFailed: 'לא הצלחנו לטעון את הקרוסלות שלכם. רעננו את הדף כדי לנסות שוב.',
    limitTitle: 'הגעתם למגבלה החודשית',
    limitReached: limit =>
      limit
        ? `התוכנית שלכם כוללת ${limit === 1 ? 'קרוסלה חדשה אחת' : `${limit} קרוסלות חדשות`} בחודש, וכבר השתמשתם בכולן. שדרגו את התוכנית או חכו לחודש הבא.`
        : 'השתמשתם בכל הקרוסלות החדשות שהתוכנית שלכם כוללת החודש. שדרגו את התוכנית או חכו לחודש הבא.',
    seePlans: 'לתוכניות',
    emptyTitle: { before: 'מתחילים ב', marked: 'משפט אחד.', after: '' },
    emptyBody: 'פתחו קרוסלה חדשה, ספרו ל־KaruAI מה היא צריכה להגיד, והשקפים יופיעו. אחר כך אפשר לשנות הכל.',
    starter: {
      heading: 'או התחילו מדוגמה',
      note: 'העורך ייפתח עם הדוגמה כבר כתובה, כך שאפשר לשנות אותה לפני השליחה.',
      prompts: [
        '5 טיפים לשינה טובה יותר, בסגנון רגוע של שמי לילה',
        'הכרזה על פתיחת בית קפה חדש ביום שישי הקרוב',
        '5 מיתוסים על התחום שלי שלקוחות עדיין מאמינים בהם',
        'הצ׳קליסט שהייתי רוצה שיהיה לי כשהתחלתי',
      ],
    },
  },
  billing: {
    title: 'תוכנית ותשלום',
    sub: 'התוכנית שלכם, השימוש החודשי והתוכניות האחרות.',
    current: 'התוכנית שלכם',
    perMonth: '/ חודש',
    resets: date => `המגבלות מתאפסות ב־${date}.`,
    carousels: 'קרוסלות חדשות',
    messages: 'הודעות עיצוב ל־AI',
    images: 'תמונות AI',
    unlimited: 'ללא הגבלה',
    payment: 'אמצעי תשלום',
    paymentBody: 'תשלום אונליין יגיע בקרוב. עד אז, כדי לשנות תוכנית פנו אלינו.',
    invoices: 'חשבוניות',
    invoicesBody: 'אין עדיין חשבוניות.',
    plans: 'תוכניות',
    yourPlan: 'התוכנית הנוכחית שלכם',
    soon: 'בקרוב',
    loadFailed: 'לא הצלחנו לטעון את התוכנית שלכם.',
    usedOf: (used, limit) => `נוצלו ${used} מתוך ${limit}`,
    usedUnlimited: used => `נוצלו ${used}, ללא הגבלה`,
    limitReached: what => `המכסה החודשית נוצלה: ${what}.`,
    seePlans: 'לתוכניות הגדולות יותר',
  },
  account: {
    title: 'חשבון',
    profile: 'פרופיל',
    signedInAs: 'מחוברים עם Google בתור',
    name: 'שם',
    save: 'שמירה',
    saved: 'נשמר',
    nameSaved: 'השם נשמר.',
    saveFailed: 'לא הצלחנו לשמור את השם.',
    nameInvalid: 'השם צריך להיות באורך של 1 עד 100 תווים.',
    plan: name => `תוכנית: ${name}`,
    managePlan: 'תוכנית ותשלום',
    thisMonth: label => `${label} החודש`,
    data: 'המידע שלכם',
    download: 'הורדת המידע שלי',
    logOutAll: 'התנתקות מכל המכשירים',
    confirmLogOutAll: 'להתנתק מכל המכשירים, כולל המכשיר הזה?',
    downloadNote: n => `קובץ JSON עם החשבון, השימוש וכל הקרוסלות שלכם (${n}).`,
    deleteTitle: 'מחיקת החשבון',
    deleteBody: n =>
      n === 0
        ? 'החשבון שלכם יימחק. אי אפשר לבטל את זה.'
        : `החשבון שלכם יימחק, ${n === 1 ? 'יחד עם הקרוסלה והתמונות שלה' : `יחד עם כל ${n} הקרוסלות והתמונות שלהן`}. אי אפשר לבטל את זה.`,
    confirmPlaceholder: email => `הקלידו \u2066${email}\u2069 לאישור`,
    confirmLabel: email => `הקלידו \u2066${email}\u2069 כדי לאשר את מחיקת החשבון`,
    confirmDelete: 'למחוק לצמיתות את החשבון ואת כל הקרוסלות? אי אפשר לבטל את זה.',
    confirmMismatch: 'הקלידו את כתובת האימייל שלכם לאישור.',
    onlyAdmin: 'אתם המנהלים היחידים. הפכו מישהו אחר למנהל לפני שתמחקו את החשבון.',
    deleting: 'מוחק…',
    deleteButton: 'מחיקת החשבון',
    deleteFailed: 'לא הצלחנו למחוק את החשבון.',
    loadFailed: 'לא הצלחנו לטעון את החשבון שלכם.',
  },
};

export const appMessages: Messages<AppMessages> = { en, he };
