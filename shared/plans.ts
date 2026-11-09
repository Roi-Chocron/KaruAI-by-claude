// The subscription plans: what each one costs and allows. Shared by the site (pricing, billing page) and the API
// (quota checks). PLACEHOLDER CONTENT: the prices and limits are examples until the real pricing is decided.

export type PlanId = 'free' | 'pro' | 'agency';

export interface PlanLimits {
    // Per calendar month (UTC); null means unlimited
    carouselsPerMonth: number | null;
    aiMessagesPerMonth: number | null;
    aiImagesPerMonth: number | null;
}

export interface Plan {
    id: PlanId;
    name: string;
    badge: string;
    description: string;
    // USD per month, and per month when billed yearly
    monthlyPrice: number;
    yearlyMonthlyPrice: number;
    limits: PlanLimits;
    watermark: boolean;
    features: string[];
    highlighted?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
    free: {
        id: 'free',
        name: 'Starter',
        badge: 'Free',
        description: 'For trying KaruAI and creating your first carousels.',
        monthlyPrice: 0,
        yearlyMonthlyPrice: 0,
        limits: { carouselsPerMonth: 5, aiMessagesPerMonth: 40, aiImagesPerMonth: 20 },
        watermark: true,
        features: [
            '5 new carousels per month',
            '40 AI design messages per month',
            '20 AI images per month',
            'Full editor, PNG and ZIP export',
            'Small KaruAI watermark on exports',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        badge: 'Most popular',
        description: 'For creators and marketers who publish every week.',
        monthlyPrice: 29,
        yearlyMonthlyPrice: 24,
        limits: { carouselsPerMonth: 50, aiMessagesPerMonth: 600, aiImagesPerMonth: 300 },
        watermark: false,
        features: [
            '50 new carousels per month',
            '600 AI design messages per month',
            '300 AI images per month',
            'No watermark',
            'Email support',
        ],
        highlighted: true,
    },
    agency: {
        id: 'agency',
        name: 'Agency',
        badge: 'For teams',
        description: 'For agencies producing content for several brands.',
        monthlyPrice: 79,
        yearlyMonthlyPrice: 66,
        limits: { carouselsPerMonth: null, aiMessagesPerMonth: 2500, aiImagesPerMonth: 1200 },
        watermark: false,
        features: [
            'Unlimited carousels',
            '2,500 AI design messages per month',
            '1,200 AI images per month',
            'No watermark',
            'Priority support',
        ],
    },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];
export const isPlanId = (value: unknown): value is PlanId => typeof value === 'string' && value in PLANS;
