// GET  /incidents/:id/handover   raport budowany z danych, bez AI
// POST /incidents/:id/handover   potwierdzenie przejęcia przez ratownika
// POST /incidents/:id/ai-draft   opcjonalny szkic AI (osobny obiekt)
// POST /ai-drafts/:id/approve    zatwierdzenie szkicu przez prowadzącego
import { Router } from 'express';
import { z } from 'zod';
import { generateSummaryDraft } from '../ai/summaryDraft.js';
import { aiAvailable } from '../config.js';
import { get, run, transaction } from '../db/client.js';
import { conflict, notFound } from '../lib/errors.js';
import { newId, nowIso } from '../lib/ids.js';
import { buildHandoverReport } from '../services/handoverReport.js';
import { loadHandover, loadIncident } from '../services/records.js';
import { authorize, h, param, staffId, type Ctx } from './context.js';
import { changeStatus } from './incidents.js';

export function handoverRoutes(ctx: Ctx): Router {
  const r = Router();
  const opts = () => ({ gapThresholdSeconds: ctx.config.CONTACT_GAP_SECONDS, aiAvailable: aiAvailable(ctx.config) });

  r.get(
    '/incidents/:id/handover',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:read', id);
      res.json(buildHandoverReport(ctx.db, id, opts()));
    }),
  );

  r.post(
    '/incidents/:id/handover',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'handover:accept', id);
      if (loadHandover(ctx.db, id)) throw conflict('Zdarzenie zostało już przejęte.');
      if (loadIncident(ctx.db, id).status === 'closed') throw conflict('Zdarzenie jest zamknięte.');
      const { approvedSummary } = z.object({ approvedSummary: z.string().max(4000).nullish() }).parse(req.body ?? {});
      const responderId = staffId(req);
      transaction(ctx.db, () => {
        run(ctx.db, 'INSERT INTO handovers (id, incident_id, responder_id, accepted_at, approved_summary) VALUES ($hid, $id, $responderId, $at, $summary)', {
          hid: newId('ho'),
          id,
          responderId,
          at: nowIso(),
          summary: approvedSummary ?? null,
        });
      });
      changeStatus(ctx, id, 'handed-over', responderId);
      res.status(201).json(buildHandoverReport(ctx.db, id, opts()));
    }),
  );

  r.post(
    '/incidents/:id/ai-draft',
    h(async (req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:read', id);
      res.status(201).json(await generateSummaryDraft(ctx.db, ctx.config, id));
    }),
  );

  r.post(
    '/ai-drafts/:id/approve',
    h((req, res) => {
      const row = get<{ incident_id: string }>(ctx.db, 'SELECT incident_id FROM ai_summary_drafts WHERE id = $id', { id: param(req, 'id') });
      if (!row) throw notFound('Nie ma takiego szkicu.');
      // Szkic zatwierdza prowadzący zdarzenie, nie model (sekcja 9).
      authorize(ctx, req, 'incident:manage', row.incident_id);
      run(ctx.db, 'UPDATE ai_summary_drafts SET approved_by_id = $by, approved_at = $at WHERE id = $id AND approved_at IS NULL', {
        by: staffId(req),
        at: nowIso(),
        id: param(req, 'id'),
      });
      res.json({ ok: true });
    }),
  );
  return r;
}
