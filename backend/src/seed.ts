import type Database from 'better-sqlite3';
import { hashPassword } from './auth.js';
import type { UserRole } from './db.js';

export async function seedAdmin(params: {
  db: Database.Database;
  enabled: boolean;
  email: string;
  password: string;
}) {
  if (!params.enabled) return;

  const exists = params.db.prepare(`SELECT id FROM users WHERE email = ? LIMIT 1`).get(params.email) as
    | { id: string }
    | undefined;
  if (exists) return;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const password_hash = await hashPassword(params.password);
  const role: UserRole = 'admin';

  params.db
    .prepare(
      `INSERT INTO users (id, name, email, role, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, 'Administrador', params.email, role, password_hash, now);

  // eslint-disable-next-line no-console
  console.log(`[seed] Admin criado: ${params.email} / ${params.password}`);
}

