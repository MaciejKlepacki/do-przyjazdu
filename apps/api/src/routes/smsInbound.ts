// POST /sms/inbound   webhook uzgodnionego odbiornika SMS (poza podstawowym MVP).
// Bez SMS_INBOUND_SECRET trasa działa wyłącznie w trybie symulacji i tak oznacza wpisy.
// Wiadomość bez poprawnego identyfikatora sesji => needs_manual_review, nigdy autoprzypisanie (reguła 9).
import { createHash, timingSafeEqual } from 'node:crypto';
import { Router, type Request } from 'express';
import { parseSmsBody } from '@do-przyjazdu/shared';
import { z } from 'zod';
import { requireStaff } from '../auth/dispatcher.js';
import { get, run, type Db } from '../db/client.js';
import { forbidden, HttpError, notFound } from '../lib/errors.js';
import { newId, nowIso } from '../lib/ids.js';
import { loadUnassignedSms, smsFromRow } from '../services/records.js';
import { authorize, h, param, staffId, type Ctx } from './context.js';

const inboundSchema = z.object({ text: z.string().min(1).max(1000), from: z.string().max(40).nullish() });

/** Zapis wiadomości. Przypisanie tylko, gdy identyfikator zdarzenia istnieje; wpis łączymy po entryId (reguła 8). */
export function recordInboundSms(db: Db, input: { text: string; from?: string | null | undefined }, simulated: boolean) {
  const parsed = parseSmsBody(input.text);
  const incidentExists = parsed && get(db, 'SELECT 1 AS ok FROM incidents WHERE id = $id', { id: parsed.incidentId });
  const id = newId('sms');
  run(
    db,
    `INSERT INTO sms_inbound (id, raw_text, from_number_hash, claimed_incident_id, claimed_entry_id, linked_incident_id, linked_entry_id, needs_manual_review, received_time, is_simulated)
     VALUES ($id, $raw, $from, $claimedIncident, $claimedEntry, $linkedIncident, $linkedEntry, $review, $at, $simulated)`,
    {
      id,
      raw: input.text,
      from: input.from ? createHash('sha256').update(input.from).digest('hex') : null,
      claimedIncident: parsed?.incidentId ?? null,
      claimedEntry: parsed?.entryId ?? null,
      linkedIncident: incidentExists ? parsed!.incidentId : null,
      linkedEntry: incidentExists ? parsed!.entryId : null,
      review: incidentExists ? 0 : 1,
      at: nowIso(),
      simulated: simulated ? 1 : 0,
    },
  );
  return smsFromRow(get<Record<string, any>>(db, 'SELECT * FROM sms_inbound WHERE id = $id', { id })!);
}

function secretMatches(req: Request, secret: string): boolean {
  const given = Buffer.from(String(req.headers['x-sms-secret'] ?? ''));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function smsRoutes(ctx: Ctx): Router {
  const r = Router();
  const staff = requireStaff(ctx.db, ctx.config);

  // Prawdziwy odbiornik - tylko z ustawionym sekretem.
  r.post(
    '/sms/inbound',
    h((req, res) => {
      if (!ctx.config.SMS_INBOUND_SECRET) throw new HttpError(404, 'sms-disabled', 'Odbiornik SMS nie jest skonfigurowany. Użyj symulacji w panelu.');
      if (!secretMatches(req, ctx.config.SMS_INBOUND_SECRET)) throw forbidden('Nieprawidłowy sekret odbiornika.');
      res.status(201).json(recordInboundSms(ctx.db, inboundSchema.parse(req.body), false));
    }),
  );

  // Symulacja odbioru w demo - wpisy oznaczone jako symulowane.
  r.post(
    '/sms/simulate',
    staff,
    h((req, res) => {
      if (req.actor?.kind !== 'staff' || req.actor.role !== 'dispatcher') throw forbidden();
      res.status(201).json(recordInboundSms(ctx.db, inboundSchema.parse(req.body), true));
    }),
  );

  r.get(
    '/sms/unassigned',
    staff,
    h((req, res) => {
      if (req.actor?.kind !== 'staff' || req.actor.role !== 'dispatcher') throw forbidden();
      res.json(loadUnassignedSms(ctx.db));
    }),
  );

  // Ręczne przypisanie wiadomości z kolejki weryfikacji.
  r.post(
    '/sms/:id/assign',
    staff,
    h((req, res) => {
      const { incidentId } = z.object({ incidentId: z.string().min(1) }).parse(req.body);
      authorize(ctx, req, 'incident:manage', incidentId);
      const changed = run(
        ctx.db,
        'UPDATE sms_inbound SET linked_incident_id = $incidentId, needs_manual_review = 0 WHERE id = $id AND linked_incident_id IS NULL',
        { incidentId, id: param(req, 'id') },
      );
      if (!changed) throw notFound('Wiadomość nie czeka na przypisanie.');
      res.json({ ok: true });
    }),
  );

  // Odbiór to nie to samo co przeczytanie - prowadzący potwierdza osobno (sekcja 10).
  r.post(
    '/sms/:id/read',
    staff,
    h((req, res) => {
      const row = get<{ linked_incident_id: string | null }>(ctx.db, 'SELECT linked_incident_id FROM sms_inbound WHERE id = $id', { id: param(req, 'id') });
      if (!row?.linked_incident_id) throw notFound('Nie ma takiej wiadomości przypisanej do zdarzenia.');
      authorize(ctx, req, 'incident:manage', row.linked_incident_id);
      run(ctx.db, 'UPDATE sms_inbound SET read_by_id = $by, read_at = $at WHERE id = $id AND read_at IS NULL', {
        by: staffId(req),
        at: nowIso(),
        id: param(req, 'id'),
      });
      res.json({ ok: true });
    }),
  );
  return r;
}
