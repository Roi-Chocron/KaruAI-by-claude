import type { Messages } from '@/lib/i18n';

// The carousel editor page: the frame around the editor and the notice on narrow screens. The editor itself
// (public/advanced_dashboard_editor.html) is a static page with its own translations.

const en = {
  tabTitle: 'Editor - KaruAI',
  frameTitle: 'KaruAI carousel editor',
  notice: {
    title: 'The editor works best on a computer',
    body: 'Designing slides needs a bigger screen. Open this carousel on a laptop or desktop for the full editor.',
    back: 'Back to my carousels',
    continue: 'Continue anyway',
  },
};

const he: typeof en = {
  tabTitle: 'עורך - KaruAI',
  frameTitle: 'עורך הקרוסלות של KaruAI',
  notice: {
    title: 'העורך עובד הכי טוב במחשב',
    body: 'לעיצוב שקפים צריך מסך גדול יותר. פתחו את הקרוסלה הזאת במחשב נייד או נייח כדי לקבל את העורך המלא.',
    back: 'חזרה לקרוסלות שלי',
    continue: 'להמשיך בכל זאת',
  },
};

export const editorMessages: Messages<typeof en> = { en, he };
