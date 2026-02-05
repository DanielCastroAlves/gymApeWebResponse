import type { NextFunction, Request, Response } from 'express';
import type Database from 'better-sqlite3';
import { verifyToken } from '../auth.js';
import { httpError } from '../http.js';
import type { DbUser, UserRole } from '../db.js';

export interface AuthedRequest extends Request {
  auth?: { userId: string; role: UserRole };
  user?: { id: string; name: string; email: string; role: UserRole };
}

export function authMiddleware(params: { db: Database.Database; jwtSecret: string }) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const [kind, token] = header.split(' ');
    if (kind !== 'Bearer' || !token) return next(httpError(401, 'Não autenticado'));

    try {
      const payload = verifyToken({ token, jwtSecret: params.jwtSecret });
      req.auth = { userId: payload.sub, role: payload.role };

      const row = params.db
        .prepare(
          `SELECT id, name, email, role, password_hash, created_at
           FROM users WHERE id = ? LIMIT 1`,
        )
        .get(payload.sub) as DbUser | undefined;

      if (!row) return next(httpError(401, 'Não autenticado'));
      req.user = { id: row.id, name: row.name, email: row.email, role: row.role };
      return next();
    } catch {
      return next(httpError(401, 'Token inválido'));
    }
  };
}

export function requireRole(role: UserRole) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(httpError(401, 'Não autenticado'));
    if (req.user.role !== role) return next(httpError(403, 'Sem permissão'));
    return next();
  };
}

