import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Better Auth Tables (standard Drizzle sqlite schema)
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// Domain: Projects Table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  status: text('status').notNull().default('analisis'),
  category: text('category').notNull().default('asistencial'),
  area: text('area').default(''),
  tags: text('tags').default('[]'), // JSON Array
  startDate: text('start_date').notNull(),
  estimatedDeliveryDate: text('estimated_delivery_date'),
  actualDeliveryDate: text('actual_delivery_date'),
  pauseReason: text('pause_reason'),
  location: text('location').default(''),
  githubUrl: text('github_url').default(''),
  assignee: text('assignee').default('Sin asignar'),
  projectType: text('project_type').default('proyecto'),
  parentProjectId: text('parent_project_id'),
  parentProjectName: text('parent_project_name'),
  maintenanceType: text('maintenance_type'),
  maintenanceScope: text('maintenance_scope'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// Domain: Chronological Audit Log (Accounting / Timeline)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  projectId: text('project_id'),
  projectName: text('project_name'),
  userId: text('user_id'),
  userName: text('user_name').notNull().default('Sistema'),
  userEmail: text('user_email'),
  action: text('action').notNull(),
  summary: text('summary').notNull(),
  previousState: text('previous_state'), // JSON snapshot
  newState: text('new_state'),           // JSON snapshot
  metadata: text('metadata'),           // JSON details
  timestamp: text('timestamp').notNull()
});

export type DBProject = typeof projects.$inferSelect;
export type InsertDBProject = typeof projects.$inferInsert;
export type DBAuditLog = typeof auditLogs.$inferSelect;
export type InsertDBAuditLog = typeof auditLogs.$inferInsert;
export type DBUser = typeof user.$inferSelect;
