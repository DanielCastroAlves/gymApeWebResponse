import { Router } from 'express';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { hashPassword, signToken, verifyPassword, type PublicUser } from '../auth.js';
import { asyncHandler, httpError } from '../http.js';
import type { DbUser, UserRole } from '../db.js';

function toPublicUser(row: Pick<DbUser, 'id' | 'name' | 'email' | 'role'>): PublicUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function authRoutes(params: { db: Database.Database; jwtSecret: string }) {
  const router = Router();

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
        })
        .parse(req.body);

      const exists = params.db.prepare(`SELECT id FROM users WHERE email = ? LIMIT 1`).get(body.email) as
        | { id: string }
        | undefined;
      if (exists) throw httpError(409, 'E-mail já cadastrado');

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const password_hash = await hashPassword(body.password);
      const role: UserRole = 'aluno';

      params.db
        .prepare(
          `INSERT INTO users (id, name, email, role, password_hash, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(id, body.name, body.email, role, password_hash, now);

      const user: PublicUser = { id, name: body.name, email: body.email, role };
      const token = signToken({ userId: id, role, jwtSecret: params.jwtSecret });
      res.json({ token, user });
    }),
  );

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          email: z.string().email(),
          password: z.string().min(1),
        })
        .parse(req.body);

      const row = params.db
        .prepare(
          `SELECT id, name, email, role, password_hash, created_at
           FROM users WHERE email = ? LIMIT 1`,
        )
        .get(body.email) as DbUser | undefined;

      if (!row) throw httpError(401, 'Credenciais inválidas');
      const ok = await verifyPassword(body.password, row.password_hash);
      if (!ok) throw httpError(401, 'Credenciais inválidas');

      const user = toPublicUser(row);
      const token = signToken({ userId: row.id, role: row.role, jwtSecret: params.jwtSecret });
      res.json({ token, user });
    }),
  );

  return router;
}

