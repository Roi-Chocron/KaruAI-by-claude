import Link from 'next/link';
import { LegalPage, legalMetadata } from '@/components/legal-page';
import { BusinessValue, EmailLink, PhoneLink, Registration } from '@/components/business';
import { BUSINESS } from '@/shared/business';

export const metadata = legalMetadata('he', '/contact', 'צור קשר - KaruAI', 'איך פונים ל־KaruAI: מייל, טלפון ודואר, לעזרה בחשבון, בתשלום, בפרטיות או בנגישות.');

// כל דרכי הפנייה, מתוך shared/business.ts; פרטים חסרים מסומנים בירוק
export default function ContactPageHe() {
  const b = BUSINESS;
  return (
    <LegalPage locale="he" path="/contact" title="צור קשר" updated="נובמבר 2026" translated={false}>
      <section>
        <h2>איך פונים אלינו</h2>
        <p>נשמח לעזור בכל עניין: החשבון, תשלום, ביטול, פרטיות, נגישות או כל דבר אחר.</p>
        <ul className="space-y-1.5 ps-2">
          <li><strong>מייל:</strong> <EmailLink email={b.supportEmail} missing="מייל התמיכה" /></li>
          <li>
            <strong>טלפון:</strong> <PhoneLink phone={b.phone} missing="מספר הטלפון" />
            {' ('}<BusinessValue value={b.phoneHoursHe} missing="שעות המענה הטלפוני" />{')'}
          </li>
          <li><strong>דואר:</strong> <BusinessValue value={b.addressHe} missing="כתובת העסק" /></li>
        </ul>
        <p>אנחנו עונים <BusinessValue value={b.replyTimeHe} missing="זמן המענה, למשל תוך 2 ימי עסקים" />.</p>
      </section>

      <section>
        <h2>פניות מסוימות</h2>
        <ul className="space-y-1.5 ps-2">
          <li><strong>ביטול מינוי:</strong> <Link href="/he/cancel">ביטול באתר</Link>, או במייל, בטלפון או בדואר לפי הפרטים למעלה.</li>
          <li><strong>החזרים:</strong> ראו את <Link href="/he/refund">מדיניות הביטולים</Link>.</li>
          <li><strong>פרטיות והמידע שלכם:</strong> <EmailLink email={b.privacyEmail} missing="מייל הפרטיות" /></li>
          <li>
            <strong>נגישות:</strong> רכז הנגישות שלנו,{' '}
            <EmailLink email={b.accessibilityCoordinator.email ?? b.accessibilityEmail} missing="מייל הנגישות" /> (ראו את{' '}
            <Link href="/he/accessibility">הצהרת הנגישות</Link>)
          </li>
          <li><strong>הודעות משפטיות:</strong> <EmailLink email={b.legalEmail} missing="מייל לעניינים משפטיים" /></li>
        </ul>
      </section>

      <section>
        <h2>פרטי העוסק</h2>
        <ul className="space-y-1.5 ps-2">
          <li><strong>שם העסק:</strong> <BusinessValue value={b.legalNameHe} missing="שם העסק" /></li>
          <li>
            <strong>רישום:</strong>{' '}
            <Registration locale="he" />
          </li>
          <li><strong>כתובת:</strong> <BusinessValue value={b.addressHe} missing="כתובת העסק" /></li>
        </ul>
      </section>
    </LegalPage>
  );
}
