import { LegalPage, LegalTable, legalMetadata } from '@/components/legal-page';
import { ShieldCheck, BarChart3, Sliders, AlertCircle } from 'lucide-react';
import { CookieSettingsButton } from '@/components/cookie-banner';

export const metadata = legalMetadata('he', '/cookies', 'מדיניות עוגיות ומעקב - KaruAI', 'פרטים על העוגיות, טכנולוגיות המעקב, כלי הסטטיסטיקה וכלי ניטור השגיאות שבהם KaruAI משתמשת.');

export default function HebrewCookiesPage() {
  return (
      <LegalPage locale="he" path="/cookies" title="מדיניות עוגיות ומעקב" updated="נובמבר 2026">

        <section>
          <h2>1. מהן עוגיות וטכנולוגיות מעקב?</h2>
          <p>
            עוגיות (Cookies) ואחסון מקומי (Local Storage) הם קובצי טקסט קטנים ופיסות מידע שנשמרים במכשיר שלכם כשאתם גולשים באתרים. טכנולוגיות מעקב כמו סקריפטים של סטטיסטיקה, יומני הפעלה וכלי ניטור שגיאות עוזרות לנו לשמור על אבטחת הפלטפורמה, להבין איך משתמשים בתכונות שלנו ולאבחן תקלות תוכנה, כדי להבטיח חוויית שימוש חלקה.
          </p>
        </section>

        <section>
          <h2>2. סוגי העוגיות והכלים שבהם אנחנו משתמשים</h2>
          <p>
            KaruAI משתמשת רק בכלים ההכרחיים ובכלי הביצועים הדרושים כדי להפעיל באופן אמין את שירות יצירת הקרוסלות באמצעות בינה מלאכותית:
          </p>

          <div className="mt-6 space-y-4">
            {/* Category 1 */}
            <div className="p-5 rounded-xl border border-line bg-mist space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0 text-ink" aria-hidden="true" />
                <h3 className="font-bold text-ink">1. עוגיות הכרחיות ועוגיות התחברות</h3>
              </div>
              <p className="text-sm text-graphite leading-relaxed">
                העוגיות האלה חיוניות כדי שתוכלו להתחבר, לנווט באפליקציה ולגשת בצורה מאובטחת לקרוסלות הפרטיות שלכם ולאזור החיוב. הפלטפורמה לא יכולה לפעול כראוי בלעדיהן.
              </p>
              <LegalTable label="עוגיות הכרחיות ועוגיות התחברות">
                  <thead className="bg-mist text-ink font-semibold border-b border-line">
                    <tr>
                      <th scope="col">שם / מזהה</th>
                      <th scope="col">ספק</th>
                      <th scope="col">מטרה</th>
                      <th scope="col">תוקף</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <td className="font-mono"><bdi>karu_session</bdi></td>
                      <td>KaruAI (צד ראשון)</td>
                      <td>אסימון התחברות מאובטח מסוג HTTP-only, לאימות משתמשים מחוברים ולהגנה על הגישה לחשבון.</td>
                      <td>30 יום</td>
                    </tr>
                    <tr>
                      <td className="font-mono"><bdi>karu_signed_in</bdi></td>
                      <td>KaruAI (צד ראשון)</td>
                      <td>מסמנת לאתר שאתם מחוברים, כדי שדף הבית יוכל לפתוח את הקרוסלות שלכם. אינה מכילה מידע אישי.</td>
                      <td>30 יום</td>
                    </tr>
                    <tr>
                      <td className="font-mono"><bdi>karu_oauth</bdi></td>
                      <td>KaruAI (צד ראשון)</td>
                      <td>מגינה על ההתחברות עם Google מפני זיוף בזמן שאתם מתחברים.</td>
                      <td>10 דקות</td>
                    </tr>
                    <tr>
                      <td className="font-mono"><bdi>karu_consent</bdi></td>
                      <td>KaruAI (צד ראשון)</td>
                      <td>זוכרת את הבחירה שלכם לגבי עוגיות.</td>
                      <td>שנה</td>
                    </tr>
                    <tr>
                      <td className="font-mono"><bdi>karu_locale</bdi></td>
                      <td>KaruAI (צד ראשון)</td>
                      <td>זוכרת אם בחרתם באנגלית או בעברית. אינה מכילה מידע אישי.</td>
                      <td>שנה</td>
                    </tr>
                  </tbody>
                </LegalTable>
            </div>

            {/* Category 2 */}
            <div className="p-5 rounded-xl border border-line bg-mist space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 shrink-0 text-ink" aria-hidden="true" />
                <h3 className="font-bold text-ink">2. סטטיסטיקת מוצר וחוויית משתמש (PostHog)</h3>
              </div>
              <p className="text-sm text-graphite leading-relaxed">
                אנחנו משתמשים ב־<strong>PostHog</strong> כדי להבין איך משתמשים פועלים באתר, למדוד את השימוש בתכונות יצירת הקרוסלות ולשפר את יעילות העבודה.
              </p>
              <LegalTable label="סטטיסטיקת מוצר וחוויית משתמש (PostHog)">
                  <thead className="bg-mist text-ink font-semibold border-b border-line">
                    <tr>
                      <th scope="col">כלי / עוגיות</th>
                      <th scope="col">ספק</th>
                      <th scope="col">מטרה והגנות פרטיות</th>
                      <th scope="col">תוקף</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <td className="font-mono"><bdi>ph_* / posthog-js</bdi></td>
                      <td>PostHog</td>
                      <td>
                        מתעד ניווט בין דפים ואירועי אינטראקציה. בסביבת הייצור, כשהקלטת הגלישה מופעלת, כל הטקסט וכל שדות הקלט מוסתרים לחלוטין, כדי להבטיח שתוכן רגיש של משתמשים לעולם לא ייקלט.
                      </td>
                      <td>עד שנה</td>
                    </tr>
                  </tbody>
                </LegalTable>
            </div>

            {/* Category 3 */}
            <div className="p-5 rounded-xl border border-line bg-mist space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-ink" aria-hidden="true" />
                <h3 className="font-bold text-ink">3. ניטור ביצועים ושגיאות (Sentry)</h3>
              </div>
              <p className="text-sm text-graphite leading-relaxed">
                אנחנו משלבים את <strong>Sentry</strong> כדי לתעד בזמן אמת חריגות באפליקציה בצד הלקוח ובצד השרת, תקלות של חריגה מזמן ההמתנה ב־API וצווארי בקבוק בביצועים, וכך צוות הפיתוח שלנו יכול לזהות באגים ולתקן אותם במהירות.
              </p>
              <LegalTable label="ניטור ביצועים ושגיאות (Sentry)">
                  <thead className="bg-mist text-ink font-semibold border-b border-line">
                    <tr>
                      <th scope="col">כלי / שירות</th>
                      <th scope="col">ספק</th>
                      <th scope="col">מטרה</th>
                      <th scope="col">תוקף</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <td className="font-mono"><bdi>@sentry/nextjs</bdi></td>
                      <td>Sentry (טלמטריה תפקודית)</td>
                      <td>מתעד את מחסנית הקריאות (Call Stack) של שגיאות ומטא־נתונים לאבחון, כשמתרחשות שגיאות לא צפויות בזמן ריצה בדפדפן או בנקודות קצה בשרת.</td>
                      <td>לפי הפעלה / אירוע</td>
                    </tr>
                  </tbody>
                </LegalTable>
            </div>
          </div>
        </section>

        <section>
          <h2>3. פרסום של צד שלישי</h2>
          <p>
            KaruAI <strong>לא</strong> מציגה פרסומות מסחריות של צד שלישי, ואנחנו לא מוכרים את התנהגות הגלישה או את המידע האישי שלכם לרשתות פרסום או לסוחרי מידע של צד שלישי.
          </p>
        </section>

        <section>
          <h2 className="flex items-center gap-3"><Sliders className="w-7 h-7 shrink-0" aria-hidden="true" />4. איך אפשר לנהל עוגיות</h2>
          <p>
            רוב הדפדפנים המודרניים מאפשרים לשלוט בהגדרות העוגיות דרך ההעדפות שלהם:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
            <li>עוגיות הסטטיסטיקה והקלטות הגלישה משמשות רק אחרי שבחרתם &quot;אישור הכל&quot; בבאנר העוגיות. אפשר לשנות את הבחירה בכל עת עם הכפתור שלמטה.</li>
            <li>אפשר להגדיר את הדפדפן כך שיחסום את כל העוגיות או יתריע עליהן.</li>
            <li>אפשר למחוק בכל עת עוגיות קיימות ונתונים שמורים באחסון המקומי דרך הגדרות הדפדפן.</li>
            <li>שימו לב: חסימת עוגיות ההתחברות החיוניות תמנע מכם להתחבר וליצור קרוסלות ב־KaruAI.</li>
          </ul>
          <div className="pt-2 [&>button]:min-h-10"><CookieSettingsButton locale="he" /></div>
        </section>

        <section>
          <h2>5. צרו קשר</h2>
          <p>
            לכל שאלה או משוב בנוגע לשימוש שלנו בעוגיות או בטכנולוגיות מעקב, אתם מוזמנים לפנות אלינו בכתובת{' '}
            <a href="mailto:privacy@karuai.com" dir="ltr">privacy@karuai.com</a>.
          </p>
        </section>
      </LegalPage>
  );
}
