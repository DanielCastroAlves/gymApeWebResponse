import Database from 'better-sqlite3';
import path from 'node:path';

export type UserRole = 'aluno' | 'admin';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
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
      role TEXT NOT NULL CHECK(role IN ('aluno','admin')),
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
  `);

  // Migrações simples para DBs já existentes
  if (!hasColumn(db, 'workouts', 'is_template')) {
    db.exec(`ALTER TABLE workouts ADD COLUMN is_template INTEGER NOT NULL DEFAULT 0;`);
  }
  if (!hasColumn(db, 'workouts', 'parent_workout_id')) {
    db.exec(`ALTER TABLE workouts ADD COLUMN parent_workout_id TEXT;`);
  }
  if (!hasColumn(db, 'workouts', 'assigned_at')) {
    db.exec(`ALTER TABLE workouts ADD COLUMN assigned_at TEXT;`);
  }

  // Índices (criar depois das migrações, para suportar DBs antigos)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
    CREATE INDEX IF NOT EXISTS idx_workouts_is_template ON workouts(is_template);
    CREATE INDEX IF NOT EXISTS idx_workouts_parent_id ON workouts(parent_workout_id);
  `);

  return db;
}

