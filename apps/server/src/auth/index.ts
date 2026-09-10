import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { config } from '../config';

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET
  };
}

if (config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET
  };
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL,
  trustedOrigins: config.TRUSTED_ORIGINS,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days total lifetime
    updateAge: 60 * 60 * 24, // Rotate / update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes cache
    }
  },
  advanced: {
    useSecureCookies: config.isProduction
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100
  },
  emailAndPassword: {
    enabled: true
  },
  socialProviders
});

export const authHandler = toNodeHandler(auth);

export interface AuthenticatedActor {
  id?: string;
  name: string;
  email?: string;
}

/**
 * Express middleware to enforce valid authenticated session on protected routes.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (session && session.user) {
      (req as any).user = session.user;
      (req as any).session = session.session;
      return next();
    }

    // Database session token check (covers dev-login or custom session tokens stored in DB)
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
    if (match) {
      const rawToken = match[1].trim();
      const [dbSession] = await db
        .select()
        .from(schema.session)
        .where(eq(schema.session.token, rawToken))
        .limit(1);

      if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
        const [dbUser] = await db
          .select()
          .from(schema.user)
          .where(eq(schema.user.id, dbSession.userId))
          .limit(1);

        if (dbUser) {
          (req as any).user = dbUser;
          (req as any).session = dbSession;
          return next();
        }
      }
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Acceso denegado: se requiere una sesión activa válida.'
    });
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Fallo al verificar la sesión de usuario.'
    });
  }
}

/**
 * Extracts actor identity strictly from validated session.
 * Rejects header spoofing in production environments.
 */
export async function extractActor(req: Request): Promise<AuthenticatedActor> {
  const reqUser = (req as any).user;
  if (reqUser) {
    return {
      id: reqUser.id,
      name: reqUser.name,
      email: reqUser.email
    };
  }

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (session && session.user) {
      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      };
    }
  } catch {
    // Session lookup failed
  }

  // Only allow dev header emulation strictly in development
  if (!config.isProduction) {
    const customUser = req.headers['x-user-name'] as string | undefined;
    const customEmail = req.headers['x-user-email'] as string | undefined;
    if (customUser) {
      return {
        name: customUser,
        email: customEmail
      };
    }
  }

  return {
    name: 'Usuario Anónimo',
    email: undefined
  };
}

