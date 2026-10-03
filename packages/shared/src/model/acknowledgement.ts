import type { DeliveryChannel, DualTimestamps } from './common.js';

/** Trzy odpowiedzi świadka z sekcji 7. */
export type AcknowledgementResult = 'done' | 'cannot-do' | 'needs-clarification';

/** Obiekt „Potwierdzenie” z sekcji 11. */
export interface Acknowledgement {
  entryId: string;
  incidentId: string;
  instructionId: string;
  /** Wersja instrukcji, do której odnosi się odpowiedź (reguła 4). */
  instructionVersion: number;
  result: AcknowledgementResult;
  comment: string | null;
  channel: DeliveryChannel;
  deviceSequence: number;
  times: DualTimestamps;
}
