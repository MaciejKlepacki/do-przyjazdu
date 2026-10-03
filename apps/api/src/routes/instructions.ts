// GET   /witness/instructions            tylko status 'approved'
// POST  /incidents/:id/instructions      utworzenie szkicu
// POST  /instructions/:id/approve        zatwierdzenie (autor + czas)
// POST  /instructions/:id/withdraw       wycofanie
// PATCH /instructions/:id                zmiana treści => nowa wersja, stare wersje zostają
import { Router, type Request } from 'express';
import { z } from 'zod';
import { get } from '../db/client.js';
import { notFound } from '../lib/errors.js';
import {
  approveInstruction,
  createDraft,
  editInstruction,
  withdrawInstruction,
  witnessVisibleInstructions,
} from '../services/instructionVersions.js';
import { loadInstructions } from '../services/records.js';
import { authorize, h, param, staffId, type Ctx } from './context.js';

export function witnessInstructionRoutes(ctx: Ctx): Router {
  const r = Router();
  r.get(
    '/instructions',
    h((req, res) => {
      if (req.actor?.kind !== 'witness') throw notFound();
      res.json({ instructions: witnessVisibleInstructions(loadInstructions(ctx.db, req.actor.incidentId)) });
    }),
  );
  return r;
}

function incidentOf(ctx: Ctx, req: Request): string {
  const row = get<{ incident_id: string }>(ctx.db, 'SELECT incident_id FROM instructions WHERE id = $id LIMIT 1', { id: param(req, 'id') });
  if (!row) throw notFound('Nie ma takiej instrukcji.');
  return row.incident_id;
}

const draftSchema = z.object({
  text: z.string().trim().min(1).max(600),
  illustrationUrl: z.string().url().max(500).nullish(),
  packageId: z.string().trim().max(60).nullish(),
  sortOrder: z.number().int().nullish(),
});

export function instructionRoutes(ctx: Ctx): Router {
  const r = Router();
  r.post(
    '/incidents/:id/instructions',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:manage', id);
      const input = draftSchema.parse(req.body);
      res.status(201).json(
        createDraft(ctx.db, id, staffId(req), {
          text: input.text,
          illustrationUrl: input.illustrationUrl ?? null,
          packageId: input.packageId || null,
          sortOrder: input.sortOrder ?? null,
        }),
      );
    }),
  );
  r.patch(
    '/instructions/:id',
    h((req, res) => {
      const incidentId = incidentOf(ctx, req);
      authorize(ctx, req, 'incident:manage', incidentId);
      const { text } = z.object({ text: z.string().trim().min(1).max(600) }).parse(req.body);
      res.json(editInstruction(ctx.db, incidentId, param(req, 'id'), staffId(req), text));
    }),
  );
  r.post(
    '/instructions/:id/approve',
    h((req, res) => {
      const incidentId = incidentOf(ctx, req);
      authorize(ctx, req, 'incident:manage', incidentId);
      const { version } = z.object({ version: z.number().int().positive() }).parse(req.body);
      res.json(approveInstruction(ctx.db, incidentId, param(req, 'id'), version, staffId(req)));
    }),
  );
  r.post(
    '/instructions/:id/withdraw',
    h((req, res) => {
      const incidentId = incidentOf(ctx, req);
      authorize(ctx, req, 'incident:manage', incidentId);
      withdrawInstruction(ctx.db, incidentId, param(req, 'id'));
      res.json({ ok: true });
    }),
  );
  return r;
}
