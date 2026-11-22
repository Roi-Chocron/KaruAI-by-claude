declare namespace Cloudflare {
    interface Env {
        TEST_MIGRATIONS: import('cloudflare:test').D1Migration[];
        MIGRATION_TEST_DB: D1Database;
    }
}
