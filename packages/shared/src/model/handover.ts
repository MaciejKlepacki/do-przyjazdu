import type { Acknowledgement } from './acknowledgement.js';
import type { EquipmentItem } from './equipment.js';
import type { Incident } from './incident.js';
import type { Instruction } from './instruction.js';
import type { Observation, ObservationAnswer, ObservationField } from './observation.js';
import type { SituationChangeReport } from './situationChange.js';
import type { TimelineEvent } from './timeline.js';
import type { DualTimestamps, Timestamp } from './common.js';
import type { InstructionOutcome } from '../sync/instructionOutcome.js';

/** Okres bez kontaktu, pokazywany w widoku przekazania (sekcja 7). */
export interface ContactGap {
  from: Timestamp;
  to: Timestamp | null;
  /** Czy przerwa trwa nadal. */
  ongoing: boolean;
}

/** Stan jednego pola formularza: ostatnia odpowiedź i ostatnia znana wartość, każda z czasem. */
export interface FieldState {
  fieldKey: string;
  label: string;
  latest: { value: ObservationAnswer['value']; entryId: string; times: DualTimestamps } | null;
  /** Ostatnia odpowiedź inna niż „nie wiem”. Może być starsza niż `latest`. */
  lastKnown: { value: ObservationAnswer['value']; entryId: string; times: DualTimestamps } | null;
}

export interface MissingInformationItem {
  fieldKey: string;
  label: string;
  /** `unknown` — świadek odpowiedział „nie wiem”; `not-asked` — odpowiedzi nie otrzymano. */
  reason: 'unknown' | 'not-asked';
}

/**
 * Widok przekazania budowany z uporządkowanych danych, bez AI.
 * Awaria modelu nie może blokować przekazania (sekcja 7).
 */
export interface HandoverReport {
  incidentId: string;
  incident: Incident;
  generatedAt: Timestamp;
  /** Czas ostatniego wpisu otrzymanego od świadka (czas serwera). */
  lastReceivedAt: Timestamp | null;
  fields: ObservationField[];
  fieldStates: FieldState[];
  latestObservations: Observation[];
  approvedInstructions: Instruction[];
  instructionOutcomes: InstructionOutcome[];
  acknowledgements: Acknowledgement[];
  equipment: EquipmentItem[];
  /** Zgłoszone trudności bez rozwiązania. */
  unresolvedDifficulties: Acknowledgement[];
  /** Zgłoszenia zmiany sytuacji, których obsługi prowadzący jeszcze nie potwierdził. */
  openSituationReports: SituationChangeReport[];
  /** Pola, których nie otrzymano lub oznaczone „nie wiem”. */
  missingInformation: MissingInformationItem[];
  contactGaps: ContactGap[];
  timeline: TimelineEvent[];
  handover: Handover | null;
  /** Szkic AI jest osobnym obiektem, nie obserwacją (sekcja 9). */
  aiDraft: AiSummaryDraft | null;
  aiAvailable: boolean;
}

export interface AiSummarySentence {
  text: string;
  /** Odnośniki do wpisów osi czasu — warunek kontroli z sekcji 9. */
  entryIds: string[];
}

export interface AiSummaryDraft {
  id: string;
  incidentId: string;
  text: string;
  sentences: AiSummarySentence[];
  /** Odnośniki do wpisów osi czasu — warunek kontroli z sekcji 9. */
  citedEntryIds: string[];
  /** Zdania odrzucone przez kontrolę (brak odnośnika, treść diagnostyczna). */
  rejectedCount: number;
  generatedAt: Timestamp;
  approvedBy: string | null;
  approvedAt: Timestamp | null;
}

/** Obiekt „Przekazanie” z sekcji 11. */
export interface Handover {
  id: string;
  incidentId: string;
  responderId: string;
  acceptedAt: Timestamp;
  approvedSummary: string | null;
}
