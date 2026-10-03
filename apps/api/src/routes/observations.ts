// GET  /incidents/:id/observations   dla panelu, z informacją o brakach i źródle
// POST /incidents/:id/observations   ocena prowadzącego - osobne źródło niż obserwacja świadka (sekcja 8)
// POST /witness/observations         wpis z telefonu; idempotentny po entry_id
import { Router } from 'express';
import { z } from 'zod';
import { run } from '../db/client.js';
import { newId, nowIso } from '../lib/ids.js';
import { fieldStates, missingInformation } from '../services/missingInformation.js';
import { loadFields, loadObservations } from '../services/records.js';
import { acceptEnvelope } from '../services/witnessEntries.js';
import { authorize, h, param, staffId, type Ctx } from './context.js';

/** Pojedynczy wpis świadka - ta sama ścieżka co /witness/sync. */
export function singleWitnessEntry(ctx: Ctx, kind: string) {
  return h((req, res) => {
    const actor = req.actor;
    if (actor?.kind !== 'witness') return res.status(401).json({ error: 'unauthorized', message: 'Wymagany link świadka.' });
    const result = acceptEnvelope(ctx.db, actor.incidentId, { ...req.body, kind });
    res.status(result.accepted ? (result.duplicate ? 200 : 201) : 422).json(result);
  });
}

export function witnessObservationRoutes(ctx: Ctx): Router {
  const r = Router();
  r.post('/observations', singleWitnessEntry(ctx, 'observation'));
  return r;
}

export function observationRoutes(ctx: Ctx): Router {
  const r = Router();
  r.get(
    '/incidents/:id/observations',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:read', id);
      const observations = loadObservations(ctx.db, id);
      const states = fieldStates(loadFields(ctx.db, id), observations);
      res.json({ observations, fieldStates: states, missingInformation: missingInformation(states) });
    }),
  );
  r.post(
    '/incidents/:id/observations',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:manage', id);
      const { text } = z.object({ text: z.string().trim().min(1).max(1000) }).parse(req.body);
      const at = nowIso();
      const entryId = newId('obs');
      run(
        ctx.db,
        `INSERT INTO observations (entry_id, incident_id, author_kind, author_id, source, channel, answers_json, free_text, device_sequence, device_time, received_time)
         VALUES ($entryId, $id, 'dispatcher', $author, 'dispatcher-assessment', 'https', '[]', $text, 0, $at, $at)`,
        { entryId, id, author: staffId(req), text, at },
      );
      res.status(201).json({ entryId });
    }),
  );
  return r;
}
