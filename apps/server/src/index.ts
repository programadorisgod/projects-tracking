import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase } from './db';
import { authHandler } from './auth';
import { projectsRouter } from './modules/projects/projects.controller';
import { auditRouter } from './modules/audit/audit.controller';
import { projectsService } from './modules/projects/projects.service';

const app = express();

// Middlewares
app.use(
  cors({
    origin: [config.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-name', 'x-user-email']
  })
);

import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { db } from './db';

// Dev login endpoint to test authenticated states without external OAuth keys
app.post('/api/auth/dev-login', express.json(), async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const userName = name || 'Jerson Tapias (Lead)';
    const userEmail = email || 'jerson.tapias@company.com';

    let [existing] = await db.select().from(schema.user).where(eq(schema.user.email, userEmail)).limit(1);
    let userId = existing?.id;
    if (!existing) {
      userId = `usr-${Date.now().toString(36)}`;
      await db.insert(schema.user).values({
        id: userId,
        name: userName,
        email: userEmail,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const token = `dev_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(schema.session).values({
      id: `sess-${Date.now().toString(36)}`,
      userId: userId!,
      token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.setHeader(
      'Set-Cookie',
      `better-auth.session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    );

    res.json({
      user: { id: userId, name: userName, email: userEmail },
      token
    });
  } catch (e) {
    console.error('Error creating dev login session:', e);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Better Auth handler mounted at /api/auth/*
app.all('/api/auth/*', authHandler);

// Standard JSON body parser for domain APIs
app.use(express.json());

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/audit', auditRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: config.TURSO_DATABASE_URL.startsWith('file:') ? 'local-sqlite' : 'turso-cloud',
    timestamp: new Date().toISOString()
  });
});

async function bootstrap() {
  try {
    console.log('Initializing database connection and schema...');
    await initDatabase();

    console.log('Checking projects baseline...');
    await projectsService.seedIfEmpty();

    app.listen(config.PORT, () => {
      console.log(`🚀 Big Data Tracking Server running on http://localhost:${config.PORT}`);
      console.log(`📦 Database: ${config.TURSO_DATABASE_URL}`);
      console.log(`🔒 Better Auth endpoints active at http://localhost:${config.PORT}/api/auth`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
