import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export type UserRole = 'aluno' | 'professor' | 'admin';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
  phone?: string | null;
  birthdate?: string | null; // ISO date: YYYY-MM-DD
  avatar_url?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  created_at: string;
}

export interface DbWorkout {
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

export interface DbWorkoutItem {
  id: string;
  workout_id: string;
  name: string;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
}

export interface DbChallenge {
  id: string;
  title: string;
  points: number;
  frequency: 'daily' | 'weekly';
  active_from: string | null;
  active_to: string | null;
  user_id: string | null;
  created_by: string;
  created_at: string;
}

function hasColumn(db: Database.Database, table: string, column: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

export function openDb() {
  const dbPath = path.join(process.cwd(), 'data.sqlite');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('aluno','professor','admin')),
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      objective TEXT NOT NULL,
      week_start TEXT,
      user_id TEXT,
      is_template INTEGER NOT NULL DEFAULT 0,
      parent_workout_id TEXT,
      assigned_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(parent_workout_id) REFERENCES workouts(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workout_items (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER,
      reps TEXT,
      weight TEXT,
      rest_seconds INTEGER,
      notes TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(workout_id) REFERENCES workouts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_workout_items_workout_id ON workout_items(workout_id);

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      points INTEGER NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly')),
      active_from TEXT,
      active_to TEXT,
      user_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);

    CREATE TABLE IF NOT EXISTS challenge_completions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, challenge_id, completed_at),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(challenge_id) REFERENCES challenges(id)
    );

    CREATE INDEX IF NOT EXISTS idx_completions_user_id ON challenge_completions(user_id);
    CREATE INDEX IF NOT EXISTS idx_completions_challenge_id ON challenge_completions(challenge_id);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires_at ON password_reset_tokens(expires_at);
  `);

  // Migração: ampliar constraint de role para incluir 'professor'
  try {
    const row = db
      .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users' LIMIT 1`)
      .get() as { sql?: string } | undefined;
    const sql = row?.sql ?? '';
    if (sql && !sql.includes("'professor'")) {
      db.exec(`
        PRAGMA foreign_keys=off;
        BEGIN TRANSACTION;
        ALTER TABLE users RENAME TO users_old;
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL CHECK(role IN ('aluno','professor','admin')),
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        INSERT INTO users (id, name, email, role, password_hash, created_at)
          SELECT id, name, email, role, password_hash, created_at FROM users_old;
        DROP TABLE users_old;
        COMMIT;
        PRAGMA foreign_keys=on;
      `);
    }
  } catch {
    // ignore
  }

  // Migrações simples para DBs já existentes
  if (!hasColumn(db, 'users', 'phone')) db.exec(`ALTER TABLE users ADD COLUMN phone TEXT;`);
  if (!hasColumn(db, 'users', 'birthdate')) db.exec(`ALTER TABLE users ADD COLUMN birthdate TEXT;`);
  if (!hasColumn(db, 'users', 'avatar_url')) db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);
  if (!hasColumn(db, 'users', 'address_line1')) db.exec(`ALTER TABLE users ADD COLUMN address_line1 TEXT;`);
  if (!hasColumn(db, 'users', 'address_line2')) db.exec(`ALTER TABLE users ADD COLUMN address_line2 TEXT;`);
  if (!hasColumn(db, 'users', 'city')) db.exec(`ALTER TABLE users ADD COLUMN city TEXT;`);
  if (!hasColumn(db, 'users', 'state')) db.exec(`ALTER TABLE users ADD COLUMN state TEXT;`);
  if (!hasColumn(db, 'users', 'zip')) db.exec(`ALTER TABLE users ADD COLUMN zip TEXT;`);
  if (!hasColumn(db, 'users', 'country')) db.exec(`ALTER TABLE users ADD COLUMN country TEXT;`);

  if (!hasColumn(db, 'workouts', 'is_template')) {
    db.exec(`ALTER TABLE workouts ADD COLUMN is_template INTEGER NOT NULL DEFAULT 0;`);
  }
  if (!hasColumn(db, 'workouts', 'parent_workout_id')) {
    db.exec(`ALTER TABLE workouts ADD COLUMN parent_workout_id TEXT;`);
  }
  if (!hasColumn(db, 'workouts', 'assigned_at')) {
    db.exec(`ALTER TABLE workouts ADD COLUMN assigned_at TEXT;`);
  }

  // Reparar DBs que ficaram em estado intermediário (ex.: FK apontando para users_old)
  repairDanglingUsersOldReferences(db);

  // Índices (criar depois das migrações, para suportar DBs antigos)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
    CREATE INDEX IF NOT EXISTS idx_workouts_is_template ON workouts(is_template);
    CREATE INDEX IF NOT EXISTS idx_workouts_parent_id ON workouts(parent_workout_id);
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_workout_items_workout_id ON workout_items(workout_id);`);

  ensureBaseWorkoutTemplates(db);

  return db;
}

function getCreateSql(db: Database.Database, table: string) {
  const row = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`)
    .get(table) as { sql?: string } | undefined;
  return row?.sql ?? '';
}

function getTableColumns(db: Database.Database, table: string) {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((c) => c.name);
}

function copyIntersection(db: Database.Database, fromTable: string, toTable: string) {
  const fromCols = new Set(getTableColumns(db, fromTable));
  const toCols = getTableColumns(db, toTable);
  const cols = toCols.filter((c) => fromCols.has(c));
  if (!cols.length) return;
  const list = cols.join(', ');
  db.prepare(`INSERT INTO ${toTable} (${list}) SELECT ${list} FROM ${fromTable}`).run();
}

function repairDanglingUsersOldReferences(db: Database.Database) {
  // Se um ALTER TABLE users RENAME TO users_old ocorreu e depois users_old foi removida,
  // tabelas com FK podem ter ficado apontando para users_old (SQLite reescreve as referências).
  const workoutsSql = getCreateSql(db, 'workouts');
  const challengesSql = getCreateSql(db, 'challenges');
  const completionsSql = getCreateSql(db, 'challenge_completions');
  const resetSql = getCreateSql(db, 'password_reset_tokens');

  const needsWorkoutsFix = workoutsSql.includes('users_old');
  const needsChallengesFix = challengesSql.includes('users_old');
  const needsCompletionsFix = completionsSql.includes('users_old');
  const needsResetFix = resetSql.includes('users_old');

  if (!needsWorkoutsFix && !needsChallengesFix && !needsCompletionsFix && !needsResetFix) return;

  db.exec(`PRAGMA foreign_keys=off;`);
  const tx = db.transaction(() => {
    if (needsWorkoutsFix) {
      // Rebuild workouts + workout_items in one go to keep FKs consistent
      db.exec(`ALTER TABLE workouts RENAME TO workouts_fkfix_old;`);
      db.exec(`ALTER TABLE workout_items RENAME TO workout_items_fkfix_old;`);

      db.exec(`
        CREATE TABLE workouts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          objective TEXT NOT NULL,
          week_start TEXT,
          user_id TEXT,
          is_template INTEGER NOT NULL DEFAULT 0,
          parent_workout_id TEXT,
          assigned_at TEXT,
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(parent_workout_id) REFERENCES workouts(id),
          FOREIGN KEY(created_by) REFERENCES users(id)
        );

        CREATE TABLE workout_items (
          id TEXT PRIMARY KEY,
          workout_id TEXT NOT NULL,
          name TEXT NOT NULL,
          sets INTEGER,
          reps TEXT,
          weight TEXT,
          rest_seconds INTEGER,
          notes TEXT,
          order_index INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY(workout_id) REFERENCES workouts(id)
        );
      `);

      copyIntersection(db, 'workouts_fkfix_old', 'workouts');
      copyIntersection(db, 'workout_items_fkfix_old', 'workout_items');

      db.exec(`DROP TABLE workouts_fkfix_old;`);
      db.exec(`DROP TABLE workout_items_fkfix_old;`);
    }

    const rebuildIfNeeded = (table: string, createSql: string) => {
      if (!createSql) return;
      const currentSql = getCreateSql(db, table);
      if (!currentSql.includes('users_old')) return;
      const old = `${table}_fkfix_old`;
      db.exec(`ALTER TABLE ${table} RENAME TO ${old};`);
      db.exec(createSql);
      copyIntersection(db, old, table);
      db.exec(`DROP TABLE ${old};`);
    };

    rebuildIfNeeded(
      'challenges',
      `
        CREATE TABLE challenges (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          points INTEGER NOT NULL,
          frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly')),
          active_from TEXT,
          active_to TEXT,
          user_id TEXT,
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(created_by) REFERENCES users(id)
        );
      `,
    );

    rebuildIfNeeded(
      'challenge_completions',
      `
        CREATE TABLE challenge_completions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          challenge_id TEXT NOT NULL,
          completed_at TEXT NOT NULL,
          UNIQUE(user_id, challenge_id, completed_at),
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(challenge_id) REFERENCES challenges(id)
        );
      `,
    );

    rebuildIfNeeded(
      'password_reset_tokens',
      `
        CREATE TABLE password_reset_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
      `,
    );
  });

  try {
    tx();
  } finally {
    db.exec(`PRAGMA foreign_keys=on;`);
  }
}

function ensureBaseWorkoutTemplates(db: Database.Database) {
  const systemUserId = ensureSystemUser(db);
  const now = new Date().toISOString();

  const templates: Array<{
    title: string;
    objective: string;
    items: Array<{ name: string; sets?: number; reps?: string; rest_seconds?: number; notes?: string }>;
  }> = [
    {
      title: 'Ficha A (ABC) — Peito e Tríceps',
      objective: 'Hipertrofia',
      items: [
        { name: 'Supino reto', sets: 4, reps: '8-12', rest_seconds: 90 },
        { name: 'Supino inclinado (halteres)', sets: 3, reps: '8-12', rest_seconds: 90 },
        { name: 'Crucifixo (máquina ou halteres)', sets: 3, reps: '10-15', rest_seconds: 60 },
        { name: 'Tríceps na polia', sets: 3, reps: '10-15', rest_seconds: 60 },
        { name: 'Tríceps testa', sets: 3, reps: '8-12', rest_seconds: 75 },
        { name: 'Mergulho (paralelas) ou banco', sets: 2, reps: 'até a falha', rest_seconds: 90 },
      ],
    },
    {
      title: 'Ficha B (ABC) — Costas e Bíceps',
      objective: 'Hipertrofia',
      items: [
        { name: 'Puxada na frente (barra ou polia)', sets: 4, reps: '8-12', rest_seconds: 90 },
        { name: 'Remada curvada', sets: 3, reps: '8-12', rest_seconds: 90 },
        { name: 'Remada baixa', sets: 3, reps: '10-12', rest_seconds: 75 },
        { name: 'Pulldown (braços estendidos)', sets: 2, reps: '12-15', rest_seconds: 60 },
        { name: 'Rosca direta', sets: 3, reps: '8-12', rest_seconds: 75 },
        { name: 'Rosca alternada', sets: 2, reps: '10-12', rest_seconds: 60 },
      ],
    },
    {
      title: 'Ficha C (ABC) — Pernas (completo)',
      objective: 'Força/Hipertrofia',
      items: [
        { name: 'Agachamento livre', sets: 4, reps: '6-10', rest_seconds: 120 },
        { name: 'Leg press', sets: 3, reps: '10-12', rest_seconds: 90 },
        { name: 'Cadeira extensora', sets: 3, reps: '12-15', rest_seconds: 60 },
        { name: 'Mesa flexora', sets: 3, reps: '10-15', rest_seconds: 60 },
        { name: 'Panturrilha em pé', sets: 4, reps: '12-20', rest_seconds: 45 },
      ],
    },
    {
      title: 'Ficha C2 (ABC) — Ombro e Abdômen',
      objective: 'Hipertrofia',
      items: [
        { name: 'Desenvolvimento (barra ou halteres)', sets: 4, reps: '8-12', rest_seconds: 90 },
        { name: 'Elevação lateral', sets: 3, reps: '12-15', rest_seconds: 60 },
        { name: 'Elevação frontal', sets: 2, reps: '10-12', rest_seconds: 60 },
        { name: 'Crucifixo inverso (posterior de ombro)', sets: 3, reps: '12-15', rest_seconds: 60 },
        { name: 'Prancha', sets: 3, reps: '30-60s', rest_seconds: 45 },
        { name: 'Abdominal infra', sets: 3, reps: '12-20', rest_seconds: 45 },
      ],
    },
    {
      title: 'Ficha A (ABC) — Peito e Tríceps (Iniciante)',
      objective: 'Hipertrofia (leve)',
      items: [
        { name: 'Supino máquina', sets: 3, reps: '10-12', rest_seconds: 90 },
        { name: 'Supino inclinado (máquina)', sets: 2, reps: '10-12', rest_seconds: 90 },
        { name: 'Crossover (polia)', sets: 2, reps: '12-15', rest_seconds: 60 },
        { name: 'Tríceps corda', sets: 3, reps: '12-15', rest_seconds: 60 },
        { name: 'Tríceps francês (halter)', sets: 2, reps: '10-12', rest_seconds: 75 },
      ],
    },
    {
      title: 'Ficha B (ABC) — Costas e Bíceps (Iniciante)',
      objective: 'Hipertrofia (leve)',
      items: [
        { name: 'Puxada na polia', sets: 3, reps: '10-12', rest_seconds: 90 },
        { name: 'Remada baixa', sets: 3, reps: '10-12', rest_seconds: 90 },
        { name: 'Remada unilateral (halter)', sets: 2, reps: '10-12', rest_seconds: 75 },
        { name: 'Rosca direta', sets: 3, reps: '10-12', rest_seconds: 75 },
        { name: 'Rosca martelo', sets: 2, reps: '10-12', rest_seconds: 60 },
      ],
    },
    {
      title: 'Ficha C (ABC) — Pernas (Iniciante)',
      objective: 'Hipertrofia (leve)',
      items: [
        { name: 'Leg press', sets: 3, reps: '10-12', rest_seconds: 90 },
        { name: 'Cadeira extensora', sets: 3, reps: '12-15', rest_seconds: 60 },
        { name: 'Mesa flexora', sets: 3, reps: '10-15', rest_seconds: 60 },
        { name: 'Panturrilha sentada', sets: 3, reps: '12-20', rest_seconds: 45 },
      ],
    },
    {
      title: 'Ficha C (ABC) — Glúteo e Posterior',
      objective: 'Hipertrofia',
      items: [
        { name: 'Levantamento terra romeno', sets: 4, reps: '8-12', rest_seconds: 120 },
        { name: 'Hip thrust', sets: 4, reps: '8-12', rest_seconds: 120 },
        { name: 'Cadeira flexora', sets: 3, reps: '10-15', rest_seconds: 60 },
        { name: 'Abdução de quadril', sets: 3, reps: '12-20', rest_seconds: 45 },
      ],
    },
    {
      title: 'Ficha A (ABC) — Força (supino foco)',
      objective: 'Força',
      items: [
        { name: 'Supino reto', sets: 5, reps: '5', rest_seconds: 180 },
        { name: 'Supino inclinado', sets: 4, reps: '6', rest_seconds: 150 },
        { name: 'Paralelas (assistido se necessário)', sets: 3, reps: '6-8', rest_seconds: 150 },
        { name: 'Tríceps testa', sets: 3, reps: '8-10', rest_seconds: 120 },
      ],
    },
    {
      title: 'Ficha B (ABC) — Força (costas foco)',
      objective: 'Força',
      items: [
        { name: 'Barra fixa (ou puxada)', sets: 5, reps: '5', rest_seconds: 180 },
        { name: 'Remada curvada', sets: 4, reps: '6', rest_seconds: 150 },
        { name: 'Remada baixa', sets: 3, reps: '6-8', rest_seconds: 150 },
        { name: 'Rosca direta', sets: 3, reps: '6-8', rest_seconds: 120 },
      ],
    },
    {
      title: 'Ficha C (ABC) — Força (pernas foco)',
      objective: 'Força',
      items: [
        { name: 'Agachamento livre', sets: 5, reps: '5', rest_seconds: 180 },
        { name: 'Levantamento terra', sets: 3, reps: '5', rest_seconds: 180 },
        { name: 'Leg press', sets: 4, reps: '6-8', rest_seconds: 150 },
        { name: 'Panturrilha', sets: 4, reps: '10-12', rest_seconds: 60 },
      ],
    },
  ];

  const tx = db.transaction(() => {
    const insertWorkout = db.prepare(
      `INSERT INTO workouts (id, title, objective, week_start, user_id, is_template, parent_workout_id, assigned_at, created_by, created_at)
       VALUES (?, ?, ?, NULL, NULL, 1, NULL, NULL, ?, ?)`,
    );
    const insertItem = db.prepare(
      `INSERT INTO workout_items (id, workout_id, name, sets, reps, weight, rest_seconds, notes, order_index)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    );

    const existsByTitle = db.prepare(
      `SELECT id FROM workouts WHERE is_template = 1 AND user_id IS NULL AND title = ? LIMIT 1`,
    );
    templates.forEach((tpl) => {
      const exists = existsByTitle.get(tpl.title) as { id: string } | undefined;
      if (exists) return;
      const workoutId = randomUUID();
      insertWorkout.run(workoutId, tpl.title, tpl.objective, systemUserId, now);
      tpl.items.forEach((it, idx) => {
        insertItem.run(
          randomUUID(),
          workoutId,
          it.name,
          it.sets ?? null,
          it.reps ?? null,
          it.rest_seconds ?? null,
          it.notes ?? null,
          idx,
        );
      });
    });
  });
  tx();
}

function ensureSystemUser(db: Database.Database) {
  const SYSTEM_ID = '00000000-0000-0000-0000-000000000001';
  const exists = db.prepare(`SELECT id FROM users WHERE id = ? LIMIT 1`).get(SYSTEM_ID) as { id: string } | undefined;
  if (exists) return SYSTEM_ID;

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, name, email, role, password_hash, created_at)
     VALUES (?, ?, ?, 'admin', ?, ?)`,
  ).run(SYSTEM_ID, 'System', 'system@apegym.local', '!' /* placeholder */, now);
  return SYSTEM_ID;
}
