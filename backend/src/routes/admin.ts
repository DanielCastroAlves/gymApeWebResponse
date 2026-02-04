import { Router } from 'express';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { asyncHandler, httpError } from '../http';
import type { AuthedRequest } from '../middleware/auth';
import { hashPassword } from '../auth';

export function adminRoutes(params: { db: Database.Database }) {
  const router = Router();

  router.get(
    '/users',
    asyncHandler(async (_req: AuthedRequest, res) => {
      const rows = params.db
        .prepare(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`)
        .all();
      res.json({ users: rows });
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

  return router;
}

