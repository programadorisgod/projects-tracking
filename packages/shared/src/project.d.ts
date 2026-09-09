export type ProjectCategory = 'administrativo' | 'asistencial';
export type ProjectStatus = 'analisis' | 'diseno' | 'desarrollo' | 'pruebas' | 'despliegue' | 'capacitacion' | 'pendiente_revision' | 'retrasado' | 'pausado' | 'terminado_parcialmente' | 'terminado' | 'entregado';
export interface StatusConfig {
    id: ProjectStatus;
    label: string;
    group: 'etapa' | 'alerta' | 'finalizacion';
    color: string;
    badgeBg: string;
    badgeBorder: string;
    description?: string;
}
export declare const STATUS_DEFINITIONS: Record<ProjectStatus, StatusConfig>;
export type ProjectType = 'proyecto' | 'mantenimiento';
export type MaintenanceType = 'correctivo' | 'evolutivo' | 'soporte' | 'seguridad';
export interface MaintenanceTypeConfig {
    id: MaintenanceType;
    label: string;
    badgeColor: string;
    description: string;
}
export declare const MAINTENANCE_TYPE_DEFINITIONS: Record<MaintenanceType, MaintenanceTypeConfig>;
export interface Project {
    id: string;
    name: string;
    description: string;
    status: ProjectStatus;
    category: ProjectCategory;
    area: string;
    tags: string[];
    startDate: string;
    estimatedDeliveryDate: string;
    actualDeliveryDate?: string;
    pauseReason?: string;
    location: string;
    githubUrl: string;
    assignee: string;
    createdAt: string;
    updatedAt: string;
    projectType?: ProjectType;
    parentProjectId?: string;
    parentProjectName?: string;
    maintenanceType?: MaintenanceType;
    maintenanceScope?: string;
}
export type ViewMode = 'kanban' | 'history' | 'audit';
//# sourceMappingURL=project.d.ts.map