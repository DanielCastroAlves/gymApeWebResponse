import { Router } from 'express';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { asyncHandler, httpError } from '../http.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { hashPassword } from '../auth.js';
import { createHash, randomBytes } from 'node:crypto';
import { sendEmail } from '../email.js';

export function adminRoutes(params: { db: Database.Database }) {
  const router = Router();

  function getFrontendUrl() {
    const url = process.env.FRONTEND_URL;
    if (!url) throw httpError(500, 'FRONTEND_URL não configurado');
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  function tokenHash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  router.get(
    '/users',
    asyncHandler(async (_req: AuthedRequest, res) => {
      const rows = params.db
        .prepare(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`)
        .all();
      res.json({ users: rows });
    }),
  );

  router.post(
    '/users',
    asyncHandler(async (req: AuthedRequest, res) => {
      const body = z
        .object({
          name: z.string().min(1),
          email: z.string().email(),
          role: z.enum(['aluno', 'professor', 'admin']),
          password: z.string().min(6),
          phone: z.string().optional(),
          birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          avatar_url: z.string().url().optional(),
          address_line1: z.string().optional(),
          address_line2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zip: z.string().optional(),
          country: z.string().optional(),
        })
        .parse(req.body);

      const exists = params.db.prepare(`SELECT id FROM users WHERE email = ? LIMIT 1`).get(body.email) as
        | { id: string }
        | undefined;
      if (exists) throw httpError(409, 'E-mail já cadastrado');

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const password_hash = await hashPassword(body.password);

      params.db
        .prepare(
          `INSERT INTO users (
             id, name, email, role, password_hash,
             phone, birthdate, avatar_url,
             address_line1, address_line2, city, state, zip, country,
             created_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          body.name,
          body.email,
          body.role,
          password_hash,
          body.phone ?? null,
          body.birthdate ?? null,
          body.avatar_url ?? null,
          body.address_line1 ?? null,
          body.address_line2 ?? null,
          body.city ?? null,
          body.state ?? null,
          body.zip ?? null,
          body.country ?? null,
          now,
        );

      res.status(201).json({
        user: {
          id,
          name: body.name,
          email: body.email,
          role: body.role,
          phone: body.phone ?? null,
          birthdate: body.birthdate ?? null,
          avatar_url: body.avatar_url ?? null,
          address_line1: body.address_line1 ?? null,
          address_line2: body.address_line2 ?? null,
          city: body.city ?? null,
          state: body.state ?? null,
          zip: body.zip ?? null,
          country: body.country ?? null,
          created_at: now,
        },
      });
    }),
  );

  router.get(
    '/users/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
      const userId = z.string().uuid().parse(req.params.id);
      const row = params.db
        .prepare(
          `SELECT id, name, email, role, phone, birthdate, avatar_url,
                  address_line1, address_line2, city, state, zip, country,
                  created_at
           FROM users WHERE id = ? LIMIT 1`,
        )
        .get(userId) as
        | {
            id: string;
            name: string;
            email: string;
            role: 'admin' | 'professor' | 'aluno';
            phone: string | null;
            birthdate: string | null;
            avatar_url: string | null;
            address_line1: string | null;
            address_line2: string | null;
            city: string | null;
            state: string | null;
            zip: string | null;
            country: string | null;
            created_at: string;
          }
        | undefined;
      if (!row) throw httpError(404, 'Usuário não encontrado');
      res.json({ user: row });
    }),
  );

  router.patch(
    '/users/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
      const userId = z.string().uuid().parse(req.params.id);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
          role: z.enum(['aluno', 'professor', 'admin']).optional(),
          phone: z.string().nullable().optional(),
          birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
          avatar_url: z.string().url().nullable().optional(),
          address_line1: z.string().nullable().optional(),
          address_line2: z.string().nullable().optional(),
          city: z.string().nullable().optional(),
          state: z.string().nullable().optional(),
          zip: z.string().nullable().optional(),
          country: z.string().nullable().optional(),
        })
        .parse(req.body);

      const exists = params.db.prepare(`SELECT id FROM users WHERE id = ? LIMIT 1`).get(userId) as { id: string } | undefined;
      if (!exists) throw httpError(404, 'Usuário não encontrado');

      // email unique check when changing email
      if (body.email) {
        const emailExists = params.db.prepare(`SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`).get(body.email, userId) as
          | { id: string }
          | undefined;
        if (emailExists) throw httpError(409, 'E-mail já cadastrado');
      }

      const fields: string[] = [];
      const values: any[] = [];
      const add = (k: string, v: any) => {
        fields.push(`${k} = ?`);
        values.push(v);
      };

      if (body.name !== undefined) add('name', body.name);
      if (body.email !== undefined) add('email', body.email);
      if (body.role !== undefined) add('role', body.role);
      if (body.phone !== undefined) add('phone', body.phone);
      if (body.birthdate !== undefined) add('birthdate', body.birthdate);
      if (body.avatar_url !== undefined) add('avatar_url', body.avatar_url);
      if (body.address_line1 !== undefined) add('address_line1', body.address_line1);
      if (body.address_line2 !== undefined) add('address_line2', body.address_line2);
      if (body.city !== undefined) add('city', body.city);
      if (body.state !== undefined) add('state', body.state);
      if (body.zip !== undefined) add('zip', body.zip);
      if (body.country !== undefined) add('country', body.country);

      if (!fields.length) {
        res.json({ ok: true });
        return;
      }

      params.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values, userId);

      const updated = params.db
        .prepare(
          `SELECT id, name, email, role, phone, birthdate, avatar_url,
                  address_line1, address_line2, city, state, zip, country,
                  created_at
           FROM users WHERE id = ? LIMIT 1`,
        )
        .get(userId);
      res.json({ user: updated });
    }),
  );

  router.get(
    '/alunos',
    asyncHandler(async (_req: AuthedRequest, res) => {
      const rows = params.db
        .prepare(`SELECT id, name, email, role, created_at FROM users WHERE role = 'aluno' ORDER BY created_at DESC`)
        .all();
      res.json({ alunos: rows });
    }),
  );

  router.get(
    '/admins',
    asyncHandler(async (_req: AuthedRequest, res) => {
      const rows = params.db
        .prepare(`SELECT id, name, email, role, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC`)
        .all();
      res.json({ admins: rows });
    }),
  );

  router.post(
    '/users/:id/password-reset',
    asyncHandler(async (req: AuthedRequest, res) => {
      const userId = z.string().uuid().parse(req.params.id);

      const row = params.db
        .prepare(`SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1`)
        .get(userId) as { id: string; email: string; name: string; role: 'admin' | 'professor' | 'aluno' } | undefined;

      if (!row) throw httpError(404, 'Usuário não encontrado');

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
        text: `Olá ${row.name},\n\nUm administrador solicitou a redefinição da sua senha.\n\nAbra este link para criar uma nova senha:\n${link}\n\nSe você não solicitou, ignore este email.`,
      });

      res.json({ ok: true });
    }),
  );

  router.post(
    '/alunos',
    asyncHandler(async (req: AuthedRequest, res) => {
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

      params.db
        .prepare(
          `INSERT INTO users (id, name, email, role, password_hash, created_at)
           VALUES (?, ?, ?, 'aluno', ?, ?)`,
        )
        .run(id, body.name, body.email, password_hash, now);

      res.status(201).json({ aluno: { id, name: body.name, email: body.email, role: 'aluno', created_at: now } });
    }),
  );

  router.post(
    '/admins',
    asyncHandler(async (req: AuthedRequest, res) => {
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

      params.db
        .prepare(
          `INSERT INTO users (id, name, email, role, password_hash, created_at)
           VALUES (?, ?, ?, 'admin', ?, ?)`,
        )
        .run(id, body.name, body.email, password_hash, now);

      res.status(201).json({ admin: { id, name: body.name, email: body.email, role: 'admin', created_at: now } });
    }),
  );

  router.get(
    '/alunos/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
      const alunoId = z.string().uuid().parse(req.params.id);
      const aluno = params.db
        .prepare(`SELECT id, name, email, role, created_at FROM users WHERE id = ? AND role = 'aluno' LIMIT 1`)
        .get(alunoId) as { id: string; name: string; email: string; role: string; created_at: string } | undefined;
      if (!aluno) throw httpError(404, 'Aluno não encontrado');

      const treinos = params.db
        .prepare(
          `SELECT id, title, objective, week_start, user_id, is_template, parent_workout_id, assigned_at, created_by, created_at
           FROM workouts
           WHERE user_id = ?
           ORDER BY created_at DESC`,
        )
        .all(alunoId);

      res.json({ aluno, treinos });
    }),
  );

  router.get(
    '/workouts',
    asyncHandler(async (_req: AuthedRequest, res) => {
      const rows = params.db
        .prepare(
          `SELECT id, title, objective, week_start, user_id, is_template, parent_workout_id, assigned_at, created_by, created_at
           FROM workouts
           ORDER BY created_at DESC`,
        )
        .all();
      res.json({ workouts: rows });
    }),
  );

  router.get(
    '/workouts/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
      const workoutId = z.string().uuid().parse(req.params.id);
      const workout = params.db
        .prepare(
          `SELECT id, title, objective, week_start, user_id, is_template, parent_workout_id, assigned_at, created_by, created_at
           FROM workouts WHERE id = ? LIMIT 1`,
        )
        .get(workoutId) as
        | {
            id: string;
            title: string;
            objective: string;
            week_start: string | null;
            user_id: string | null;
            is_template: number;
            parent_workout_id: string | null;
            assigned_at: string | null;
            created_by: string;
            created_at: string;
          }
        | undefined;

      if (!workout) throw httpError(404, 'Treino não encontrado');

      const items = params.db
        .prepare(
          `SELECT id, workout_id, name, sets, reps, weight, rest_seconds, notes, order_index
           FROM workout_items
           WHERE workout_id = ?
           ORDER BY order_index ASC`,
        )
        .all(workoutId);

      res.json({ workout, items });
    }),
  );

  router.patch(
    '/workouts/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');
      const workoutId = z.string().uuid().parse(req.params.id);
      const body = z
        .object({
          title: z.string().min(1).optional(),
          objective: z.string().min(1).optional(),
          items: z
            .array(
              z.object({
                name: z.string().min(1),
                sets: z.number().int().min(1).optional(),
                reps: z.string().min(1).optional(),
                weight: z.string().min(1).optional(),
                rest_seconds: z.number().int().min(0).optional(),
                notes: z.string().optional(),
              }),
            )
            .optional(),
        })
        .parse(req.body);

      const workout = params.db
        .prepare(`SELECT id, is_template, user_id FROM workouts WHERE id = ? LIMIT 1`)
        .get(workoutId) as { id: string; is_template: number; user_id: string | null } | undefined;
      if (!workout) throw httpError(404, 'Treino não encontrado');

      // Only allow editing global templates in this endpoint
      if (workout.is_template !== 1 || workout.user_id) throw httpError(400, 'Apenas templates globais podem ser editados');

      const tx = params.db.transaction(() => {
        const fields: string[] = [];
        const values: any[] = [];
        if (body.title !== undefined) {
          fields.push('title = ?');
          values.push(body.title);
        }
        if (body.objective !== undefined) {
          fields.push('objective = ?');
          values.push(body.objective);
        }
        if (fields.length) {
          params.db.prepare(`UPDATE workouts SET ${fields.join(', ')} WHERE id = ?`).run(...values, workoutId);
        }

        if (body.items) {
          params.db.prepare(`DELETE FROM workout_items WHERE workout_id = ?`).run(workoutId);
          const stmt = params.db.prepare(
            `INSERT INTO workout_items (id, workout_id, name, sets, reps, weight, rest_seconds, notes, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          );
          body.items.forEach((it, idx) => {
            stmt.run(
              crypto.randomUUID(),
              workoutId,
              it.name,
              it.sets ?? null,
              it.reps ?? null,
              it.weight ?? null,
              it.rest_seconds ?? null,
              it.notes ?? null,
              idx,
            );
          });
        }
      });
      tx();

      const updated = params.db
        .prepare(
          `SELECT id, title, objective, week_start, user_id, is_template, parent_workout_id, assigned_at, created_by, created_at
           FROM workouts WHERE id = ? LIMIT 1`,
        )
        .get(workoutId);
      const items = params.db
        .prepare(
          `SELECT id, workout_id, name, sets, reps, weight, rest_seconds, notes, order_index
           FROM workout_items
           WHERE workout_id = ?
           ORDER BY order_index ASC`,
        )
        .all(workoutId);
      res.json({ workout: updated, items });
    }),
  );

  router.post(
    '/workouts',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');
      const body = z
        .object({
          title: z.string().min(1),
          objective: z.string().min(1),
          week_start: z.string().datetime().optional(),
          user_id: z.string().uuid().nullable().optional(),
          is_template: z.boolean().optional(),
          items: z
            .array(
              z.object({
                name: z.string().min(1),
                sets: z.number().int().min(1).optional(),
                reps: z.string().min(1).optional(),
                weight: z.string().min(1).optional(),
                rest_seconds: z.number().int().min(0).optional(),
                notes: z.string().optional(),
              }),
            )
            .optional(),
        })
        .parse(req.body);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const isTemplate = body.is_template ? 1 : 0;

      const tx = params.db.transaction(() => {
        params.db
          .prepare(
            `INSERT INTO workouts (id, title, objective, week_start, user_id, is_template, parent_workout_id, assigned_at, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            id,
            body.title,
            body.objective,
            body.week_start ?? null,
            body.user_id ?? null,
            isTemplate,
            null,
            body.user_id ? now : null,
            req.user!.id,
            now,
          );

        if (body.items?.length) {
          const stmt = params.db.prepare(
            `INSERT INTO workout_items (id, workout_id, name, sets, reps, weight, rest_seconds, notes, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          );
          body.items.forEach((it, idx) => {
            stmt.run(
              crypto.randomUUID(),
              id,
              it.name,
              it.sets ?? null,
              it.reps ?? null,
              it.weight ?? null,
              it.rest_seconds ?? null,
              it.notes ?? null,
              idx,
            );
          });
        }
      });
      tx();

      res.status(201).json({
        workout: {
          id,
          title: body.title,
          objective: body.objective,
          week_start: body.week_start ?? null,
          user_id: body.user_id ?? null,
          is_template: isTemplate,
          parent_workout_id: null,
          assigned_at: body.user_id ? now : null,
          created_by: req.user.id,
          created_at: now,
        },
      });
    }),
  );

  router.post(
    '/workouts/:id/assign',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');
      const workoutId = z.string().uuid().parse(req.params.id);
      const body = z
        .object({
          user_id: z.string().uuid(),
          week_start: z.string().datetime().optional(),
        })
        .parse(req.body);

      const template = params.db
        .prepare(
          `SELECT id, title, objective
           FROM workouts
           WHERE id = ? AND is_template = 1 AND user_id IS NULL
           LIMIT 1`,
        )
        .get(workoutId) as { id: string; title: string; objective: string } | undefined;
      if (!template) throw httpError(404, 'Treino template não encontrado');

      const aluno = params.db
        .prepare(`SELECT id FROM users WHERE id = ? AND role = 'aluno' LIMIT 1`)
        .get(body.user_id) as { id: string } | undefined;
      if (!aluno) throw httpError(404, 'Aluno não encontrado');

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();

      const items = params.db
        .prepare(
          `SELECT name, sets, reps, weight, rest_seconds, notes, order_index
           FROM workout_items
           WHERE workout_id = ?
           ORDER BY order_index ASC`,
        )
        .all(workoutId) as Array<{
        name: string;
        sets: number | null;
        reps: string | null;
        weight: string | null;
        rest_seconds: number | null;
        notes: string | null;
        order_index: number;
      }>;

      const tx = params.db.transaction(() => {
        params.db
          .prepare(
            `INSERT INTO workouts (id, title, objective, week_start, user_id, is_template, parent_workout_id, assigned_at, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
          )
          .run(
            newId,
            template.title,
            template.objective,
            body.week_start ?? null,
            body.user_id,
            template.id,
            now,
            req.user!.id,
            now,
          );

        if (items.length) {
          const stmt = params.db.prepare(
            `INSERT INTO workout_items (id, workout_id, name, sets, reps, weight, rest_seconds, notes, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          );
          items.forEach((it) => {
            stmt.run(
              crypto.randomUUID(),
              newId,
              it.name,
              it.sets,
              it.reps,
              it.weight,
              it.rest_seconds,
              it.notes,
              it.order_index,
            );
          });
        }
      });
      tx();

      res.status(201).json({ workout_id: newId });
    }),
  );

  router.post(
    '/challenges',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');
      const body = z
        .object({
          title: z.string().min(1),
          points: z.number().int().min(0).default(0),
          frequency: z.enum(['daily', 'weekly']),
          active_from: z.string().datetime().optional(),
          active_to: z.string().datetime().optional(),
          user_id: z.string().uuid().nullable().optional(),
        })
        .parse(req.body);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      params.db
        .prepare(
          `INSERT INTO challenges (id, title, points, frequency, active_from, active_to, user_id, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          body.title,
          body.points,
          body.frequency,
          body.active_from ?? null,
          body.active_to ?? null,
          body.user_id ?? null,
          req.user.id,
          now,
        );

      res.status(201).json({ challenge: { id, ...body, created_by: req.user.id, created_at: now } });
    }),
  );

  router.get(
    '/challenges',
    asyncHandler(async (_req: AuthedRequest, res) => {
      const rows = params.db
        .prepare(
          `SELECT
             c.id, c.title, c.points, c.frequency, c.active_from, c.active_to, c.user_id, c.created_by, c.created_at,
             u.name as user_name, u.email as user_email
           FROM challenges c
           LEFT JOIN users u ON u.id = c.user_id
           ORDER BY c.created_at DESC`,
        )
        .all();
      res.json({ challenges: rows });
    }),
  );

  return router;
}

