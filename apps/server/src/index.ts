import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import { config } from './config';
import { initDatabase, db } from './db';
import * as schema from './db/schema';
import { authHandler } from './auth';
import { projectsRouter } from './modules/projects/projects.controller';
import { auditRouter } from './modules/audit/audit.controller';
import { projectsService } from './modules/projects/projects.service';

const app = express();

// 1. Security Headers (OWASP A05)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...config.TRUSTED_ORIGINS]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// 2. Rate Limiting (OWASP A04)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación, por favor intenta más tarde.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// 3. CORS & Origin Validation (OWASP A01 & A05)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.TRUSTED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS bloqueado: Origen no autorizado.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-name', 'x-user-email']
  })
);

// 4. CSRF / Origin Verification for state-changing requests
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      try {
        const parsedOrigin = new URL(origin).origin;
        if (!config.TRUSTED_ORIGINS.includes(parsedOrigin)) {
          return res.status(403).json({ error: 'Acceso denegado: Origen de solicitud no verificado.' });
        }
      } catch {
        return res.status(403).json({ error: 'Acceso denegado: Encabezado de origen inválido.' });
      }
    }
  }
  next();
});

// 5. Dev login endpoint - strictly disabled in production (OWASP A01)
if (!config.isProduction) {
  app.post('/api/auth/dev-login', express.json({ limit: '50kb' }), async (req, res) => {
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
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(schema.session).values({
        id: `sess-${Date.now().toString(36)}`,
        userId: userId!,
        token,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const secureFlag = config.isProduction ? '; Secure' : '';
      res.setHeader(
        'Set-Cookie',
        `better-auth.session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secureFlag}`
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
} else {
  app.post('/api/auth/dev-login', (_req, res) => {
    res.status(404).json({ error: 'Endpoint no disponible en este entorno.' });
  });
}

// Better Auth handler mounted at /api/auth/*
app.all('/api/auth/*', authHandler);

// 6. Standard JSON body parser with explicit size limit (OWASP A04)
app.use(express.json({ limit: '1mb' }));

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/audit', auditRouter);

// 7. Sanitized Health Check (OWASP A05 - No fingerprinting)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 8. Global Error Handler (OWASP A05 - Prevent info leak via stack traces)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS: Origen no autorizado.' });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Payload JSON con formato inválido.' });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
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
