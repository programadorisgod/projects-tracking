import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import type { Request, Response, NextFunction } from 'express';
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
  trustedOrigins: [config.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
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

export async function extractActor(req: Request): Promise<AuthenticatedActor> {
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
  } catch (err) {
    // If session lookup fails, fall through to header or default
  }

  // Fallback for custom header / local dev identification
  const customUser = req.headers['x-user-name'] as string | undefined;
  const customEmail = req.headers['x-user-email'] as string | undefined;
  if (customUser) {
    return {
      name: customUser,
      email: customEmail
    };
  }

  return {
    name: 'Jerson Tapias (Lead)',
    email: 'jerson.tapias@company.com'
  };
}
