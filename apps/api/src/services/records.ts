// Odczyt wierszy z bazy i zamiana na obiekty modelu ze wspólnego pakietu.
// Jedno miejsce mapowania kolumn snake_case na pola modelu.
import type {
  Acknowledgement,
  AiSummaryDraft,
  AiSummarySentence,
  ContactGap,
  DeliveryChannel,
  EquipmentItem,
  Handover,
  InboundSms,
  Incident,
  InformationSource,
  Instruction,
  Observation,
  ObservationAnswer,
  ObservationField,
  SituationChangeReport,
  StaffUser,
} from '@do-przyjazdu/shared';
import { all, get, type Db } from '../db/client.js';
import { notFound } from '../lib/errors.js';

type R = Record<string, any>;

const author = (kind: string, id: string | null, incidentId: string): Observation['author'] => {
  if (kind === 'witness') return { kind: 'witness', incidentId };
  if ((kind === 'dispatcher' || kind === 'responder') && id) return { kind, userId: id };
  return { kind: 'system' };
};

export function incidentFromRow(r: R): Incident {
  return {
    id: r.id,
    description: r.description,
    status: r.status,
    leadDispatcherId: r.lead_dispatcher_id,
    createdAt: r.created_at,
    closedAt: r.closed_at,
    isDemo: r.is_demo === 1,
  };
}

export function loadIncident(db: Db, id: string): Incident {
  const row = get<R>(db, 'SELECT * FROM incidents WHERE id = $id', { id });
  if (!row) throw notFound('Nie ma takiego zdarzenia.');
  return incidentFromRow(row);
}

export function loadFields(db: Db, incidentId: string): ObservationField[] {
  return all<R>(db, 'SELECT * FROM observation_fields WHERE incident_id = $incidentId ORDER BY sort_order', {
    incidentId,
  }).map((r) => {
    const field: ObservationField = { key: r.field_key, label: r.label, kind: r.kind, allowsUnknown: true };
    if (r.options_json) field.options = JSON.parse(r.options_json);
    if (r.unit) field.unit = r.unit;
    return field;
  });
}

export function observationFromRow(r: R): Observation {
  return {
    entryId: r.entry_id,
    incidentId: r.incident_id,
    author: author(r.author_kind, r.author_id, r.incident_id),
    source: r.source as InformationSource,
    channel: r.channel as DeliveryChannel,
    answers: JSON.parse(r.answers_json) as ObservationAnswer[],
    freeText: r.free_text,
    deviceSequence: r.device_sequence,
    times: { deviceTime: r.device_time, receivedTime: r.received_time },
  };
}

export function loadObservations(db: Db, incidentId: string): Observation[] {
  return all<R>(db, 'SELECT * FROM observations WHERE incident_id = $incidentId ORDER BY received_time, device_sequence', {
    incidentId,
  }).map(observationFromRow);
}

export function instructionFromRow(r: R): Instruction {
  return {
    id: r.id,
    incidentId: r.incident_id,
    version: r.version,
    text: r.text,
    illustrationUrl: r.illustration_url,
    sortOrder: r.sort_order,
    packageId: r.package_id,
    authorId: r.author_id,
    approvedBy: r.approved_by_id ? { kind: 'dispatcher', userId: r.approved_by_id } : null,
    status: r.status,
    approvedAt: r.approved_at,
    withdrawnAt: r.withdrawn_at,
    createdAt: r.created_at,
  };
}

export function loadInstructions(db: Db, incidentId: string): Instruction[] {
  return all<R>(db, 'SELECT * FROM instructions WHERE incident_id = $incidentId ORDER BY sort_order, id, version', {
    incidentId,
  }).map(instructionFromRow);
}

export function ackFromRow(r: R): Acknowledgement {
  return {
    entryId: r.entry_id,
    incidentId: r.incident_id,
    instructionId: r.instruction_id,
    instructionVersion: r.instruction_version,
    result: r.result,
    comment: r.comment,
    channel: r.channel,
    deviceSequence: r.device_sequence,
    times: { deviceTime: r.device_time, receivedTime: r.received_time },
  };
}

export function loadAcknowledgements(db: Db, incidentId: string): Acknowledgement[] {
  return all<R>(db, 'SELECT * FROM acknowledgements WHERE incident_id = $incidentId ORDER BY received_time, device_sequence', {
    incidentId,
  }).map(ackFromRow);
}

export function equipmentFromRow(r: R): EquipmentItem {
  return {
    id: r.id,
    incidentId: r.incident_id,
    name: r.name,
    state: r.state,
    packageId: r.package_id,
    author: author(r.author_kind, r.author_id, r.incident_id),
    times: { deviceTime: r.device_time, receivedTime: r.received_time },
  };
}

export function loadEquipment(db: Db, incidentId: string): EquipmentItem[] {
  return all<R>(db, 'SELECT * FROM equipment WHERE incident_id = $incidentId ORDER BY received_time', { incidentId }).map(
    equipmentFromRow,
  );
}

/** Każdy wpis wyposażenia zostaje w historii; aktualny stan pozycji to ostatni wpis o tej nazwie. */
export function currentEquipment(items: EquipmentItem[]): EquipmentItem[] {
  const byName = new Map<string, EquipmentItem>();
  for (const item of items) byName.set(`${item.packageId ?? ''}|${item.name.toLowerCase()}`, item);
  return [...byName.values()];
}

export function situationFromRow(r: R): SituationChangeReport {
  return {
    entryId: r.entry_id,
    incidentId: r.incident_id,
    text: r.text,
    channel: r.channel,
    deviceSequence: r.device_sequence,
    times: { deviceTime: r.device_time, receivedTime: r.received_time },
    reviewedAt: r.reviewed_at,
    reviewedById: r.reviewed_by_id,
  };
}

export function loadSituationReports(db: Db, incidentId: string): SituationChangeReport[] {
  return all<R>(db, 'SELECT * FROM situation_change_reports WHERE incident_id = $incidentId ORDER BY received_time', {
    incidentId,
  }).map(situationFromRow);
}

export function smsFromRow(r: R): InboundSms {
  return {
    id: r.id,
    rawText: r.raw_text,
    claimedIncidentId: r.claimed_incident_id,
    claimedEntryId: r.claimed_entry_id,
    linkedIncidentId: r.linked_incident_id,
    linkedEntryId: r.linked_entry_id,
    needsManualReview: r.needs_manual_review === 1,
    receivedTime: r.received_time,
    readById: r.read_by_id,
    readAt: r.read_at,
    isSimulated: r.is_simulated === 1,
  };
}

export function loadSms(db: Db, incidentId: string): InboundSms[] {
  return all<R>(db, 'SELECT * FROM sms_inbound WHERE linked_incident_id = $incidentId ORDER BY received_time', {
    incidentId,
  }).map(smsFromRow);
}

export function loadUnassignedSms(db: Db): InboundSms[] {
  return all<R>(db, 'SELECT * FROM sms_inbound WHERE linked_incident_id IS NULL ORDER BY received_time DESC').map(smsFromRow);
}

export function loadHandover(db: Db, incidentId: string): Handover | null {
  const r = get<R>(db, 'SELECT * FROM handovers WHERE incident_id = $incidentId ORDER BY accepted_at DESC LIMIT 1', {
    incidentId,
  });
  return r
    ? { id: r.id, incidentId: r.incident_id, responderId: r.responder_id, acceptedAt: r.accepted_at, approvedSummary: r.approved_summary }
    : null;
}

export function loadStoredGaps(db: Db, incidentId: string): ContactGap[] {
  return all<R>(db, 'SELECT * FROM contact_gaps WHERE incident_id = $incidentId ORDER BY started_at', { incidentId }).map((r) => ({
    from: r.started_at,
    to: r.ended_at,
    ongoing: r.ended_at === null,
  }));
}

export function loadStatusChanges(db: Db, incidentId: string) {
  return all<R>(db, 'SELECT * FROM status_changes WHERE incident_id = $incidentId ORDER BY at', { incidentId }).map((r) => ({
    id: r.id as string,
    from: r.from_status as string,
    to: r.to_status as string,
    byUserId: r.by_user_id as string,
    at: r.at as string,
  }));
}

export function loadAssignedResponders(db: Db, incidentId: string): StaffUser[] {
  return all<R>(
    db,
    `SELECT d.id, d.display_name, d.role FROM incident_responders r JOIN dispatchers d ON d.id = r.responder_id
     WHERE r.incident_id = $incidentId ORDER BY r.assigned_at`,
    { incidentId },
  ).map((r) => ({ id: r.id, displayName: r.display_name, role: r.role }));
}

export function loadLatestAiDraft(db: Db, incidentId: string): AiSummaryDraft | null {
  const r = get<R>(db, 'SELECT * FROM ai_summary_drafts WHERE incident_id = $incidentId ORDER BY generated_at DESC LIMIT 1', {
    incidentId,
  });
  if (!r) return null;
  return {
    id: r.id,
    incidentId: r.incident_id,
    text: r.text,
    sentences: JSON.parse(r.sentences_json) as AiSummarySentence[],
    citedEntryIds: JSON.parse(r.cited_entry_ids) as string[],
    rejectedCount: r.rejected_count,
    generatedAt: r.generated_at,
    approvedBy: r.approved_by_id,
    approvedAt: r.approved_at,
  };
}
