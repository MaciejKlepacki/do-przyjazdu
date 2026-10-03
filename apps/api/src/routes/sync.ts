// POST /witness/sync   wysłanie kolejki z urządzenia
// Przyjmuje tablicę SyncEnvelope, zwraca SyncResponse z duplicate=true dla ponowień (reguła 2).
// Zapisuje device_time i received_time oddzielnie (reguła 3).
import { Router } from 'express';
import type { SyncResponse } from '@do-przyjazdu/shared';
import { badRequest } from '../lib/errors.js';
import { nowIso } from '../lib/ids.js';
import { acceptEnvelope } from '../services/witnessEntries.js';
import { h, type Ctx } from './context.js';

export function syncRoutes(ctx: Ctx): Router {
  const r = Router();
  r.post(
    '/sync',
    h((req, res) => {
      const actor = req.actor;
      if (actor?.kind !== 'witness') throw badRequest('Tylko dla telefonu świadka.');
      const entries: unknown[] = Array.isArray(req.body?.entries) ? req.body.entries : [];
      if (entries.length > 200) throw badRequest('Za dużo wpisów w jednej wysyłce.');
      // Kolejność z urządzenia (reguła 1).
      const sorted = entries.slice().sort((a: any, b: any) => (a?.deviceSequence ?? 0) - (b?.deviceSequence ?? 0));
      const body: SyncResponse = { items: sorted.map((e) => acceptEnvelope(ctx.db, actor.incidentId, e)), serverTime: nowIso() };
      res.json(body);
    }),
  );
  return r;
}
