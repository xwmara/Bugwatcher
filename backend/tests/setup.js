// Runs before each test file: close the database connection when the file is done,
// so the test process can exit cleanly.
import { afterAll } from 'vitest';
import db from '../models/index.js';

afterAll(async () => {
    await db.sequelize.close();
});
