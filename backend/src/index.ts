import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { openDb } from './db.js';
import { authRoutes } from './routes/auth.js';
import { appRoutes } from './routes/app.js';
import { adminRoutes } from './routes/admin.js';
import { authMiddleware, requireRole } from './middleware/auth.js';
import { seedAdmin } from './seed.js';

const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me';
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

const db = openDb();

await seedAdmin({
  db,
  enabled: (process.env.SEED_ADMIN ?? 'false') === 'true',
  email: process.env.SEED_ADMIN_EMAIL ?? 'admin@apegym.local',
  password: process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
});

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes({ db, jwtSecret: JWT_SECRET }));

app.use('/app', authMiddleware({ db, jwtSecret: JWT_SECRET }), appRoutes({ db }));

app.use(
  '/admin',
  authMiddleware({ db, jwtSecret: JWT_SECRET }),
  requireRole('admin'),
  adminRoutes({ db }),
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof err?.status === 'number' ? err.status : 500;
  const message = typeof err?.message === 'string' ? err.message : 'Erro interno';
  res.status(status).json({ error: { message } });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${PORT}`);
});

