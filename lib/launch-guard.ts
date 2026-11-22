import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { missingBusinessDetails } from '../shared/business';

// Pages that still show a lime <Placeholder> for text the owner has to supply
function filesWithPlaceholders(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) found.push(...filesWithPlaceholders(file));
    else if (/\.tsx?$/.test(name) && readFileSync(file, 'utf8').includes('<Placeholder')) found.push(file);
  }
  return found;
}

// Run by next.config.ts on `next build`. Selling without the seller's details breaks Israeli consumer law, so a build
// for the real address stops while shared/business.ts has empty fields or a page under app/ still has a placeholder.
// Builds for the example address (local, CI) only list what is left.
export function checkLaunchReadiness(siteUrl: string, root = process.cwd()) {
  const missing = missingBusinessDetails();
  const pages = filesWithPlaceholders(join(root, 'app')).map(file => file.slice(root.length + 1));
  if (!missing.length && !pages.length) return;
  const message = [
    'KaruAI is not ready to publish:',
    ...(missing.length ? [`  shared/business.ts is missing: ${missing.join(', ')}`] : []),
    ...(pages.length ? [`  these pages still show placeholders: ${pages.join(', ')}`] : []),
  ].join('\n');
  if (/(^|\.)example(\.|$)/.test(new URL(siteUrl).hostname)) {
    console.warn(`${message}\n  (only a warning: NEXT_PUBLIC_SITE_URL is the example address)`);
    return;
  }
  throw new Error(`${message}\nFill them in before building for ${siteUrl}.`);
}
