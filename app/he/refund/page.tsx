import Link from 'next/link';
import { LegalPage, legalMetadata } from '@/components/legal-page';

export const metadata = legalMetadata('he', '/refund', 'מדיניות ביטול והחזרים - KaruAI', 'תנאי הביטול וההחזר הכספי של מינויים ורכישות ב־KaruAI.');

export default function HebrewRefundPage() {
  return (
      <LegalPage locale="he" path="/refund" title="מדיניות ביטול והחזרים" updated="נובמבר 2026">

        <section>
          <h2>1. ביטול מינוי</h2>
          <p>
            אתם יכולים לבטל את המינוי החודשי שלכם בכל עת ב&quot;ניהול המינוי&quot; בעמוד <Link href="/billing">תוכנית ותשלום</Link> (דרך ספק התשלומים שלנו, Polar), או בפנייה לשירות הלקוחות.
          </p>
          <p>
            עם הביטול:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
            <li>חיובי החידוש האוטומטי ייפסקו מיד לכל מחזורי החיוב הבאים.</li>
            <li>הגישה המלאה לתכונות התוכנית בתשלום תישאר אצלכם עד סוף מחזור החיוב הנוכחי.</li>
            <li>בתום תקופת החיוב החשבון שלכם יעבור לתוכנית Free החינמית, וכל הקרוסלות הקודמות שלכם יישמרו.</li>
          </ul>
        </section>

        <section>
          <h2>2. זכאות להחזר כספי</h2>
          <p>
            מכיוון ש־KaruAI מספקת משאבי מחשוב ויצירת תמונות באמצעות בינה מלאכותית באופן מיידי עם ההרשמה:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
            <li>
              <strong>תוכניות חודשיות:</strong> דמי המינוי החודשי אינם ניתנים להחזר לאחר שתקופת החיוב התחילה ובוצעו יצירות.
            </li>
            <li>
              <strong>תקלות טכניות:</strong> אם תקלה טכנית מתמשכת מצדנו מונעת מכם לחלוטין להשתמש בשירות, נבחן את המקרה שלכם לצורך החזר מלא או חלקי.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. איך מבקשים החזר</h2>
          <p>
            כדי להגיש בקשת ביטול או החזר:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
            <li>שלחו מייל לכתובת <a href="mailto:support@karuai.com" dir="ltr">support@karuai.com</a> עם הנושא &quot;Refund Request&quot;.</li>
            <li>ציינו את כתובת המייל הרשומה בחשבון ואת מספר החשבונית או מזהה העסקה.</li>
            <li>צוות התמיכה שלנו יבדוק את הפנייה ויחזור אליכם בתוך 1–2 ימי עסקים.</li>
          </ul>
        </section>

        <section>
          <h2>4. זמן הטיפול</h2>
          <p>
            החזרים שאושרו יזוכו דרך Polar, ספק התשלומים שלנו, לאמצעי התשלום המקורי בתוך 5–10 ימי עסקים, בהתאם לזמני הטיפול של הבנק שלכם.
          </p>
        </section>
      </LegalPage>
  );
}
