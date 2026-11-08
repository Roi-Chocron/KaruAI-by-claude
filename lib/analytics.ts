import posthog from 'posthog-js';
import * as Sentry from '@sentry/nextjs';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Resolves the PostHog API Key:
 * - In production: NEXT_PUBLIC_POSTHOG_PROD_KEY (fallback to NEXT_PUBLIC_POSTHOG_KEY)
 * - In development: NEXT_PUBLIC_POSTHOG_DEV_KEY (fallback to NEXT_PUBLIC_POSTHOG_KEY)
 */
export const getPostHogKey = (): string | undefined => {
  if (isProd) {
    return process.env.NEXT_PUBLIC_POSTHOG_PROD_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  }
  return process.env.NEXT_PUBLIC_POSTHOG_DEV_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
};

export const getPostHogHost = (): string => {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
};

/**
 * Initializes PostHog client-side.
 * - Screen Recording / Session Replay is ONLY enabled in production.
 */
export const initPostHog = () => {
  if (typeof window === 'undefined') return;

  const key = getPostHogKey();
  if (!key) {
    return;
  }

  posthog.init(key, {
    api_host: getPostHogHost(),
    person_profiles: 'identified_only',
    capture_pageview: false, // We can manage manual or automated pageviews
    // Session Replay strictly enabled ONLY in production
    disable_session_recording: !isProd,
    session_recording: isProd
      ? {
          maskAllInputs: true,
          maskTextSelector: '*',
        }
      : undefined,
  });
};

/**
 * Track custom events in PostHog and forward critical actions or logs if needed.
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  try {
    if (posthog.__loaded) {
      posthog.capture(eventName, properties);
    }
  } catch (error) {
    console.error(`[Analytics] Failed to track event '${eventName}':`, error);
  }
};

/**
 * Identify a user in PostHog & Sentry
 */
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  try {
    if (posthog.__loaded) {
      posthog.identify(userId, traits);
    }
    Sentry.setUser({ id: userId, ...traits });
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
};

/**
 * Reset user session on logout
 */
export const resetUser = () => {
  if (typeof window === 'undefined') return;

  try {
    if (posthog.__loaded) {
      posthog.reset();
    }
    Sentry.setUser(null);
  } catch (error) {
    console.error('[Analytics] Failed to reset user:', error);
  }
};

/**
 * Capture error to Sentry with optional extra context
 */
export const captureError = (error: any, context?: Record<string, any>) => {
  console.error('[Error Monitoring]', error);
  Sentry.captureException(error, {
    extra: context,
  });
};
