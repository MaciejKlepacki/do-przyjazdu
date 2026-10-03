import type { Timestamp } from '../model/common.js';

/**
 * Koperta każdego wpisu wysyłanego z telefonu.
 * Serwer przyjmuje ponowiony wpis tylko raz - po `entryId` (reguły 1 i 2).
 */
export interface SyncEnvelope<TPayload> {
  entryId: string;
  deviceId: string;
  deviceSequence: number;
  deviceTime: Timestamp;
  kind: 'observation' | 'acknowledgement' | 'situation-change';
  payload: TPayload;
}

/** Stan jednego wpisu w kolejce na urządzeniu. */
export type QueuedEntryStatus =
  | 'queued'
  | 'sending'
  | 'received-by-server'
  | 'rejected'
  | 'prepared-for-sms'
  | 'sms-app-opened';

export interface SyncResultItem {
  entryId: string;
  accepted: boolean;
  /** Powtórka wpisu, który serwer już ma. Nie jest błędem. */
  duplicate: boolean;
  receivedTime: Timestamp | null;
  error: string | null;
}

export interface SyncResponse {
  items: SyncResultItem[];
  serverTime: Timestamp;
}

/** Stan łączności pokazywany na stałym pasku (sekcja 7). */
export interface ConnectivityState {
  online: boolean;
  pendingEntries: number;
  lastSyncAt: Timestamp | null;
  /** Kiedy pobrano aktualnie wyświetlane instrukcje. */
  instructionsFetchedAt: Timestamp | null;
}

/** Treść wpisów wysyłanych przez świadka, zależnie od `kind`. */
export interface ObservationPayload {
  answers: import('../model/observation.js').ObservationAnswer[];
  freeText: string | null;
}

export interface AcknowledgementPayload {
  instructionId: string;
  /** Wersja widziana przez świadka w chwili odpowiedzi (reguła 4). */
  instructionVersion: number;
  result: import('../model/acknowledgement.js').AcknowledgementResult;
  comment: string | null;
}

export interface SituationChangePayload {
  text: string;
}

export type WitnessEnvelope =
  | (SyncEnvelope<ObservationPayload> & { kind: 'observation' })
  | (SyncEnvelope<AcknowledgementPayload> & { kind: 'acknowledgement' })
  | (SyncEnvelope<SituationChangePayload> & { kind: 'situation-change' });
