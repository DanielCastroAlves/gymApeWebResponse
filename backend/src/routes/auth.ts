import { Router } from 'express';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { hashPassword, signToken, verifyPassword, type PublicUser } from '../auth.js';
import { asyncHandler, httpError } from '../http.js';
import type { DbUser, UserRole } from '../db.js';
import { createHash, randomBytes } from 'node:crypto';
import { sendEmail } from '../email.js';

function toPublicUser(row: Pick<DbUser, 'id' | 'name' | 'email' | 'role'>): PublicUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function authRoutes(params: { db: Database.Database; jwtSecret: string }) {
  const router = Router();

  function getFrontendUrl() {
    const url = process.env.FRONTEND_URL;
    if (!url) throw httpError(500, 'FRONTEND_URL não configurado');
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  function tokenHash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
          password_confirm: z.string().min(6).optional(),
        })
        .parse(req.body);

      if (body.password_confirm !== undefined && body.password_confirm !== body.password) {
        throw httpError(400, 'As senhas não conferem');
      }

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

  router.post(
    '/forgot-password',
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          email: z.string().email(),
        })
        .parse(req.body);

      const row = params.db
        .prepare(`SELECT id, email FROM users WHERE email = ? LIMIT 1`)
        .get(body.email) as { id: string; email: string } | undefined;

      // Resposta sempre OK para não expor se existe.
      if (!row) {
        res.json({ ok: true });
        return;
      }

      const token = randomBytes(32).toString('hex');
      const id = crypto.randomUUID();
      const now = new Date();
      const expires = new Date(now.getTime() + 1000 * 60 * 30); // 30 min

      params.db
        .prepare(
          `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
           VALUES (?, ?, ?, ?, NULL, ?)`,
        )
        .run(id, row.id, tokenHash(token), expires.toISOString(), now.toISOString());

      const link = `${getFrontendUrl()}/#/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: row.email,
        subject: 'Redefinição de senha',
        text: `Você solicitou a redefinição de senha.\n\nAbra este link para criar uma nova senha:\n${link}\n\nSe você não solicitou, ignore este email.`,
      });

      res.json({ ok: true });
    }),
  );

  router.post(
    '/reset-password',
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          token: z.string().min(10),
          password: z.string().min(6),
          password_confirm: z.string().min(6),
        })
        .parse(req.body);

      if (body.password !== body.password_confirm) {
        throw httpError(400, 'As senhas não conferem');
      }

      const now = new Date().toISOString();
      const tokenRow = params.db
        .prepare(
          `SELECT id, user_id, expires_at, used_at
           FROM password_reset_tokens
           WHERE token_hash = ?
           LIMIT 1`,
        )
        .get(tokenHash(body.token)) as { id: string; user_id: string; expires_at: string; used_at: string | null } | undefined;

      if (!tokenRow) throw httpError(400, 'Token inválido');
      if (tokenRow.used_at) throw httpError(400, 'Token já utilizado');
      if (new Date(tokenRow.expires_at).getTime() < Date.now()) throw httpError(400, 'Token expirado');

      const password_hash = await hashPassword(body.password);

      const tx = params.db.transaction(() => {
        params.db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(password_hash, tokenRow.user_id);
        params.db.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE id = ?`).run(now, tokenRow.id);
      });
      tx();

      res.json({ ok: true });
    }),
  );

  return router;
}

