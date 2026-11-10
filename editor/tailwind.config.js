// Tailwind for the standalone editor page (public/advanced_dashboard_editor.html). It scans only that file, the
// markup and the class names its script uses, and writes public/editor.css (`npm run build:editor-css`).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/advanced_dashboard_editor.html'],
  theme: { extend: {} },
  plugins: [],
};
