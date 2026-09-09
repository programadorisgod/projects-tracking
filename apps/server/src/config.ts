import dotenv from 'dotenv';
import path from 'path';

import fs from 'fs';

// Check apps/server/.env (when running from root) or .env (when running inside apps/server)
const serverEnvPath = path.resolve(process.cwd(), 'apps/server/.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  dotenv.config();
}

export const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'file:./local.db',
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || '',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'dev_secret_key_change_in_production_1234567890',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || ''
};
