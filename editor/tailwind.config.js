// Tailwind for the standalone editor page (public/advanced_dashboard_editor.html). It scans only that file, the
// markup and the class names its script uses, and writes public/editor.css (`npm run build:editor-css`).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/advanced_dashboard_editor.html'],
  theme: {
    extend: {
      // The site's palette (black ink, neutral grays, one lime accent) mapped onto the color names this page uses
      colors: {
        gray: { 50: '#FAFAFA', 100: '#F5F5F5', 200: '#E5E5E5', 300: '#D4D4D4', 400: '#737373', 500: '#525252', 600: '#404040' },
        slate: { 50: '#FAFAFA', 600: '#404040', 700: '#171717', 800: '#0A0A0A' },
        indigo: { 50: '#F5F5F5', 100: '#E5E5E5', 400: '#525252', 500: '#0A0A0A', 600: '#0A0A0A', 700: '#262626', 800: '#0A0A0A' },
        lime: { DEFAULT: '#C8F135', deep: '#B5DE1F' },
      },
      fontFamily: { sans: ['Inter', 'Heebo', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
