// Wiek ostatniej otrzymanej aktualizacji i wyznaczanie okresów bez kontaktu.
// Brak nowych informacji nie znaczy, że stan się nie zmienił (sekcja 8).
import type { ContactGap, ContactStatus } from '@do-przyjazdu/shared';
import { get, run, type Db } from '../db/client.js';
import { newId, nowIso } from '../lib/ids.js';
import { loadIncident, loadStoredGaps } from './records.js';

function lastWitnessContact(db: Db, incidentId: string): string | null {
  return get<{ t: string | null }>(db, 'SELECT MAX(last_seen_at) AS t FROM witness_access WHERE incident_id = $incidentId', {
    incidentId,
  })?.t ?? null;
}

/**
 * Zapis kontaktu z telefonem świadka. Jeśli od poprzedniego minęło więcej niż próg,
 * zapisujemy zakończoną przerwę - będzie widoczna w panelu i przy przekazaniu.
 */
export function touchWitness(db: Db, accessId: string, incidentId: string, thresholdSeconds: number): void {
  const now = nowIso();
  const previous = lastWitnessContact(db, incidentId);
  if (previous && Date.parse(now) - Date.parse(previous) > thresholdSeconds * 1000) {
    run(db, 'INSERT INTO contact_gaps (id, incident_id, started_at, ended_at) VALUES ($id, $incidentId, $from, $to)', {
      id: newId('gap'),
      incidentId,
      from: previous,
      to: now,
    });
  }
  run(db, 'UPDATE witness_access SET last_seen_at = $now WHERE id = $id', { now, id: accessId });
}

export function lastReceivedAt(db: Db, incidentId: string): string | null {
  return get<{ t: string | null }>(
    db,
    `SELECT MAX(t) AS t FROM (
       SELECT MAX(received_time) AS t FROM observations WHERE incident_id = $incidentId AND author_kind = 'witness'
       UNION ALL SELECT MAX(received_time) FROM acknowledgements WHERE incident_id = $incidentId
       UNION ALL SELECT MAX(received_time) FROM situation_change_reports WHERE incident_id = $incidentId
       UNION ALL SELECT MAX(received_time) FROM sms_inbound WHERE linked_incident_id = $incidentId
     )`,
    { incidentId },
  )?.t ?? null;
}

export function contactStatus(db: Db, incidentId: string, thresholdSeconds: number): ContactStatus {
  const incident = loadIncident(db, incidentId);
  const lastContact = lastWitnessContact(db, incidentId);
  const silentFor = lastContact ? Date.now() - Date.parse(lastContact) : 0;
  const ongoing = incident.status === 'open' && lastContact !== null && silentFor > thresholdSeconds * 1000;
  const gaps: ContactGap[] = loadStoredGaps(db, incidentId);
  if (ongoing && lastContact) gaps.push({ from: lastContact, to: null, ongoing: true });
  return {
    lastWitnessContactAt: lastContact,
    lastReceivedAt: lastReceivedAt(db, incidentId),
    ongoingGapSince: ongoing ? lastContact : null,
    gapThresholdSeconds: thresholdSeconds,
    gaps,
  };
}
