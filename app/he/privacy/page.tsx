import Link from 'next/link';
import { BusinessValue, EmailLink, Registration } from '@/components/business';
import { BUSINESS } from '@/shared/business';
import { LegalPage, legalMetadata } from '@/components/legal-page';

export const metadata = legalMetadata('he', '/privacy', 'מדיניות פרטיות - KaruAI', 'מדיניות הפרטיות ותקני הגנת המידע של KaruAI עבור המשתמשים שלה.');

export default function HebrewPrivacyPage() {
  return (
      <LegalPage locale="he" path="/privacy" title="מדיניות פרטיות" updated="נובמבר 2026">

        <section>
          <h2>1. סקירה כללית</h2>
          <p>
            ב־<strong>KaruAI</strong> אנחנו מכבדים את הפרטיות שלכם ומחויבים להגנה על מידע אישי. מדיניות פרטיות זו מתארת כיצד אנחנו אוספים, שומרים ומעבדים מידע כשאתם משתמשים בפלטפורמה שלנו. בעל השליטה במאגר המידע הוא <BusinessValue value={BUSINESS.legalNameHe} missing="שם העסק" /> (<Registration locale="he" />), <BusinessValue value={BUSINESS.addressHe} missing="כתובת העסק" />, וניתן לפנות אליו בכתובת <EmailLink email={BUSINESS.privacyEmail} missing="מייל הפרטיות" />.
          </p>
        </section>

        <section>
          <h2>2. המידע שאנחנו אוספים</h2>
          <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
            <li>
              <strong>פרטי חשבון:</strong> כשאתם מתחברים עם Google אנחנו מקבלים את השם, כתובת המייל, תמונת הפרופיל ומזהה חשבון ה־Google שלכם. אנחנו אף פעם לא רואים או שומרים סיסמה.
            </li>
            <li>
              <strong>תוכן משתמש:</strong> ההנחיות שלכם, השקפים והטקסט של הקרוסלות, תמונות שהעליתם, תמונות שנוצרו, והיסטוריית העריכה והשיחה של כל קרוסלה.
            </li>
            <li>
              <strong>נתוני שימוש:</strong> כמה קרוסלות, הודעות AI ותמונות AI אתם מנצלים בכל חודש, וכמה טוקנים של AI הם צורכים, כדי שנוכל להחיל את מגבלות התוכנית שלכם.
            </li>
            <li>
              <strong>מידע טכני:</strong> כתובת ה־IP שלכם (משמשת להגבלת קצב הבקשות ולאבטחה), סוג הדפדפן ועוגיית ההתחברות ששומרת אתכם מחוברים.
            </li>
            <li>
              <strong>סטטיסטיקה:</strong> רק אם אישרתם עוגיות סטטיסטיקה: האופן שבו אתם משתמשים באתר (צפיות בדפים, קליקים, ובסביבת הייצור גם הקלטות גלישה שבהן התוכן מוסתר).
            </li>
          </ul>
        </section>

        <section>
          <h2>3. איך אנחנו משתמשים במידע</h2>
          <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
            <li>כדי לספק את מחולל הקרוסלות מבוסס הבינה המלאכותית: עיצוב שקפים מההנחיות שלכם ויצירת תמונות.</li>
            <li>כדי לנהל את החשבון וההתחברויות שלכם ולהגן על השירות מפני שימוש לרעה.</li>
            <li>כדי להחיל את מגבלות התוכנית שלכם ולנהל את המינוי שלכם.</li>
            <li>כדי לענות לפניות תמיכה.</li>
            <li>בהסכמתכם, כדי להבין איך משתמשים ב־KaruAI ולשפר אותו.</li>
          </ul>
        </section>

        <section>
          <h2>4. ספקי שירות</h2>
          <p>
            אנחנו אף פעם לא מוכרים או משכירים את המידע האישי שלכם. אנחנו משתפים מידע רק עם ספקים שמפעילים עבורנו חלקים מהשירות:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
            <li><strong>Cloudflare</strong> מארחת את האפליקציה ושומרת את החשבון והקרוסלות שלכם.</li>
            <li><strong>Google</strong> מטפלת בהתחברות, וה־Gemini API שלה מקבל את ההנחיות שלכם ואת הקרוסלה הנוכחית כדי לעצב את השקפים.</li>
            <li><strong>Pollinations.ai</strong> מקבלת את תיאורי התמונות (בלי פרטי החשבון שלכם) כדי ליצור את תמונות השקפים.</li>
            <li><strong>Sentry</strong> מקבלת דיווחי שגיאות כדי שנוכל לתקן תקלות.</li>
            <li><strong>PostHog,&rlm; Google Analytics ו־Microsoft Clarity</strong> מקבלות נתוני שימוש, רק אם אישרתם עוגיות סטטיסטיקה.</li>
            <li><strong>Polar</strong> (polar.sh) מעבדת את התשלומים על התוכניות בתשלום ומקבלת לשם כך את כתובת המייל, השם וכתובת ה־IP שלכם (לפי כתובת ה־IP היא מזהה את המדינה שלכם, לצורכי מס); אנחנו לא רואים ולא שומרים מספרי כרטיס אשראי.</li>
          </ul>
        </section>

        <section>
          <h2>5. אבטחת המידע ושמירתו</h2>
          <p>
            כל התעבורה מוצפנת ב־HTTPS. עוגיות ההתחברות מוגדרות כ־HttpOnly, ונשמר רק גיבוב (hash) של כל אסימון התחברות. אנחנו שומרים את המידע שלכם כל עוד החשבון שלכם קיים; רשומות השימוש היומיות נמחקות לאחר שנה. כשאתם מוחקים את החשבון, גם הקרוסלות והתמונות שלכם נמחקות.
          </p>
        </section>

        <section>
          <h2>6. הזכויות שלכם</h2>
          <p>
            אתם יכולים להוריד את כל המידע שלכם ולמחוק את החשבון בכל עת בדף <Link href="/account" className="underline">החשבון</Link>, ולשנות את בחירות העוגיות שלכם בדף <Link href="/he/cookies" className="underline">מדיניות העוגיות</Link>. לתיקונים או לכל בקשה אחרת, פנו אלינו.
          </p>
        </section>

        <section>
          <h2>7. צרו קשר</h2>
          <p>
            לכל שאלה בנוגע למדיניות פרטיות זו, כתבו לנו לכתובת <EmailLink email={BUSINESS.privacyEmail} missing="מייל הפרטיות" />.
          </p>
        </section>
      </LegalPage>
  );
}
