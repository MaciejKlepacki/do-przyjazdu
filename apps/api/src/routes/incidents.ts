// GET  /incidents            lista zdarzeń widocznych dla zalogowanego
// POST /incidents            utworzenie sesji (dyspozytor)
// GET  /incidents/:id        podgląd dla panelu
// POST /incidents/:id/status zmiana statusu, zapisywana z autorem i czasem
// POST /incidents/:id/responders  przydzielenie ratownika przejmującego
import { Router } from 'express';
import type { IncidentPanelResponse, IncidentSummary } from '@do-przyjazdu/shared';
import { z } from 'zod';
import { listStaff } from '../auth/dispatcher.js';
import { all, get, run, transaction } from '../db/client.js';
import { badRequest, forbidden } from '../lib/errors.js';
import { newId, nowIso } from '../lib/ids.js';
import { contactStatus, lastReceivedAt } from '../services/contactWindow.js';
import { createIncident } from '../services/incidentSetup.js';
import { outcomes, witnessVisibleInstructions } from '../services/instructionVersions.js';
import { fieldStates, missingInformation } from '../services/missingInformation.js';
import {
  incidentFromRow,
  loadAcknowledgements,
  loadAssignedResponders,
  loadEquipment,
  loadFields,
  loadHandover,
  loadIncident,
  loadInstructions,
  loadObservations,
  loadSituationReports,
  loadSms,
} from '../services/records.js';
import { authorize, h, param, staffId, type Ctx } from './context.js';
import { listLinks } from './witnessAccess.js';

export function incidentRoutes(ctx: Ctx): Router {
  const r = Router();

  r.get(
    '/incidents',
    h((req, res) => {
      const actor = req.actor!;
      if (actor.kind !== 'staff') throw forbidden();
      const rows =
        actor.role === 'dispatcher'
          ? all<Record<string, any>>(ctx.db, 'SELECT * FROM incidents WHERE lead_dispatcher_id = $uid ORDER BY created_at DESC', { uid: actor.userId })
          : all<Record<string, any>>(
              ctx.db,
              `SELECT i.* FROM incidents i JOIN incident_responders r ON r.incident_id = i.id
               WHERE r.responder_id = $uid ORDER BY i.created_at DESC`,
              { uid: actor.userId },
            );
      const body: IncidentSummary[] = rows.map((row) => {
        const i = incidentFromRow(row);
        const open = get<{ n: number }>(
          ctx.db,
          `SELECT (SELECT COUNT(*) FROM situation_change_reports WHERE incident_id = $id AND reviewed_at IS NULL)
                + (SELECT COUNT(*) FROM sms_inbound WHERE linked_incident_id = $id AND read_at IS NULL) AS n`,
          { id: i.id },
        );
        return {
          id: i.id,
          description: i.description,
          status: i.status,
          isDemo: i.isDemo,
          createdAt: i.createdAt,
          lastReceivedAt: lastReceivedAt(ctx.db, i.id),
          openReviews: open?.n ?? 0,
        };
      });
      res.json(body);
    }),
  );

  r.post(
    '/incidents',
    h((req, res) => {
      if (req.actor?.kind !== 'staff' || req.actor.role !== 'dispatcher') throw forbidden('Tylko dyspozytor tworzy sesję.');
      const { description } = z.object({ description: z.string().trim().min(3).max(500) }).parse(req.body);
      const id = createIncident(ctx.db, { description, leadDispatcherId: staffId(req), isDemo: ctx.config.DEMO_MODE });
      res.status(201).json(loadIncident(ctx.db, id));
    }),
  );

  r.get(
    '/incidents/:id',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:read', id);
      const fields = loadFields(ctx.db, id);
      const observations = loadObservations(ctx.db, id);
      const states = fieldStates(fields, observations);
      const instructions = loadInstructions(ctx.db, id);
      const acknowledgements = loadAcknowledgements(ctx.db, id);
      const body: IncidentPanelResponse = {
        incident: loadIncident(ctx.db, id),
        contact: contactStatus(ctx.db, id, ctx.config.CONTACT_GAP_SECONDS),
        witnessLinks: listLinks(ctx, id),
        fields,
        fieldStates: states,
        missingInformation: missingInformation(states),
        observations,
        instructions,
        instructionOutcomes: outcomes(witnessVisibleInstructions(instructions), acknowledgements),
        acknowledgements,
        equipment: loadEquipment(ctx.db, id),
        situationReports: loadSituationReports(ctx.db, id),
        sms: loadSms(ctx.db, id),
        assignedResponders: loadAssignedResponders(ctx.db, id),
        staff: listStaff(ctx.db),
        handover: loadHandover(ctx.db, id),
        serverTime: nowIso(),
      };
      res.json(body);
    }),
  );

  r.post(
    '/incidents/:id/status',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:manage', id);
      const { to } = z.object({ to: z.enum(['open', 'handed-over', 'closed']) }).parse(req.body);
      changeStatus(ctx, id, to, staffId(req));
      res.json(loadIncident(ctx.db, id));
    }),
  );

  r.post(
    '/incidents/:id/responders',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:manage', id);
      const { responderId } = z.object({ responderId: z.string().min(1) }).parse(req.body);
      const user = get<{ role: string }>(ctx.db, 'SELECT role FROM dispatchers WHERE id = $id', { id: responderId });
      if (user?.role !== 'responder') throw badRequest('To konto nie jest ratownikiem.');
      run(
        ctx.db,
        `INSERT OR IGNORE INTO incident_responders (incident_id, responder_id, assigned_at, assigned_by_id)
         VALUES ($id, $responderId, $at, $by)`,
        { id, responderId, at: nowIso(), by: staffId(req) },
      );
      res.json({ assignedResponders: loadAssignedResponders(ctx.db, id) });
    }),
  );

  return r;
}

export function changeStatus(ctx: Ctx, incidentId: string, to: 'open' | 'handed-over' | 'closed', byUserId: string): void {
  const current = loadIncident(ctx.db, incidentId);
  if (current.status === to) return;
  transaction(ctx.db, () => {
    const at = nowIso();
    run(ctx.db, 'UPDATE incidents SET status = $to, closed_at = $closedAt WHERE id = $id', {
      to,
      closedAt: to === 'closed' ? at : null,
      id: incidentId,
    });
    run(
      ctx.db,
      'INSERT INTO status_changes (id, incident_id, from_status, to_status, by_user_id, at) VALUES ($sid, $id, $from, $to, $by, $at)',
      { sid: newId('st'), id: incidentId, from: current.status, to, by: byUserId, at },
    );
  });
}
