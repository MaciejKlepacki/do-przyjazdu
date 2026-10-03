import type { Acknowledgement } from './acknowledgement.js';
import type { EquipmentItem } from './equipment.js';
import type { ContactGap, Handover } from './handover.js';
import type { Instruction } from './instruction.js';
import type { Observation } from './observation.js';
import type { SituationChangeReport } from './situationChange.js';
import type { InboundSms } from './sms.js';
import type { Timestamp } from './common.js';

/**
 * Oś czasu z sekcji 6.7. Wpisu nie usuwa się - poprawka ma własny czas i autora (sekcja 8).
 * SMS przyjęty przez odbiornik jest osobnym zdarzeniem osi czasu (reguła 8).
 * `at` to czas po stronie serwera; czas urządzenia jest w danych wpisu.
 * `id` służy jako odnośnik w szkicu AI (sekcja 9).
 */
export type TimelineEvent =
  | { id: string; type: 'observation'; at: Timestamp; data: Observation }
  | { id: string; type: 'instruction-approved'; at: Timestamp; data: Instruction }
  | { id: string; type: 'instruction-withdrawn'; at: Timestamp; data: Instruction }
  | { id: string; type: 'acknowledgement'; at: Timestamp; data: Acknowledgement }
  | { id: string; type: 'equipment'; at: Timestamp; data: EquipmentItem }
  | { id: string; type: 'status-change'; at: Timestamp; data: { from: string; to: string; byUserId: string } }
  | { id: string; type: 'situation-change-report'; at: Timestamp; data: SituationChangeReport }
  | { id: string; type: 'sms-received'; at: Timestamp; data: InboundSms }
  | { id: string; type: 'contact-gap'; at: Timestamp; data: ContactGap }
  | { id: string; type: 'handover'; at: Timestamp; data: Handover };

export type TimelineEventType = TimelineEvent['type'];
