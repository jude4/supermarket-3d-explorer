import { BadRequestException, ConflictException, ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import { PrismaClient, Role, type User } from '@prisma/client';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

const COOKIE = 'se_session';
const SESSION_MS = 8 * 60 * 60 * 1000;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_LENGTH = 64;
const DUMMY_HASH = `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${Buffer.alloc(16, 37).toString('hex')}$${Buffer.alloc(SCRYPT_LENGTH).toString('hex')}`;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, SCRYPT_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error); else resolve(key as Buffer);
    });
  });
}
function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < 12 || password.length > 200) throw new BadRequestException('Password must contain between 12 and 200 characters.');
  return password;
}
function emailAddress(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('A valid email address is required.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('A valid email address is required.');
  return email;
}
function displayName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) throw new BadRequestException('Name must contain between 2 and 100 characters.');
  return value.trim();
}
function bodyObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('A JSON object is required.');
  return value as Record<string, unknown>;
}
function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
function sessionToken(req: Request): string | undefined {
  const values = (req.headers.cookie || '').split(';').map(p => p.trim()).filter(p => p.startsWith(`${COOKIE}=`));
  if (values.length !== 1) return undefined;
  const token = values[0].slice(COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? token : undefined;
}
function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production' || process.env.SESSION_COOKIE_SECURE === 'true', sameSite: 'lax' as const, path: '/api' };
}

export async function passwordHash(password: string): Promise<string> {
  validatePassword(password);
  const salt = randomBytes(16), hash = await derive(password, salt);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${hash.toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (typeof password !== 'string' || password.length > 200) return false;
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt' || +parts[1] !== SCRYPT_N || +parts[2] !== SCRYPT_R || +parts[3] !== SCRYPT_P || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{128}$/.test(parts[5])) return false;
  const expected = Buffer.from(parts[5], 'hex'), actual = await derive(password, Buffer.from(parts[4], 'hex'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Exact origin allowlisting for browser cookie mutations. CLI calls without cookies may omit Origin. */
export function assertOrigin(req: Request): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return;
  const origin = req.headers.origin;
  if (!origin) {
    if (sessionToken(req) || req.headers['sec-fetch-site']) throw new ForbiddenException('An allowed Origin header is required for cookie-authenticated requests.');
    return;
  }
  const configured = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3001,http://127.0.0.1:3001';
  const allowed = new Set(configured.split(',').map(v => v.trim().replace(/\/$/, '')).filter(Boolean));
  let normalized: string;
  try { const url = new URL(origin); if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw new Error('origin'); normalized = url.origin; }
  catch { throw new ForbiddenException('Origin is not allowed.'); }
  if (!allowed.has(normalized)) throw new ForbiddenException('Origin is not allowed.');
}

interface Attempt { count: number; until: number }
const attempts = new Map<string, Attempt>();
function consumeAttempt(key: string, limit: number) {
  const now = Date.now();
  let item = attempts.get(key);
  if (item && item.until <= now) { attempts.delete(key); item = undefined; }
  if (item && item.count >= limit) throw new HttpException('Too many sign-in attempts. Try again later.', 429);
  if (!item) {
    // Bound memory even when an attacker supplies unbounded account names/IPs.
    if (attempts.size >= 5000) {
      for (const [existing, value] of attempts) if (value.until <= now) attempts.delete(existing);
      if (attempts.size >= 5000) attempts.delete(attempts.keys().next().value!);
    }
    item = { count: 0, until: now + 15 * 60 * 1000 }; attempts.set(key, item);
  }
  item.count++;
}

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async user(req: Request): Promise<User | null> {
    const token = sessionToken(req);
    if (!token) return null;
    const session = await this.prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) await this.prisma.session.deleteMany({ where: { id: session.id } });
      return null;
    }
    return session.user;
  }

  async require(req: Request, roles?: Role[]): Promise<User> {
    const user = await this.user(req);
    if (!user) throw new UnauthorizedException('Sign in to continue.');
    if (roles && !roles.includes(user.role)) throw new ForbiddenException('Your account does not have permission for this action.');
    return user;
  }

  async createUser(value: { email: string; name: string; password: string; role?: Role }): Promise<User> {
    const data = { email: emailAddress(value.email), name: displayName(value.name), passwordHash: await passwordHash(value.password), role: value.role || Role.CUSTOMER };
    if (!Object.values(Role).includes(data.role)) throw new BadRequestException('Invalid account role.');
    try { return await this.prisma.user.create({ data }); }
    catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw new ConflictException('An account with that email already exists.');
      throw error;
    }
  }

  private async establish(req: Request, res: Response, user: User) {
    const oldToken = sessionToken(req), token = randomBytes(32).toString('hex');
    await this.prisma.$transaction(async tx => {
      if (oldToken) await tx.session.deleteMany({ where: { tokenHash: tokenHash(oldToken) } });
      await tx.session.create({ data: { userId: user.id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + SESSION_MS) } });
      await tx.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    });
    res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: SESSION_MS });
    return { user: publicUser(user) };
  }

  async guest(req: Request, res: Response) {
    assertOrigin(req);
    const existing = await this.user(req);
    if (existing) return { user: publicUser(existing) };
    const user = await this.prisma.user.create({ data: { name: 'Guest shopper', role: Role.CUSTOMER } });
    return this.establish(req, res, user);
  }

  async login(value: unknown, req: Request, res: Response) {
    assertOrigin(req);
    const body = bodyObject(value);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    consumeAttempt(`ip:${ip}`, 50); consumeAttempt(`account:${tokenHash(email)}`, 12);
    const user = email ? await this.prisma.user.findUnique({ where: { email } }) : null;
    const password = typeof body.password === 'string' ? body.password : '';
    const correct = await verifyPassword(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !user.passwordHash || !correct) throw new UnauthorizedException('Email or password is incorrect.');
    attempts.delete(`account:${tokenHash(email)}`);
    return this.establish(req, res, user);
  }

  async register(value: unknown, req: Request, res: Response) {
    assertOrigin(req);
    const body = bodyObject(value);
    if ('role' in body && body.role !== Role.CUSTOMER) throw new BadRequestException('Registration cannot assign staff roles.');
    consumeAttempt(`register:${req.ip || req.socket?.remoteAddress || 'unknown'}`, 20);
    const user = await this.createUser({ email: emailAddress(body.email), name: displayName(body.name), password: validatePassword(body.password), role: Role.CUSTOMER });
    return this.establish(req, res, user);
  }

  async logout(req: Request, res: Response) {
    assertOrigin(req);
    const token = sessionToken(req);
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
    res.clearCookie(COOKIE, cookieOptions());
    return { ok: true };
  }
}
