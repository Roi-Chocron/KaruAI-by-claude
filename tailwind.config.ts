import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // The brand palette: black ink on white paper, grays for structure, lime as the one accent.
      // Lime is a fill only; text on it is always ink, never lime text on white.
      colors: {
        ink: '#0A0A0A',
        graphite: '#525252',
        line: '#E5E5E5',
        mist: '#F5F5F5',
        paper: '#FFFFFF',
        lime: { DEFAULT: '#C8F135', deep: '#B5DE1F' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-heebo)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-karantina)', 'var(--font-heebo)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
