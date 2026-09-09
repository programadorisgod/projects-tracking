import { Router } from 'express';
import type { Request, Response } from 'express';
import { projectsService } from './projects.service';
import { extractActor } from '../../auth';

export const projectsRouter = Router();

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

// POST /api/projects/import
projectsRouter.post('/import', async (req: Request, res: Response) => {
  try {
    const actor = await extractActor(req);
    const { projects: incomingProjects, mode } = req.body;
    if (!Array.isArray(incomingProjects)) {
      return res.status(400).json({ error: 'Expected projects array in body' });
    }
    const updatedList = await projectsService.importProjects(incomingProjects, mode || 'merge', actor);
    res.json(updatedList);
  } catch (error) {
    console.error('Error importing projects:', error);
    res.status(500).json({ error: 'Failed to import projects' });
  }
});

// POST /api/projects/reset
projectsRouter.post('/reset', async (req: Request, res: Response) => {
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

// POST /api/projects
projectsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const actor = await extractActor(req);
    const created = await projectsService.create(req.body, actor);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id
projectsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const actor = await extractActor(req);
    const updated = await projectsService.update(req.params.id, req.body, actor);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
projectsRouter.delete('/:id', async (req: Request, res: Response) => {
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
