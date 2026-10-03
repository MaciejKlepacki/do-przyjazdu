// Uwierzytelnienie panelu. Sam adres panelu nie daje uprawnień (sekcja 11).
// W demo wspólny sekret z DISPATCHER_PASSWORD; przed pilotażem realne konta.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { StaffRole, StaffUser } from '@do-przyjazdu/shared';
import type { Config } from '../config.js';
import { all, get, run, type Db } from '../db/client.js';
import { unauthorized } from '../lib/errors.js';
import { nowIso } from '../lib/ids.js';

export const SESSION_COOKIE = 'dp_session';
const SESSION_HOURS = 12;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Konta demo tworzone przy starcie; hasło z DISPATCHER_PASSWORD. */
export const DEMO_STAFF: Array<{ id: string; displayName: string; role: StaffRole }> = [
  { id: 'dyspozytor', displayName: 'Dyspozytor (demo)', role: 'dispatcher' },
  { id: 'ratownik', displayName: 'Ratownik przejmujący (demo)', role: 'responder' },
];

export function ensureStaffAccounts(db: Db, config: Config): void {
  for (const s of DEMO_STAFF) {
    const existing = get<{ password_hash: string }>(db, 'SELECT password_hash FROM dispatchers WHERE id = $id', { id: s.id });
    if (existing && verifyPassword(config.DISPATCHER_PASSWORD, existing.password_hash)) continue;
    run(
      db,
      `INSERT INTO dispatchers (id, display_name, role, password_hash, created_at)
       VALUES ($id, $name, $role, $hash, $at)
       ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, display_name = excluded.display_name`,
      { id: s.id, name: s.displayName, role: s.role, hash: hashPassword(config.DISPATCHER_PASSWORD), at: nowIso() },
    );
  }
}

export function listStaff(db: Db): StaffUser[] {
  return all<{ id: string; display_name: string; role: StaffRole }>(
    db,
    'SELECT id, display_name, role FROM dispatchers ORDER BY role, display_name',
  ).map((r) => ({ id: r.id, displayName: r.display_name, role: r.role }));
}

export function findStaff(db: Db, id: string): (StaffUser & { passwordHash: string }) | undefined {
  const r = get<{ id: string; display_name: string; role: StaffRole; password_hash: string }>(
    db,
    'SELECT id, display_name, role, password_hash FROM dispatchers WHERE id = $id',
    { id },
  );
  return r && { id: r.id, displayName: r.display_name, role: r.role, passwordHash: r.password_hash };
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionCookie(userId: string, secret: string): { value: string; maxAgeMs: number } {
  const exp = Date.now() + SESSION_HOURS * 3_600_000;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url');
  return { value: `${payload}.${sign(payload, secret)}`, maxAgeMs: SESSION_HOURS * 3_600_000 };
}

export function readSessionCookie(value: string | undefined, secret: string): string | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { uid: string; exp: number };
    return exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Wymaga zalogowanego konta panelu. Rola sprawdzana osobno przy każdym zdarzeniu (roles.can). */
export function requireStaff(db: Db, config: Config) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const uid = readSessionCookie(parseCookies(req.headers.cookie)[SESSION_COOKIE], config.SESSION_SECRET);
    const user = uid ? findStaff(db, uid) : undefined;
    if (!user) return next(unauthorized());
    req.actor = { kind: 'staff', userId: user.id, role: user.role, displayName: user.displayName };
    next();
  };
}
