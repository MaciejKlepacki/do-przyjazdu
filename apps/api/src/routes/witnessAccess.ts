// POST   /incidents/:id/witness-links   wygenerowanie linku dla świadka
// DELETE /witness-links/:id             unieważnienie linku
// GET    /witness/session               stan sesji dla telefonu (sprawdzane przed synchronizacją, reguła 7)
import { Router, type NextFunction, type Request, type Response } from 'express';
import type { WitnessLinkCreated, WitnessLinkInfo, WitnessSessionResponse } from '@do-przyjazdu/shared';
import { issue, revoke, verify } from '../auth/witnessToken.js';
import { all, get } from '../db/client.js';
import { HttpError, notFound } from '../lib/errors.js';
import { nowIso } from '../lib/ids.js';
import { touchWitness } from '../services/contactWindow.js';
import { witnessVisibleInstructions } from '../services/instructionVersions.js';
import { currentEquipment, loadEquipment, loadFields, loadIncident, loadInstructions, loadSms } from '../services/records.js';
import { authorize, h, param, type Ctx } from './context.js';

const REVOKED_MESSAGES = {
  unknown: 'Ten link jest nieprawidłowy.',
  revoked: 'Dostęp do tego zdarzenia został unieważniony przez prowadzącego.',
  expired: 'Ważność linku minęła. Poproś prowadzącego o nowy.',
} as const;

const accessExpiry = new WeakMap<Request, string>();

/** Token świadka z nagłówka Authorization. Dostęp wyłącznie do jednej sesji. */
export function requireWitness(ctx: Ctx) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const result = verify(ctx.db, token);
    if (!result.ok) return next(new HttpError(401, `witness-${result.reason}`, REVOKED_MESSAGES[result.reason]));
    req.actor = { kind: 'witness', incidentId: result.incidentId, accessId: result.accessId };
    accessExpiry.set(req, result.expiresAt);
    touchWitness(ctx.db, result.accessId, result.incidentId, ctx.config.CONTACT_GAP_SECONDS);
    next();
  };
}


export function linkInfo(r: Record<string, any>): WitnessLinkInfo {
  return { id: r.id, createdAt: r.created_at, expiresAt: r.expires_at, revokedAt: r.revoked_at, lastSeenAt: r.last_seen_at };
}

export function listLinks(ctx: Ctx, incidentId: string): WitnessLinkInfo[] {
  return all<Record<string, any>>(ctx.db, 'SELECT * FROM witness_access WHERE incident_id = $incidentId ORDER BY created_at', {
    incidentId,
  }).map(linkInfo);
}

export function witnessRoutes(ctx: Ctx): Router {
  const r = Router();
  r.get(
    '/session',
    h((req, res) => {
      const actor = req.actor!;
      if (actor.kind !== 'witness') throw notFound();
      const incident = loadIncident(ctx.db, actor.incidentId);
      const body: WitnessSessionResponse = {
        incident: { id: incident.id, description: incident.description, status: incident.status, isDemo: incident.isDemo },
        fields: loadFields(ctx.db, incident.id),
        instructions: witnessVisibleInstructions(loadInstructions(ctx.db, incident.id)),
        equipment: currentEquipment(loadEquipment(ctx.db, incident.id)),
        smsReceipts: loadSms(ctx.db, incident.id)
          .filter((s) => s.linkedEntryId)
          .map((s) => ({ entryId: s.linkedEntryId!, receivedTime: s.receivedTime, readAt: s.readAt })),
        sms: { number: ctx.config.SMS_NUMBER || null, simulated: !ctx.config.SMS_INBOUND_SECRET },
        demoMode: ctx.config.DEMO_MODE,
        accessExpiresAt: accessExpiry.get(req) ?? '',
        serverTime: nowIso(),
      };
      res.json(body);
    }),
  );
  return r;
}

export function witnessLinkRoutes(ctx: Ctx): Router {
  const r = Router();
  r.post(
    '/incidents/:id/witness-links',
    h((req, res) => {
      const incidentId = param(req, 'id');
      authorize(ctx, req, 'incident:manage', incidentId);
      const link = issue(ctx.db, incidentId, ctx.config.WITNESS_TOKEN_TTL_MINUTES);
      const body: WitnessLinkCreated = {
        id: link.id,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        revokedAt: null,
        lastSeenAt: null,
        token: link.token,
        path: `/w/${link.token}`,
      };
      res.status(201).json(body);
    }),
  );
  r.delete(
    '/witness-links/:id',
    h((req, res) => {
      const row = get<{ incident_id: string }>(ctx.db, 'SELECT incident_id FROM witness_access WHERE id = $id', { id: param(req, 'id') });
      if (!row) throw notFound('Nie ma takiego linku.');
      authorize(ctx, req, 'incident:manage', row.incident_id);
      revoke(ctx.db, param(req, 'id'));
      res.json({ ok: true });
    }),
  );
  return r;
}
