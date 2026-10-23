/**
 * authMiddleware.ts
 * JWT-based authentication and role enforcement middleware.
 * Tokens are signed with AUTH_SECRET from environment.
 * For this app the frontend manages session in localStorage —
 * the token is sent as Bearer in Authorization header.
 * 
 * NOTE: The frontend currently uses frontend-only auth (no real server session).
 * We implement real JWT auth but keep a "dev bypass" mode when AUTH_SECRET is 'dev'
 * so existing frontend flows keep working during transition.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ─── Simple JWT (no external lib — keeps deps minimal) ───────────────────────

function base64url(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64urlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

export interface JWTPayload {
  sub: string;    // user id
  name: string;
  role: 'ADMIN' | 'VIEWER';
  iat: number;
  exp: number;
}

const SECRET = process.env.AUTH_SECRET || 'dev';

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresInHours = 24): string {
  const now = Math.floor(Date.now() / 1000);
  const full: JWTPayload = { ...payload, iat: now, exp: now + expiresInHours * 3600 };
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(full));
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const expected = crypto
      .createHmac('sha256', SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(base64urlDecode(body)) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Require authentication.
 * If AUTH_SECRET === 'dev', accept a special dev token header for local testing.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Dev bypass: accept X-Dev-Role header in development
  if (SECRET === 'dev' && process.env.NODE_ENV !== 'production') {
    const devRole = req.headers['x-dev-role'] as string;
    const devUser = req.headers['x-dev-user'] as string;
    if (devRole === 'ADMIN' || devRole === 'VIEWER') {
      req.user = {
        sub: devUser || (devRole === 'ADMIN' ? 'admin-lokesh' : 'viewer-om'),
        name: devRole === 'ADMIN' ? 'Lokesh' : 'Om',
        role: devRole as 'ADMIN' | 'VIEWER',
        iat: 0,
        exp: 9999999999,
      };
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Require ADMIN role. Call after requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Administrator access required.' });
    return;
  }
  next();
}

/**
 * Issue a dev token for testing endpoints — only available in non-production.
 */
export function issueDevToken(role: 'ADMIN' | 'VIEWER', userId?: string): string {
  if (process.env.NODE_ENV === 'production') throw new Error('Not available in production');
  return signToken({
    sub: userId || (role === 'ADMIN' ? 'admin-lokesh' : 'viewer-om'),
    name: role === 'ADMIN' ? 'Lokesh' : 'Om',
    role,
  });
}
