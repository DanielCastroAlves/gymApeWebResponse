import { Router } from 'express';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { asyncHandler, httpError } from '../http.js';
import type { AuthedRequest } from '../middleware/auth.js';

export function appRoutes(params: { db: Database.Database }) {
  const router = Router();

  router.get(
    '/me',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');
      res.json({ user: req.user });
    }),
  );

  router.get(
    '/workouts',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');

      const rows = params.db
        .prepare(
          `SELECT id, title, objective, week_start, user_id, created_by, created_at
           FROM workouts
           WHERE (is_template = 1 AND user_id IS NULL) OR (user_id = ?)
           ORDER BY created_at DESC`,
        )
        .all(req.user.id);

      res.json({ workouts: rows });
    }),
  );

  router.get(
    '/workouts/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');
      const workoutId = z.string().uuid().parse(req.params.id);

      const workout = params.db
        .prepare(
          `SELECT id, title, objective, week_start, user_id, is_template, parent_workout_id, assigned_at, created_by, created_at
           FROM workouts
           WHERE id = ? AND ((is_template = 1 AND user_id IS NULL) OR user_id = ?)
           LIMIT 1`,
        )
        .get(workoutId, req.user.id);
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

  router.get(
    '/challenges',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');

      const rows = params.db
        .prepare(
          `SELECT id, title, points, frequency, active_from, active_to, user_id, created_by, created_at
           FROM challenges
           WHERE (user_id IS NULL OR user_id = ?)
           ORDER BY created_at DESC`,
        )
        .all(req.user.id);

      res.json({ challenges: rows });
    }),
  );

  router.post(
    '/challenges/:id/complete',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');
      const challengeId = z.string().uuid().parse(req.params.id);

      // Default: 1 completion por dia por desafio (MVP).
      const now = new Date();
      const dayKey = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

      try {
        params.db
          .prepare(
            `INSERT INTO challenge_completions (id, user_id, challenge_id, completed_at)
             VALUES (?, ?, ?, ?)`,
          )
          .run(crypto.randomUUID(), req.user.id, challengeId, dayKey);
      } catch {
        throw httpError(409, 'Desafio já marcado como concluído hoje');
      }

      res.json({ ok: true });
    }),
  );

  router.get(
    '/leaderboard',
    asyncHandler(async (_req: AuthedRequest, res) => {
      // Ranking simples: soma de pontos por usuário, últimos 7 dias (MVP).
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const rows = params.db
        .prepare(
          `
          SELECT
            u.id as user_id,
            u.name as name,
            u.email as email,
            COALESCE(SUM(c.points), 0) as points
          FROM users u
          LEFT JOIN challenge_completions cc ON cc.user_id = u.id AND cc.completed_at >= ?
          LEFT JOIN challenges c ON c.id = cc.challenge_id
          WHERE u.role = 'aluno'
          GROUP BY u.id
          ORDER BY points DESC, u.created_at ASC
          LIMIT 50
        `,
        )
        .all(since);

      res.json({ leaderboard: rows });
    }),
  );

  return router;
}

