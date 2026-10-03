import type { Acknowledgement } from './acknowledgement.js';
import type { EquipmentItem } from './equipment.js';
import type { Instruction } from './instruction.js';
import type { Observation } from './observation.js';
import type { Timestamp } from './common.js';

/** Okres bez kontaktu, pokazywany w widoku przekazania (sekcja 7). */
export interface ContactGap {
  from: Timestamp;
  to: Timestamp | null;
  /** Czy przerwa trwa nadal. */
  ongoing: boolean;
}

/**
 * Widok przekazania budowany z uporządkowanych danych, bez AI.
 * Awaria modelu nie może blokować przekazania (sekcja 7).
 */
export interface HandoverReport {
  incidentId: string;
  generatedAt: Timestamp;
  latestObservations: Observation[];
  approvedInstructions: Instruction[];
  acknowledgements: Acknowledgement[];
  equipment: EquipmentItem[];
  /** Zgłoszone trudności bez rozwiązania. */
  unresolvedDifficulties: Acknowledgement[];
  /** Pola, których nie otrzymano lub oznaczone „nie wiem”. */
  missingInformation: Array<{ fieldKey: string; label: string; reason: 'unknown' | 'not-asked' }>;
  contactGaps: ContactGap[];
  /** Szkic AI jest osobnym obiektem, nie obserwacją (sekcja 9). */
  aiDraft: AiSummaryDraft | null;
}

export interface AiSummaryDraft {
  id: string;
  incidentId: string;
  text: string;
  /** Odnośniki do wpisów osi czasu — warunek kontroli z sekcji 9. */
  citedEntryIds: string[];
  generatedAt: Timestamp;
  approvedBy: string | null;
}

/** Obiekt „Przekazanie” z sekcji 11. */
export interface Handover {
  id: string;
  incidentId: string;
  responderId: string;
  acceptedAt: Timestamp;
  approvedSummary: string | null;
}
