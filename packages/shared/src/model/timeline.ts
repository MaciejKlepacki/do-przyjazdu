import type { Acknowledgement } from './acknowledgement.js';
import type { EquipmentItem } from './equipment.js';
import type { Instruction } from './instruction.js';
import type { Observation } from './observation.js';
import type { Timestamp } from './common.js';

/**
 * Oś czasu z sekcji 6.7. Wpisu nie usuwa się — poprawka ma własny czas i autora (sekcja 8).
 * SMS przyjęty przez odbiornik jest osobnym zdarzeniem osi czasu (reguła 8).
 */
export type TimelineEvent =
  | { type: 'observation'; at: Timestamp; data: Observation }
  | { type: 'instruction-approved'; at: Timestamp; data: Instruction }
  | { type: 'instruction-withdrawn'; at: Timestamp; data: Instruction }
  | { type: 'acknowledgement'; at: Timestamp; data: Acknowledgement }
  | { type: 'equipment'; at: Timestamp; data: EquipmentItem }
  | { type: 'status-change'; at: Timestamp; data: { from: string; to: string; byUserId: string } }
  | { type: 'situation-change-report'; at: Timestamp; data: { entryId: string; text: string; reviewedAt: Timestamp | null } }
  | { type: 'sms-received'; at: Timestamp; data: { smsId: string; rawText: string; linkedEntryId: string | null } }
  | { type: 'contact-gap'; at: Timestamp; data: { endedAt: Timestamp | null } }
  | { type: 'handover'; at: Timestamp; data: { responderId: string } };
