// Token świadka: losowy, bez danych w treści linku (sekcja 11).
// Baza trzyma skrót. Sprawdzane: ważność, unieważnienie, przypisanie do jednej sesji.
import { createHash, randomBytes } from 'node:crypto';
import { get, run, type Db } from '../db/client.js';
import { newId, nowIso } from '../lib/ids.js';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface IssuedWitnessLink {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export function issue(db: Db, incidentId: string, ttlMinutes: number, fixedToken?: string): IssuedWitnessLink {
  const token = fixedToken || randomBytes(24).toString('base64url');
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const id = newId('wl');
  run(
    db,
    `INSERT INTO witness_access (id, incident_id, token_hash, expires_at, created_at)
     VALUES ($id, $incidentId, $hash, $expiresAt, $createdAt)`,
    { id, incidentId, hash: hashToken(token), expiresAt, createdAt },
  );
  return { id, token, createdAt, expiresAt };
}

export type WitnessVerification =
  | { ok: true; accessId: string; incidentId: string; expiresAt: string }
  | { ok: false; reason: 'unknown' | 'revoked' | 'expired' };

export function verify(db: Db, token: string): WitnessVerification {
  if (!token) return { ok: false, reason: 'unknown' };
  const row = get<{ id: string; incident_id: string; expires_at: string; revoked_at: string | null }>(
    db,
    'SELECT id, incident_id, expires_at, revoked_at FROM witness_access WHERE token_hash = $hash',
    { hash: hashToken(token) },
  );
  if (!row) return { ok: false, reason: 'unknown' };
  if (row.revoked_at) return { ok: false, reason: 'revoked' };
  if (row.expires_at <= nowIso()) return { ok: false, reason: 'expired' };
  return { ok: true, accessId: row.id, incidentId: row.incident_id, expiresAt: row.expires_at };
}

export function revoke(db: Db, accessId: string): boolean {
  return run(db, 'UPDATE witness_access SET revoked_at = $at WHERE id = $id AND revoked_at IS NULL', {
    id: accessId,
    at: nowIso(),
  }) > 0;
}
