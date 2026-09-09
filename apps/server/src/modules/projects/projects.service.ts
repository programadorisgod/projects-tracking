import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { projects } from '../../db/schema';
import type { DBProject } from '../../db/schema';
import type { Project, ProjectStatus } from '@app/shared';
import { auditService } from '../audit/audit.service';
import type { AuthenticatedActor } from '../../auth';
import { INITIAL_PROJECTS } from '../../db/initialProjects';

function mapRowToProject(row: DBProject): Project {
  let parsedTags: string[] = [];
  try {
    parsedTags = row.tags ? JSON.parse(row.tags) : [];
  } catch {
    parsedTags = [];
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    status: row.status as ProjectStatus,
    category: row.category as any,
    area: row.area || '',
    tags: parsedTags,
    startDate: row.startDate,
    estimatedDeliveryDate: row.estimatedDeliveryDate || '',
    actualDeliveryDate: row.actualDeliveryDate || undefined,
    pauseReason: row.pauseReason || undefined,
    location: row.location || '',
    githubUrl: row.githubUrl || '',
    assignee: row.assignee || 'Sin asignar',
    projectType: (row.projectType as any) || 'proyecto',
    parentProjectId: row.parentProjectId || undefined,
    parentProjectName: row.parentProjectName || undefined,
    maintenanceType: (row.maintenanceType as any) || undefined,
    maintenanceScope: row.maintenanceScope || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export class ProjectsService {
  async getAll(): Promise<Project[]> {
    const rows = await db.select().from(projects).orderBy(desc(projects.updatedAt));
    return rows.map(mapRowToProject);
  }

  async getById(id: string): Promise<Project | null> {
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (rows.length === 0) return null;
    return mapRowToProject(rows[0]);
  }

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, actor: AuthenticatedActor): Promise<Project> {
    const id = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const insertValues = {
      id,
      name: data.name,
      description: data.description || '',
      status: data.status || 'analisis',
      category: data.category || 'asistencial',
      area: data.area || '',
      tags: JSON.stringify(data.tags || []),
      startDate: data.startDate || now.split('T')[0],
      estimatedDeliveryDate: data.estimatedDeliveryDate || null,
      actualDeliveryDate: data.actualDeliveryDate || null,
      pauseReason: data.pauseReason || null,
      location: data.location || '',
      githubUrl: data.githubUrl || '',
      assignee: data.assignee || 'Sin asignar',
      projectType: data.projectType || 'proyecto',
      parentProjectId: data.parentProjectId || null,
      parentProjectName: data.parentProjectName || null,
      maintenanceType: data.maintenanceType || null,
      maintenanceScope: data.maintenanceScope || null,
      createdAt: now,
      updatedAt: now
    };

    await db.insert(projects).values(insertValues);
    const createdProject = mapRowToProject(insertValues as DBProject);

    // Record in Audit Log
    const isMaintenance = data.projectType === 'mantenimiento';
    const action = isMaintenance ? 'MAINTENANCE_RECORDED' : 'PROJECT_CREATED';
    const summary = isMaintenance
      ? `Mantenimiento ${data.maintenanceType?.toUpperCase() || ''} registrado para "${data.name}"`
      : `Proyecto creado: "${data.name}" con estado inicial "${data.status}"`;

    await auditService.recordEvent({
      projectId: id,
      projectName: data.name,
      actor,
      action,
      summary,
      previousState: null,
      newState: { status: data.status, area: data.area, category: data.category },
      metadata: {
        projectType: data.projectType,
        assignee: data.assignee,
        parentProjectId: data.parentProjectId
      }
    });

    return createdProject;
  }

  async update(id: string, updates: Partial<Project>, actor: AuthenticatedActor): Promise<Project | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: now
    };

    if (updates.tags) {
      updateData.tags = JSON.stringify(updates.tags);
    }

    await db.update(projects).set(updateData).where(eq(projects.id, id));
    const updated = await this.getById(id);
    if (!updated) return null;

    // Detect status transition
    if (updates.status && updates.status !== existing.status) {
      await auditService.recordEvent({
        projectId: id,
        projectName: updated.name,
        actor,
        action: 'STATUS_CHANGED',
        summary: `Estado actualizado de "${existing.status}" a "${updates.status}"`,
        previousState: { status: existing.status, pauseReason: existing.pauseReason },
        newState: { status: updates.status, pauseReason: updates.pauseReason },
        metadata: {
          pauseReason: updates.pauseReason,
          actualDeliveryDate: updates.actualDeliveryDate
        }
      });
    } else {
      await auditService.recordEvent({
        projectId: id,
        projectName: updated.name,
        actor,
        action: 'PROJECT_UPDATED',
        summary: `Actualización de datos generales en "${updated.name}"`,
        previousState: { name: existing.name, assignee: existing.assignee, area: existing.area },
        newState: { name: updated.name, assignee: updated.assignee, area: updated.area },
        metadata: updates
      });
    }

    return updated;
  }

  async delete(id: string, actor: AuthenticatedActor): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    await db.delete(projects).where(eq(projects.id, id));

    await auditService.recordEvent({
      projectId: id,
      projectName: existing.name,
      actor,
      action: 'PROJECT_DELETED',
      summary: `Proyecto eliminado: "${existing.name}" (ID: ${id})`,
      previousState: { name: existing.name, status: existing.status, area: existing.area },
      newState: null,
      metadata: { 
        deletedAt: new Date().toLocaleString('es-CO', { 
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
        deletedAtUtc: new Date().toISOString()
      }
    });

    return true;
  }

  async seedIfEmpty(): Promise<void> {
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const count = Number(countRes[0]?.count || 0);

    if (count === 0) {
      console.log('Seeding initial projects into database...');
      const systemActor: AuthenticatedActor = { name: 'Sistema de Inicialización', email: 'system@bigdata.internal' };

      for (const proj of INITIAL_PROJECTS) {
        await db.insert(projects).values({
          id: proj.id,
          name: proj.name,
          description: proj.description || '',
          status: proj.status,
          category: proj.category,
          area: proj.area || '',
          tags: JSON.stringify(proj.tags || []),
          startDate: proj.startDate,
          estimatedDeliveryDate: proj.estimatedDeliveryDate || null,
          actualDeliveryDate: proj.actualDeliveryDate || null,
          pauseReason: proj.pauseReason || null,
          location: proj.location || '',
          githubUrl: proj.githubUrl || '',
          assignee: proj.assignee || 'Sin asignar',
          projectType: proj.projectType || 'proyecto',
          parentProjectId: proj.parentProjectId || null,
          parentProjectName: proj.parentProjectName || null,
          maintenanceType: proj.maintenanceType || null,
          maintenanceScope: proj.maintenanceScope || null,
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt
        });

        // Add initial baseline audit entry
        await auditService.recordEvent({
          projectId: proj.id,
          projectName: proj.name,
          actor: systemActor,
          action: 'PROJECT_CREATED',
          summary: `Carga inicial: "${proj.name}" establecido en estado "${proj.status}"`,
          previousState: null,
          newState: { status: proj.status, area: proj.area },
          metadata: { initialSeed: true, area: proj.area }
        });
      }

      console.log(`✓ ${INITIAL_PROJECTS.length} projects seeded with audit trail!`);
    }
  }

  async resetDefaults(actor: AuthenticatedActor): Promise<Project[]> {
    await db.delete(projects);

    const now = new Date().toISOString();
    for (const proj of INITIAL_PROJECTS) {
      await db.insert(projects).values({
        id: proj.id,
        name: proj.name,
        description: proj.description || '',
        status: proj.status,
        category: proj.category,
        area: proj.area || '',
        tags: JSON.stringify(proj.tags || []),
        startDate: proj.startDate,
        estimatedDeliveryDate: proj.estimatedDeliveryDate || null,
        actualDeliveryDate: proj.actualDeliveryDate || null,
        pauseReason: proj.pauseReason || null,
        location: proj.location || '',
        githubUrl: proj.githubUrl || '',
        assignee: proj.assignee || 'Sin asignar',
        projectType: proj.projectType || 'proyecto',
        parentProjectId: proj.parentProjectId || null,
        parentProjectName: proj.parentProjectName || null,
        maintenanceType: proj.maintenanceType || null,
        maintenanceScope: proj.maintenanceScope || null,
        createdAt: proj.createdAt || now,
        updatedAt: proj.updatedAt || now
      });
    }

    await auditService.recordEvent({
      projectId: null,
      projectName: 'Base de Datos (Todos los proyectos)',
      actor,
      action: 'DATABASE_RESET',
      summary: `Restauración de base de datos a valores de fábrica (${INITIAL_PROJECTS.length} proyectos)`,
      previousState: null,
      newState: { restoredCount: INITIAL_PROJECTS.length },
      metadata: { totalProjects: INITIAL_PROJECTS.length }
    });

    return this.getAll();
  }

  async importProjects(
    projectsData: Project[],
    mode: 'replace' | 'merge',
    actor: AuthenticatedActor
  ): Promise<Project[]> {
    if (!Array.isArray(projectsData)) {
      throw new Error('Datos de importación inválidos: se esperaba una lista de proyectos.');
    }

    const now = new Date().toISOString();

    if (mode === 'replace') {
      await db.delete(projects);

      for (const proj of projectsData) {
        const id = proj.id || `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        await db.insert(projects).values({
          id,
          name: proj.name,
          description: proj.description || '',
          status: proj.status || 'analisis',
          category: proj.category || 'asistencial',
          area: proj.area || '',
          tags: JSON.stringify(proj.tags || []),
          startDate: proj.startDate || now.split('T')[0],
          estimatedDeliveryDate: proj.estimatedDeliveryDate || null,
          actualDeliveryDate: proj.actualDeliveryDate || null,
          pauseReason: proj.pauseReason || null,
          location: proj.location || '',
          githubUrl: proj.githubUrl || '',
          assignee: proj.assignee || 'Sin asignar',
          projectType: proj.projectType || 'proyecto',
          parentProjectId: proj.parentProjectId || null,
          parentProjectName: proj.parentProjectName || null,
          maintenanceType: proj.maintenanceType || null,
          maintenanceScope: proj.maintenanceScope || null,
          createdAt: proj.createdAt || now,
          updatedAt: proj.updatedAt || now
        });
      }
    } else {
      for (const proj of projectsData) {
        const id = proj.id || `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        const existing = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

        const projectValues = {
          name: proj.name,
          description: proj.description || '',
          status: proj.status || 'analisis',
          category: proj.category || 'asistencial',
          area: proj.area || '',
          tags: JSON.stringify(proj.tags || []),
          startDate: proj.startDate || now.split('T')[0],
          estimatedDeliveryDate: proj.estimatedDeliveryDate || null,
          actualDeliveryDate: proj.actualDeliveryDate || null,
          pauseReason: proj.pauseReason || null,
          location: proj.location || '',
          githubUrl: proj.githubUrl || '',
          assignee: proj.assignee || 'Sin asignar',
          projectType: proj.projectType || 'proyecto',
          parentProjectId: proj.parentProjectId || null,
          parentProjectName: proj.parentProjectName || null,
          maintenanceType: proj.maintenanceType || null,
          maintenanceScope: proj.maintenanceScope || null,
          updatedAt: now
        };

        if (existing.length > 0) {
          await db.update(projects).set(projectValues).where(eq(projects.id, id));
        } else {
          await db.insert(projects).values({
            id,
            ...projectValues,
            createdAt: proj.createdAt || now
          });
        }
      }
    }

    await auditService.recordEvent({
      projectId: null,
      projectName: 'Importación Masiva',
      actor,
      action: 'DATABASE_IMPORTED',
      summary: `Importación en base de datos (${mode === 'replace' ? 'Reemplazo total' : 'Combinación'}): ${projectsData.length} proyectos procesados`,
      previousState: null,
      newState: { mode, count: projectsData.length },
      metadata: { mode, importedCount: projectsData.length }
    });

    return this.getAll();
  }

  async exportData(): Promise<{
    version: string;
    exportDate: string;
    projectsCount: number;
    projects: Project[];
  }> {
    const allProjects = await this.getAll();
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      projectsCount: allProjects.length,
      projects: allProjects
    };
  }
}

export const projectsService = new ProjectsService();
