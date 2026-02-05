import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { UserRole } from './db.js';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(params: { userId: string; role: UserRole; jwtSecret: string }) {
  const payload: JwtPayload = { sub: params.userId, role: params.role };
  return jwt.sign(payload, params.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(params: { token: string; jwtSecret: string }): JwtPayload {
  const decoded = jwt.verify(params.token, params.jwtSecret) as jwt.JwtPayload;
  const sub = decoded.sub;
  const role = decoded.role;
  if (typeof sub !== 'string') throw new Error('Token inválido');
  if (role !== 'aluno' && role !== 'admin') throw new Error('Token inválido');
  return { sub, role };
}

