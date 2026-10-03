import type { DeliveryChannel, DualTimestamps, Timestamp } from './common.js';

/** Zgłoszenie zmiany sytuacji. Obsługę potwierdza ręcznie prowadzący (sekcja 7). */
export interface SituationChangeReport {
  entryId: string;
  incidentId: string;
  text: string;
  channel: DeliveryChannel;
  deviceSequence: number;
  times: DualTimestamps;
  reviewedAt: Timestamp | null;
  reviewedById: string | null;
}
