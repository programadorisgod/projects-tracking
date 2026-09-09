import type { ProjectStatus } from './project';
export type AuditAction = 'PROJECT_CREATED' | 'STATUS_CHANGED' | 'PROJECT_UPDATED' | 'PROJECT_DELETED' | 'MAINTENANCE_RECORDED' | 'DATABASE_RESET' | 'DATABASE_IMPORTED' | 'OPERATIONAL_EVENT';
export interface AuditLogEntry {
    id: string;
    projectId: string | null;
    projectName: string | null;
    userId: string | null;
    userName: string;
    userEmail: string | null;
    action: AuditAction;
    summary: string;
    previousState: {
        status?: ProjectStatus;
        [key: string]: unknown;
    } | null;
    newState: {
        status?: ProjectStatus;
        [key: string]: unknown;
    } | null;
    metadata: Record<string, unknown> | null;
    timestamp: string;
}
export interface AuditFilters {
    search?: string;
    action?: string;
    projectId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}
export interface AuditStats {
    totalEvents: number;
    statusChanges: number;
    creations: number;
    maintenances: number;
}
//# sourceMappingURL=audit.d.ts.map