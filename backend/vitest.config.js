import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './tests/testDb.js';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.js'],
        globalSetup: './tests/globalSetup.js',
        setupFiles: ['./tests/setup.js'],
        // All test files share one database, so they run one after another
        fileParallelism: false,
        env: {
            NODE_ENV: 'test',
            DATABASE_URL: TEST_DATABASE_URL,
            DB_SSL: 'false',
            JWT_SECRET: 'test-secret-not-used-in-production',
            DISABLE_RATE_LIMIT: 'true',
        },
    },
});
