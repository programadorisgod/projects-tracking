import { Router } from 'express';
import type { Request, Response } from 'express';
import { auditService } from './audit.service';
import type { AuditFilters } from '@app/shared';

export const auditRouter = Router();

// GET /api/audit
auditRouter.get('/', async (req: Request, res: Response) => {
  try {
    const filters: AuditFilters = {
      search: req.query.search as string | undefined,
      action: req.query.action as string | undefined,
      projectId: req.query.projectId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
    };

    const result = await auditService.getAuditLogs(filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to retrieve audit records' });
  }
});

// GET /api/audit/stats
auditRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await auditService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Failed to retrieve audit stats' });
  }
});
