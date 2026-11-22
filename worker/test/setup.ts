import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// Polar is never reached from the tests. Unless a test mocks it, the user has no subscriptions and no customer there
// (the API asks before deleting an account) and any other call fails.
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.startsWith('https://sandbox-api.polar.sh/v1/subscriptions/') && method === 'GET') {
        return Response.json({ items: [], pagination: { total_count: 0, max_page: 0 } });
    }
    if (url.startsWith('https://sandbox-api.polar.sh/v1/customers/external/') && method === 'DELETE') {
        return Response.json({ error: 'ResourceNotFound' }, { status: 404 });
    }
    if (url.startsWith('https://sandbox-api.polar.sh/')) return new Response('Polar is not mocked in this test', { status: 500 });
    return realFetch(input, init);
};
