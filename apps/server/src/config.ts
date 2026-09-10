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

const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_DEV_SECRET = 'dev_secret_key_change_in_production_1234567890';
const authSecret = process.env.BETTER_AUTH_SECRET || DEFAULT_DEV_SECRET;

if (isProduction && (authSecret === DEFAULT_DEV_SECRET || authSecret.length < 32)) {
  throw new Error('FATAL SECURITY ERROR: In production, BETTER_AUTH_SECRET must be set to a cryptographically secure random string with at least 32 characters.');
}

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

export const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'file:./local.db',
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || '',
  BETTER_AUTH_SECRET: authSecret,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  CLIENT_URL: clientUrl,
  TRUSTED_ORIGINS: [clientUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || ''
};

