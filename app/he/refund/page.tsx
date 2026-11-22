import Link from 'next/link';
import { BusinessValue, EmailLink, PhoneLink } from '@/components/business';
import { BUSINESS } from '@/shared/business';
import { LegalPage, legalMetadata } from '@/components/legal-page';
import { PLANS } from '@/shared/plans';

export const metadata = legalMetadata('he', '/refund', 'מדיניות ביטולים והחזרים - KaruAI', 'איך מבטלים מינוי ל־KaruAI, מתי מקבלים כסף בחזרה, ומה קורה בחשבון אחרי שתוכנית בתשלום מסתיימת.');

// לפי חוק הגנת הצרכן (סעיפים 13ד, 14ג, 14ה ו־14ט). לצרכנים בישראל הנוסח העברי הוא הקובע.
export default function HebrewRefundPage() {
  const free = PLANS.free.limits;
  return (
    <LegalPage locale="he" path="/refund" title="מדיניות ביטולים והחזרים" updated="נובמבר 2026" translated={false}>

      <section>
        <h2>1. אפשר לבטל בכל רגע, בכל אחת מהדרכים האלה</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li><strong>באתר:</strong> בדף <Link href="/he/cancel">ביטול עסקה</Link>, עם התחברות או בלי, או ב&quot;ניהול המינוי&quot; בדף <Link href="/billing">תוכנית ותשלום</Link>.</li>
          <li><strong>במייל:</strong> <EmailLink email={BUSINESS.supportEmail} missing="מייל התמיכה" /></li>
          <li><strong>בטלפון:</strong> <PhoneLink phone={BUSINESS.phone} missing="מספר הטלפון" /></li>
          <li><strong>בדואר:</strong> <BusinessValue value={BUSINESS.addressHe} missing="כתובת העסק" /></li>
        </ul>
        <p>
          כשמבטלים במייל, בטלפון או בדואר, כתבו לנו את שמכם ואת כתובת המייל של חשבון ה־KaruAI שלכם (מספר תעודת הזהות עוזר לנו למצוא אותו). נפסיק את החיובים
          תוך 3 ימי עסקים מקבלת הבקשה ונאשר את הביטול בכתב. ביטול באתר נכנס לתוקף מיד.
        </p>
      </section>

      <section>
        <h2>2. בתוך 14 ימים מהתשלום הראשון</h2>
        <p>
          אפשר לבטל בתוך 14 ימים מיום ההצטרפות למינוי ולקבל את התשלום בחזרה, בניכוי שווי הימים שכבר נוצלו. אנחנו לא גובים דמי ביטול.
        </p>
      </section>

      <section>
        <h2>3. אחרי 14 הימים הראשונים</h2>
        <p>בוחרים אחת מהאפשרויות:</p>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li><strong>ביטול בסוף התקופה:</strong> התוכנית נשארת עד סוף החודש ששולם, ולא יהיו חיובים נוספים.</li>
          <li><strong>סיום עכשיו:</strong> התוכנית מסתיימת מיד, ומקבלים בחזרה את החלק של החודש הנוכחי שלא נוצל, לפי מספר הימים שנותרו.</li>
        </ul>
        <p>אם תקלה אצלנו מונעת מכם להשתמש ב־KaruAI, ספרו לנו ונחזיר את התשלום על הזמן שלא יכולתם להשתמש בשירות.</p>
      </section>

      <section>
        <h2>4. איך ומתי מקבלים את הכסף</h2>
        <p>
          התשלומים מטופלים על ידי Polar (polar.sh), המשווקת שלנו והגורם המוכר בפועל, ולכן החיוב בכרטיס מופיע בשם Polar. ההחזרים חוזרים לכרטיס שבו שילמתם
          תוך 14 ימים מהביטול; ייתכן שיעברו עוד כמה ימים עד שהבנק יציג אותם.
        </p>
      </section>

      <section>
        <h2>5. אחרי שתוכנית בתשלום מסתיימת</h2>
        <ul className="list-disc list-inside space-y-1.5 text-graphite ps-2">
          <li>החשבון עובר לתוכנית החינמית: {free.carouselsPerMonth} קרוסלות חדשות, {free.aiMessagesPerMonth} הודעות AI ו־{free.aiImagesPerMonth} תמונות AI בחודש.</li>
          <li>בקבצים שתייצאו מעכשיו יופיע שוב סימן המים הקטן של KaruAI.</li>
          <li>כל הקרוסלות נשארות בחשבון, ואפשר להמשיך לפתוח, לערוך ולייצא אותן.</li>
        </ul>
      </section>

      <section>
        <h2>6. שאלות</h2>
        <p>
          כתבו לנו לכתובת <EmailLink email={BUSINESS.supportEmail} missing="מייל התמיכה" /> או היכנסו ל<Link href="/he/contact">דף יצירת הקשר</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
