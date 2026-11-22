import * as Sentry from '@sentry/cloudflare';

// Notices for things an operator should look at that are not errors in our code (a webhook we could not use, a bad
// signature). An object, so the tests can watch it.
export const monitoring = {
    notice(message: string, extra: Record<string, unknown> = {}) {
        console.warn(JSON.stringify({ event: 'notice', message, ...extra }));
        Sentry.captureMessage(message, { level: 'warning', extra });
    },
};
