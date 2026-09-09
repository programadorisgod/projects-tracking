import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'
});

export const { signIn, signOut, useSession } = authClient;
