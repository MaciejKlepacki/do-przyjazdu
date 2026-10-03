// Budowa HandoverReport z uporządkowanych danych: ostatnie obserwacje, zatwierdzone
// instrukcje i rezultaty, wyposażenie, nierozwiązane trudności, braki, przerwy w kontakcie.
// Nie wywołuje AI - niedostępne AI nie może blokować przekazania.
import type { HandoverReport } from '@do-przyjazdu/shared';
import type { Db } from '../db/client.js';
import { nowIso } from '../lib/ids.js';
import { contactStatus } from './contactWindow.js';
import { outcomes, witnessVisibleInstructions } from './instructionVersions.js';
import { fieldStates, missingInformation } from './missingInformation.js';
import {
  currentEquipment,
  loadAcknowledgements,
  loadEquipment,
  loadFields,
  loadHandover,
  loadIncident,
  loadInstructions,
  loadLatestAiDraft,
  loadObservations,
  loadSituationReports,
} from './records.js';
import { buildTimeline } from './timeline.js';

export function buildHandoverReport(
  db: Db,
  incidentId: string,
  opts: { gapThresholdSeconds: number; aiAvailable: boolean },
): HandoverReport {
  const incident = loadIncident(db, incidentId);
  const observations = loadObservations(db, incidentId);
  const fields = loadFields(db, incidentId);
  const states = fieldStates(fields, observations);
  const approved = witnessVisibleInstructions(loadInstructions(db, incidentId));
  const acks = loadAcknowledgements(db, incidentId);
  const instructionOutcomes = outcomes(approved, acks);
  const contact = contactStatus(db, incidentId, opts.gapThresholdSeconds);

  const unresolvedDifficulties = instructionOutcomes
    .filter((o) => o.state === 'cannot-do' || o.state === 'needs-clarification')
    .map((o) => acks.find((a) => a.entryId === o.latest?.entryId)!)
    .filter(Boolean);

  let aiDraft = null;
  try {
    aiDraft = loadLatestAiDraft(db, incidentId);
  } catch {
    // Uszkodzony szkic nie może zablokować przekazania.
  }

  return {
    incidentId,
    incident,
    generatedAt: nowIso(),
    lastReceivedAt: contact.lastReceivedAt,
    fields,
    fieldStates: states,
    latestObservations: observations.slice(-5).reverse(),
    approvedInstructions: approved,
    instructionOutcomes,
    acknowledgements: acks,
    equipment: currentEquipment(loadEquipment(db, incidentId)),
    unresolvedDifficulties,
    openSituationReports: loadSituationReports(db, incidentId).filter((r) => !r.reviewedAt),
    missingInformation: missingInformation(states),
    contactGaps: contact.gaps,
    timeline: buildTimeline(db, incidentId, opts.gapThresholdSeconds),
    handover: loadHandover(db, incidentId),
    aiDraft,
    aiAvailable: opts.aiAvailable,
  };
}
