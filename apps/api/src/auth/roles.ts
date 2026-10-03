// Role i granice dostępu z sekcji 5.
// Świadek: tylko własna sesja. Dyspozytor: prowadzone zdarzenia. Ratownik: przydzielone zdarzenie.
import type { StaffRole } from '@do-przyjazdu/shared';
import { get, type Db } from '../db/client.js';

export type RequestActor =
  | { kind: 'witness'; incidentId: string; accessId: string }
  | { kind: 'staff'; userId: string; role: StaffRole; displayName: string };

export type Action =
  /** Odczyt panelu, osi czasu i raportu przekazania. */
  | 'incident:read'
  /** Instrukcje, linki, wyposażenie, przegląd zgłoszeń, zmiana statusu. */
  | 'incident:manage'
  /** Potwierdzenie przejęcia zdarzenia. */
  | 'handover:accept'
  /** Wpisy świadka: obserwacje, potwierdzenia, zgłoszenia. */
  | 'witness:write';

export function can(db: Db, actor: RequestActor, action: Action, incidentId: string): boolean {
  if (actor.kind === 'witness') {
    return action === 'witness:write' && actor.incidentId === incidentId;
  }
  const incident = get<{ lead_dispatcher_id: string }>(db, 'SELECT lead_dispatcher_id FROM incidents WHERE id = $id', {
    id: incidentId,
  });
  if (!incident) return false;
  if (actor.role === 'dispatcher') {
    return incident.lead_dispatcher_id === actor.userId && action !== 'witness:write' && action !== 'handover:accept';
  }
  const assigned = get(db, 'SELECT 1 AS ok FROM incident_responders WHERE incident_id = $incidentId AND responder_id = $userId', {
    incidentId,
    userId: actor.userId,
  });
  return Boolean(assigned) && (action === 'incident:read' || action === 'handover:accept');
}
