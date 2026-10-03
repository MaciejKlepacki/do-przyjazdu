import type { Timestamp } from './common.js';

export type IncidentStatus = 'open' | 'handed-over' | 'closed';

/** Obiekt „Zdarzenie” z sekcji 11. W MVP: jeden dyspozytor, jedno zdarzenie, jeden świadek. */
export interface Incident {
  id: string;
  /** Krótki opis sytuacji. Bez danych osobowych w demo. */
  description: string;
  status: IncidentStatus;
  /** Prowadzący kontakt. */
  leadDispatcherId: string;
  createdAt: Timestamp;
  closedAt: Timestamp | null;
  /** Czy zdarzenie jest symulacją. W demo zawsze true i widoczne w UI. */
  isDemo: boolean;
}
