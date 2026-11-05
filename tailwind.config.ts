import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    // The dashboard lives at the project root, so scan it explicitly
    './karuai_dashboard.tsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
