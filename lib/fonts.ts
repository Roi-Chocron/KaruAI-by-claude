import { Heebo, Inter, Karantina } from 'next/font/google';

// Self-hosted at build time, so visitors' browsers never call Google Fonts.
// Text: Inter for Latin, Heebo for the Hebrew letters Inter lacks. Headlines: Karantina (Latin and Hebrew).
export const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
export const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-heebo', display: 'swap' });
export const karantina = Karantina({ subsets: ['hebrew', 'latin'], weight: ['400', '700'], variable: '--font-karantina', display: 'swap' });

export const fontVariables = `${inter.variable} ${heebo.variable} ${karantina.variable}`;
