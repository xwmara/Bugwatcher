// Runs once before all test files.
// Starts a real PostgreSQL database in memory (PGlite, compiled to WebAssembly),
// so the tests need no installed database, Docker or internet connection,
// then creates the tables with the project's own migrations.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { TEST_DB_PORT, TEST_DATABASE_URL } from './testDb.js';

const backendDir = fileURLToPath(new URL('..', import.meta.url));

export default async function setup() {
    const db = await PGlite.create(); // in memory: every test run starts empty
    const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: TEST_DB_PORT, maxConnections: 20 });
    await server.start();

    // Async on purpose: the database runs in this same process, so it must stay free to answer
    await promisify(execFile)(process.execPath, ['node_modules/sequelize-cli/lib/sequelize', 'db:migrate'], {
        cwd: backendDir,
        env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: TEST_DATABASE_URL, DB_SSL: 'false' },
    });

    // Runs once after all test files
    return async () => {
        await server.stop();
        await db.close();
    };
}
