// Database settings for the app (models/index.js) and for sequelize-cli (migrations).
// Connection details come from environment variables (backend/.env), never from this file.
import 'dotenv/config';

// Hosted databases such as Neon require SSL. Set DB_SSL=false for a local database without SSL.
const useSsl = process.env.DB_SSL !== 'false';

const config = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSsl ? { ssl: { rejectUnauthorized: true } } : {},
};

export default {
  development: config,
  test: config,
  production: config,
};
