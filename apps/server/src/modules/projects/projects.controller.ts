import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { projectsService } from './projects.service';
import { extractActor, requireAuth } from '../../auth';

export const projectsRouter = Router();

const projectStatusEnum = z.enum([
  'analisis',
  'diseno',
  'desarrollo',
  'pruebas',
  'despliegue',
  'finalizado',
  'pausado'
]);

const projectCategoryEnum = z.enum([
  'asistencial',
  'financiero',
  'operativo',
  'analitica',
  'infraestructura'
]);

const projectTypeEnum = z.enum(['proyecto', 'mantenimiento']);
const maintenanceTypeEnum = z.enum(['correctivo', 'evolutivo', 'adaptativo', 'perfectivo']);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().max(2000).optional().default(''),
  status: projectStatusEnum.default('analisis'),
  category: projectCategoryEnum.default('asistencial'),
  area: z.string().max(100).optional().default(''),
  tags: z.array(z.string().max(50)).max(30).optional().default([]),
  startDate: z.string().max(30).optional(),
  estimatedDeliveryDate: z.string().max(30).optional().nullable(),
  actualDeliveryDate: z.string().max(30).optional().nullable(),
  pauseReason: z.string().max(1000).optional().nullable(),
  location: z.string().max(300).optional().default(''),
  githubUrl: z
    .string()
    .max(500)
    .optional()
    .refine(
      val => !val || val === '' || /^https?:\/\//i.test(val),
      { message: 'githubUrl debe ser una URL válida iniciando con http:// o https://' }
    )
    .default(''),
  assignee: z.string().max(100).optional().default('Sin asignar'),
  projectType: projectTypeEnum.optional().default('proyecto'),
  parentProjectId: z.string().max(100).optional().nullable(),
  parentProjectName: z.string().max(200).optional().nullable(),
  maintenanceType: maintenanceTypeEnum.optional().nullable(),
  maintenanceScope: z.string().max(2000).optional().nullable()
});

export const updateProjectSchema = createProjectSchema.partial();

export const importProjectsSchema = z.object({
  projects: z.array(createProjectSchema.extend({ id: z.string().optional() })).min(1, 'La lista no puede estar vacía').max(500, 'Límite máximo de 500 proyectos por importación'),
  mode: z.enum(['merge', 'replace']).default('merge')
});

// GET /api/projects
projectsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const list = await projectsService.getAll();
    res.json(list);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/export
projectsRouter.get('/export', async (_req: Request, res: Response) => {
  try {
    const data = await projectsService.exportData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="proyectos_big_data_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(data);
  } catch (error) {
    console.error('Error exporting projects:', error);
    res.status(500).json({ error: 'Failed to export projects' });
  }
});

// POST /api/projects/import (Protected: requireAuth)
projectsRouter.post('/import', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = importProjectsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos de importación inválidos', details: parsed.error.format() });
    }

    const actor = await extractActor(req);
    const { projects: incomingProjects, mode } = parsed.data;
    const updatedList = await projectsService.importProjects(incomingProjects as any, mode, actor);
    res.json(updatedList);
  } catch (error) {
    console.error('Error importing projects:', error);
    res.status(500).json({ error: 'Failed to import projects' });
  }
});

// POST /api/projects/reset (Protected: requireAuth)
projectsRouter.post('/reset', requireAuth, async (req: Request, res: Response) => {
  try {
    const actor = await extractActor(req);
    const restored = await projectsService.resetDefaults(actor);
    res.json(restored);
  } catch (error) {
    console.error('Error resetting projects:', error);
    res.status(500).json({ error: 'Failed to reset projects' });
  }
});

// GET /api/projects/:id
projectsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await projectsService.getById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects (Protected: requireAuth)
projectsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos del proyecto inválidos', details: parsed.error.format() });
    }

    const actor = await extractActor(req);
    const created = await projectsService.create(parsed.data as any, actor);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id (Protected: requireAuth)
projectsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos de actualización inválidos', details: parsed.error.format() });
    }

    const actor = await extractActor(req);
    const updated = await projectsService.update(req.params.id, parsed.data as any, actor);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id (Protected: requireAuth)
projectsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const actor = await extractActor(req);
    const success = await projectsService.delete(req.params.id, actor);
    if (!success) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

