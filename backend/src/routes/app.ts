import { Router } from 'express';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { asyncHandler, httpError } from '../http.js';
import type { AuthedRequest } from '../middleware/auth.js';

export function appRoutes(params: { db: Database.Database }) {
  const router = Router();

  function utcMidnightIso(d: Date) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
  }

  function utcWeekStartIso(d: Date) {
    // Monday as week start
    const day = d.getUTCDay(); // 0..6, 0=Sun
    const diffToMonday = (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diffToMonday));
    return utcMidnightIso(monday);
  }

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

      const now = new Date();
      const nowIso = now.toISOString();
      const dayKey = utcMidnightIso(now);
      const weekKey = utcWeekStartIso(now);

      const rows = params.db
        .prepare(
          `SELECT id, title, points, frequency, active_from, active_to, user_id, created_by, created_at
           FROM challenges
           WHERE (user_id IS NULL OR user_id = ?)
             AND (active_from IS NULL OR active_from <= ?)
             AND (active_to IS NULL OR active_to >= ?)
           ORDER BY created_at DESC`,
        )
        .all(req.user.id, nowIso, nowIso) as Array<{
        id: string;
        title: string;
        points: number;
        frequency: 'daily' | 'weekly';
        active_from: string | null;
        active_to: string | null;
        user_id: string | null;
        created_by: string;
        created_at: string;
      }>;

      const dailyIds = rows.filter((c) => c.frequency === 'daily').map((c) => c.id);
      const weeklyIds = rows.filter((c) => c.frequency === 'weekly').map((c) => c.id);

      const completedDaily = new Set<string>();
      const completedWeekly = new Set<string>();

      if (dailyIds.length) {
        const placeholders = dailyIds.map(() => '?').join(',');
        const done = params.db
          .prepare(
            `SELECT challenge_id FROM challenge_completions
             WHERE user_id = ? AND completed_at = ? AND challenge_id IN (${placeholders})`,
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .all(req.user.id, dayKey, ...dailyIds) as Array<{ challenge_id: string }>;
        done.forEach((r) => completedDaily.add(r.challenge_id));
      }

      if (weeklyIds.length) {
        const placeholders = weeklyIds.map(() => '?').join(',');
        const done = params.db
          .prepare(
            `SELECT challenge_id FROM challenge_completions
             WHERE user_id = ? AND completed_at = ? AND challenge_id IN (${placeholders})`,
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .all(req.user.id, weekKey, ...weeklyIds) as Array<{ challenge_id: string }>;
        done.forEach((r) => completedWeekly.add(r.challenge_id));
      }

      res.json({
        period: { dayKey, weekKey },
        challenges: rows.map((c) => ({
          ...c,
          completed: c.frequency === 'daily' ? completedDaily.has(c.id) : completedWeekly.has(c.id),
        })),
      });
    }),
  );

  router.post(
    '/challenges/:id/complete',
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) throw httpError(401, 'Não autenticado');
      const challengeId = z.string().uuid().parse(req.params.id);

      const body = z
        .object({
          completed: z.boolean().optional(),
        })
        .parse(req.body ?? {});

      const challenge = params.db
        .prepare(`SELECT id, frequency FROM challenges WHERE id = ? AND (user_id IS NULL OR user_id = ?) LIMIT 1`)
        .get(challengeId, req.user.id) as { id: string; frequency: 'daily' | 'weekly' } | undefined;
      if (!challenge) throw httpError(404, 'Desafio não encontrado');

      const now = new Date();
      const key = challenge.frequency === 'weekly' ? utcWeekStartIso(now) : utcMidnightIso(now);
      const shouldComplete = body.completed ?? true;

      if (shouldComplete) {
        params.db
          .prepare(
            `INSERT OR IGNORE INTO challenge_completions (id, user_id, challenge_id, completed_at)
             VALUES (?, ?, ?, ?)`,
          )
          .run(crypto.randomUUID(), req.user.id, challengeId, key);
      } else {
        params.db
          .prepare(
            `DELETE FROM challenge_completions
             WHERE user_id = ? AND challenge_id = ? AND completed_at = ?`,
          )
          .run(req.user.id, challengeId, key);
      }

      res.json({ ok: true, completed: shouldComplete, key });
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

