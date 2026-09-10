import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { auditService } from './audit.service';
import type { AuditFilters } from '@app/shared';
import { requireAuth } from '../../auth';

export const auditRouter = Router();

const auditQuerySchema = z.object({
  search: z.string().max(100).optional(),
  action: z.string().max(50).optional(),
  projectId: z.string().max(100).optional(),
  startDate: z.string().max(40).optional(),
  endDate: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0)
});

// GET /api/audit (Protected: requireAuth)
auditRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = auditQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Parámetros de consulta inválidos', details: parsed.error.format() });
    }

    const { search, action, projectId, startDate, endDate, limit, offset } = parsed.data;
    const filters: AuditFilters = {
      search,
      action,
      projectId,
      startDate,
      endDate,
      limit,
      offset
    };

    const result = await auditService.getAuditLogs(filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to retrieve audit records' });
  }
});

// GET /api/audit/stats (Protected: requireAuth)
auditRouter.get('/stats', requireAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await auditService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Failed to retrieve audit stats' });
  }
});

