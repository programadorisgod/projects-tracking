import { desc, eq, and, gte, lte, like, sql } from 'drizzle-orm';
import { db } from '../../db';
import { auditLogs } from '../../db/schema';
import type { DBAuditLog } from '../../db/schema';
import type { AuditAction, AuditFilters, AuditLogEntry, AuditStats } from '@app/shared';
import type { AuthenticatedActor } from '../../auth';

export class AuditService {
  async recordEvent(params: {
    projectId?: string | null;
    projectName?: string | null;
    actor: AuthenticatedActor;
    action: AuditAction;
    summary: string;
    previousState?: Record<string, unknown> | null;
    newState?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<AuditLogEntry> {
    const id = `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const newEntry = {
      id,
      projectId: params.projectId || null,
      projectName: params.projectName || null,
      userId: params.actor.id || null,
      userName: params.actor.name || 'Sistema',
      userEmail: params.actor.email || null,
      action: params.action,
      summary: params.summary,
      previousState: params.previousState ? JSON.stringify(params.previousState) : null,
      newState: params.newState ? JSON.stringify(params.newState) : null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      timestamp
    };

    await db.insert(auditLogs).values(newEntry);

    return {
      id,
      projectId: newEntry.projectId,
      projectName: newEntry.projectName,
      userId: newEntry.userId,
      userName: newEntry.userName,
      userEmail: newEntry.userEmail,
      action: newEntry.action as AuditAction,
      summary: newEntry.summary,
      previousState: params.previousState || null,
      newState: params.newState || null,
      metadata: params.metadata || null,
      timestamp
    };
  }

  async getAuditLogs(filters: AuditFilters = {}): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const conditions = [];

    if (filters.action && filters.action !== 'all') {
      conditions.push(eq(auditLogs.action, filters.action));
    }

    if (filters.projectId && filters.projectId !== 'all') {
      conditions.push(eq(auditLogs.projectId, filters.projectId));
    }

    if (filters.startDate) {
      conditions.push(gte(auditLogs.timestamp, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(auditLogs.timestamp, filters.endDate));
    }

    if (filters.search) {
      conditions.push(
        sql`(${auditLogs.summary} LIKE ${`%${filters.search}%`} OR ${auditLogs.projectName} LIKE ${`%${filters.search}%`} OR ${auditLogs.userName} LIKE ${`%${filters.search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const rows = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const entries: AuditLogEntry[] = rows.map((row: DBAuditLog) => ({
      id: row.id,
      projectId: row.projectId,
      projectName: row.projectName,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      action: row.action as AuditAction,
      summary: row.summary,
      previousState: row.previousState ? JSON.parse(row.previousState) : null,
      newState: row.newState ? JSON.parse(row.newState) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      timestamp: row.timestamp
    }));

    return { entries, total };
  }

  async getStats(): Promise<AuditStats> {
    const result = await db
      .select({
        totalEvents: sql<number>`count(*)`,
        statusChanges: sql<number>`count(CASE WHEN ${auditLogs.action} = 'STATUS_CHANGED' THEN 1 END)`,
        creations: sql<number>`count(CASE WHEN ${auditLogs.action} = 'PROJECT_CREATED' THEN 1 END)`,
        maintenances: sql<number>`count(CASE WHEN ${auditLogs.action} = 'MAINTENANCE_RECORDED' THEN 1 END)`
      })
      .from(auditLogs);

    const row = result[0];
    return {
      totalEvents: Number(row?.totalEvents || 0),
      statusChanges: Number(row?.statusChanges || 0),
      creations: Number(row?.creations || 0),
      maintenances: Number(row?.maintenances || 0)
    };
  }
}

export const auditService = new AuditService();
