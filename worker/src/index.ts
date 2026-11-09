import * as Sentry from '@sentry/cloudflare';
import { cleanUp } from './db';
import { createApp, sameOrigin } from './app';
import auth from './routes/auth';
import carousels from './routes/carousels';
import ai from './routes/ai';
import admin from './routes/admin';
import account from './routes/account';

// The API. Cloudflare serves the static pages from out/ itself and only runs this Worker for /api/* (see wrangler.jsonc).
const app = createApp().basePath('/api');

app.use('*', sameOrigin);
app.route('/auth', auth);
app.route('/carousels', carousels);
app.route('/admin', admin);
app.route('/account', account);
app.route('/', ai);

app.notFound(c => c.json({ error: 'Not found.' }, 404));
app.onError((error, c) => {
    console.error(`[api] ${c.req.method} ${c.req.path} failed:`, error);
    Sentry.captureException(error);
    return c.json({ error: 'Unexpected server error.' }, 500);
});

export default Sentry.withSentry(
    (env: Env) => ({ dsn: env.SENTRY_DSN, enabled: !!env.SENTRY_DSN, tracesSampleRate: 0.1 }),
    {
        fetch: app.fetch,
        // Daily cleanup (see "triggers" in wrangler.jsonc)
        async scheduled(_controller, env, ctx) {
            ctx.waitUntil(cleanUp(env.DB));
        },
    } satisfies ExportedHandler<Env>
);
