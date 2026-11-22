// The subscription plans: what each one costs and allows. Shared by the site (pricing, billing page) and the API
// (quota checks). The paid plans are Polar products (POLAR_PRODUCT_* in wrangler.jsonc); the prices here are only
// shown on the site, so keep them equal to the prices set on Polar.

export type PlanId = 'free' | 'basic' | 'pro' | 'vip';
export type PaidPlanId = Exclude<PlanId, 'free'>;

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
    // ILS per month
    monthlyPrice: number;
    limits: PlanLimits;
    watermark: boolean;
    features: string[];
    highlighted?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
    free: {
        id: 'free',
        name: 'Free',
        badge: 'Free',
        description: 'For trying KaruAI and creating your first carousels.',
        monthlyPrice: 0,
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
    basic: {
        id: 'basic',
        name: 'Basic',
        badge: 'Starter',
        description: 'For creators who post a few carousels every month.',
        monthlyPrice: 29,
        limits: { carouselsPerMonth: 20, aiMessagesPerMonth: 250, aiImagesPerMonth: 120 },
        watermark: false,
        features: [
            '20 new carousels per month',
            '250 AI design messages per month',
            '120 AI images per month',
            'No watermark',
            'Email support',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        badge: 'Most popular',
        description: 'For creators and marketers who publish every week.',
        monthlyPrice: 59,
        limits: { carouselsPerMonth: 60, aiMessagesPerMonth: 700, aiImagesPerMonth: 350 },
        watermark: false,
        features: [
            '60 new carousels per month',
            '700 AI design messages per month',
            '350 AI images per month',
            'No watermark',
            'Email support',
        ],
        highlighted: true,
    },
    vip: {
        id: 'vip',
        name: 'VIP',
        badge: 'For teams',
        description: 'For agencies and heavy users producing content for several brands.',
        monthlyPrice: 119,
        limits: { carouselsPerMonth: null, aiMessagesPerMonth: 2000, aiImagesPerMonth: 1000 },
        watermark: false,
        features: [
            'Unlimited carousels',
            '2,000 AI design messages per month',
            '1,000 AI images per month',
            'No watermark',
            'Priority support',
        ],
    },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];
export const PAID_PLAN_IDS = PLAN_IDS.filter((id): id is PaidPlanId => id !== 'free');
export const isPlanId = (value: unknown): value is PlanId => typeof value === 'string' && value in PLANS;
export const isPaidPlanId = (value: unknown): value is PaidPlanId => isPlanId(value) && value !== 'free';

// Higher ranks give more; a user with several subscriptions gets the best one
export const planRank = (id: PlanId) => PLAN_IDS.indexOf(id);

export const formatPrice = (amount: number) => `₪${amount}`;
