import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../../db';
import { user, projects } from '../../db/schema';

export const usersRouter = Router();

// Base team members to ensure presence
const BASE_TEAM_USERS = [
  'Jerson Tapias',
  'Laura Gómez',
  'Carlos Restrepo',
  'Santiago Vélez',
  'Marcela Ríos',
  'Andrés Morales',
  'Felipe Vargas'
];

usersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    // 1. Registered users in DB
    const dbUsers = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image
    }).from(user);

    // 2. Distinct assignees from projects table in DB
    const projectAssignees = await db
      .select({ assignee: projects.assignee })
      .from(projects)
      .groupBy(projects.assignee);

    // 3. Consolidate into a unique list
    const usersMap = new Map<string, { id: string; name: string; email?: string; image?: string | null }>();

    // Team defaults
    for (const name of BASE_TEAM_USERS) {
      usersMap.set(name, {
        id: `base-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        email: ''
      });
    }

    // Database registered users
    for (const u of dbUsers) {
      if (u.name && u.name.trim()) {
        usersMap.set(u.name.trim(), {
          id: u.id,
          name: u.name.trim(),
          email: u.email || '',
          image: u.image || null
        });
      }
    }

    // Projects assignees from database
    for (const p of projectAssignees) {
      if (p.assignee && p.assignee !== 'Sin asignar' && !usersMap.has(p.assignee)) {
        usersMap.set(p.assignee, {
          id: `proj-${p.assignee.toLowerCase().replace(/\s+/g, '-')}`,
          name: p.assignee,
          email: ''
        });
      }
    }

    const result = Array.from(usersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    res.json(result);
  } catch (error) {
    console.error('Error fetching users from database:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
