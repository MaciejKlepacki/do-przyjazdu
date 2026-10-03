// POST /witness/situation-changes          zgłoszenie zmiany sytuacji
// POST /situation-changes/:entryId/review  ręczne potwierdzenie obsługi przez prowadzącego
import { Router } from 'express';
import { get, run } from '../db/client.js';
import { notFound } from '../lib/errors.js';
import { nowIso } from '../lib/ids.js';
import { authorize, h, param, staffId, type Ctx } from './context.js';
import { singleWitnessEntry } from './observations.js';

export function witnessSituationRoutes(ctx: Ctx): Router {
  const r = Router();
  r.post('/situation-changes', singleWitnessEntry(ctx, 'situation-change'));
  return r;
}

export function situationReviewRoutes(ctx: Ctx): Router {
  const r = Router();
  r.post(
    '/situation-changes/:entryId/review',
    h((req, res) => {
      const entryId = param(req, 'entryId');
      const row = get<{ incident_id: string }>(ctx.db, 'SELECT incident_id FROM situation_change_reports WHERE entry_id = $entryId', { entryId });
      if (!row) throw notFound('Nie ma takiego zgłoszenia.');
      authorize(ctx, req, 'incident:manage', row.incident_id);
      run(
        ctx.db,
        'UPDATE situation_change_reports SET reviewed_at = $at, reviewed_by_id = $by WHERE entry_id = $entryId AND reviewed_at IS NULL',
        { at: nowIso(), by: staffId(req), entryId },
      );
      res.json({ ok: true });
    }),
  );
  return r;
}
