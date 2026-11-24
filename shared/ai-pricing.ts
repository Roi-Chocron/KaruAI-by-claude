// What the AI providers charge, to estimate what each request costs (the admin page's AI cost figures). Prices change:
// check the sources on the date below and update both together.
// Gemini: https://ai.google.dev/gemini-api/docs/pricing (paid tier; the free tier costs nothing but has limits).
// Pollinations: https://gen.pollinations.ai/image/models, in pollen per image, taken as $1 per pollen.
export const PRICES_CHECKED = '2026-11-22';

// US dollars per million tokens: input, output (thinking included) and cached input
export const GEMINI_PRICES: Record<string, { input: number; output: number; cached: number }> = {
    'gemini-3-flash-preview': { input: 0.5, output: 3, cached: 0.05 },
    'gemini-3.5-flash-lite': { input: 0.3, output: 2.5, cached: 0.03 },
    'gemini-3.5-flash': { input: 0.3, output: 2.5, cached: 0.03 },
};

// US dollars per image, by Pollinations model name or alias
export const IMAGE_PRICES: Record<string, number> = {
    zimage: 0.004,
    'tongyi-mai/z-image-turbo': 0.004,
    flux: 0.002,
    'black-forest-labs/flux.1-schnell': 0.002,
};

// The price used for a model missing from the tables, so an unknown model never looks free
const FALLBACK_GEMINI = { input: 0.5, output: 3, cached: 0.05 };
const FALLBACK_IMAGE = 0.004;

export interface TokenUsage {
    input: number;
    output: number;
    cached: number;
}

// A Gemini call's cost in millionths of a dollar. Cached tokens are part of the input and cost less.
export function geminiCostMicroUsd(model: string, usage: TokenUsage): number {
    const price = GEMINI_PRICES[model] ?? FALLBACK_GEMINI;
    const fresh = Math.max(0, usage.input - usage.cached);
    return Math.round(fresh * price.input + usage.cached * price.cached + usage.output * price.output);
}

export const imageCostMicroUsd = (model: string) => Math.round((IMAGE_PRICES[model] ?? FALLBACK_IMAGE) * 1_000_000);

// --- Comparing AI cost with what a plan brings in ---

// Shekels per dollar, for comparing dollar costs with shekel prices (check it with the prices above)
export const ILS_PER_USD = 3.7;
export const VAT_RATE = 0.18;
// Polar's Starter plan (organizations created from May 2026): 5% + 50¢ per payment, plus 1.5% for non-US cards such as
// Israeli ones. An older "Early Member" organization pays 4% + 40¢ + 0.5% on subscriptions instead.
export const POLAR_FEE = { percent: 6.5, fixedUsd: 0.5 };

// What KaruAI keeps of a monthly price in shekels: without VAT (Polar pays it) and without Polar's fee
export function planNetIls(priceIls: number): number {
    if (!priceIls) return 0;
    return priceIls / (1 + VAT_RATE) - (priceIls * POLAR_FEE.percent) / 100 - POLAR_FEE.fixedUsd * ILS_PER_USD;
}

export const microUsdToIls = (micro: number) => (micro / 1_000_000) * ILS_PER_USD;
