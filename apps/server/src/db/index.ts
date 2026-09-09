import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { config } from '../config';

export const client = createClient({
  url: config.TURSO_DATABASE_URL,
  authToken: config.TURSO_AUTH_TOKEN || undefined
});

export const db = drizzle(client, { schema });

export async function initDatabase(): Promise<void> {
  // Ensure tables exist
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "email_verified" INTEGER NOT NULL DEFAULT 0,
      "image" TEXT,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "expires_at" INTEGER NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL,
      "ip_address" TEXT,
      "user_agent" TEXT,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "account_id" TEXT NOT NULL,
      "provider_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "access_token" TEXT,
      "refresh_token" TEXT,
      "id_token" TEXT,
      "access_token_expires_at" INTEGER,
      "refresh_token_expires_at" INTEGER,
      "scope" TEXT,
      "password" TEXT,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expires_at" INTEGER NOT NULL,
      "created_at" INTEGER,
      "updated_at" INTEGER
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "projects" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'analisis',
      "category" TEXT NOT NULL DEFAULT 'asistencial',
      "area" TEXT DEFAULT '',
      "tags" TEXT DEFAULT '[]',
      "start_date" TEXT NOT NULL,
      "estimated_delivery_date" TEXT,
      "actual_delivery_date" TEXT,
      "pause_reason" TEXT,
      "location" TEXT DEFAULT '',
      "github_url" TEXT DEFAULT '',
      "assignee" TEXT DEFAULT 'Sin asignar',
      "project_type" TEXT DEFAULT 'proyecto',
      "parent_project_id" TEXT,
      "parent_project_name" TEXT,
      "maintenance_type" TEXT,
      "maintenance_scope" TEXT,
      "created_at" TEXT NOT NULL,
      "updated_at" TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "project_id" TEXT,
      "project_name" TEXT,
      "user_id" TEXT,
      "user_name" TEXT NOT NULL DEFAULT 'Sistema',
      "user_email" TEXT,
      "action" TEXT NOT NULL,
      "summary" TEXT NOT NULL,
      "previous_state" TEXT,
      "new_state" TEXT,
      "metadata" TEXT,
      "timestamp" TEXT NOT NULL
    );
  `);

  console.log('✓ Database schema verified with Turso/libSQL');
}

export * from './schema';
