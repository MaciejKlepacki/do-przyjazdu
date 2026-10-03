import type { Timestamp } from './common.js';

/**
 * Obiekt „Dostęp świadka”. Token ma dostęp tylko do jednej sesji.
 * W bazie trzymany jest wyłącznie skrót tokenu (sekcja 11 "Dostęp i dane").
 */
export interface WitnessAccess {
  id: string;
  incidentId: string;
  tokenHash: string;
  expiresAt: Timestamp;
  revokedAt: Timestamp | null;
  createdAt: Timestamp;
  lastSeenAt: Timestamp | null;
}
