// IndexedDB: pobrana sesja, zatwierdzone instrukcje, lokalne obserwacje, kolejka wpisów (sekcja 10).
// Zapisujemy też czas pobrania instrukcji, żeby pokazać, jak stara jest treść.
import type {
  AcknowledgementPayload,
  ObservationPayload,
  SituationChangePayload,
  SmsFallbackStatus,
  WitnessSessionResponse,
} from '@do-przyjazdu/shared';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { uuid } from '../lib/uuid';

/** Stan wysyłki przez internet. SMS ma osobny stan — nie zastępuje wpisu (reguła 8). */
export type LocalEntryStatus = 'queued' | 'sending' | 'received-by-server' | 'rejected';

interface LocalEntryBase {
  entryId: string;
  token: string;
  deviceId: string;
  deviceSequence: number;
  deviceTime: string;
  status: LocalEntryStatus;
  receivedTime: string | null;
  error: string | null;
  sms: { status: SmsFallbackStatus; text: string; updatedAt: string } | null;
}

export type LocalEntry =
  | (LocalEntryBase & { kind: 'observation'; payload: ObservationPayload })
  | (LocalEntryBase & { kind: 'acknowledgement'; payload: AcknowledgementPayload })
  | (LocalEntryBase & { kind: 'situation-change'; payload: SituationChangePayload });

export interface StoredSession {
  token: string;
  session: WitnessSessionResponse;
  /** Kiedy ostatnio pobrano stan sesji i instrukcje. */
  fetchedAt: string;
  joinedAt: string | null;
  lastSyncAt: string | null;
  /** Ustawione, gdy serwer odmówił dostępu (link unieważniony lub wygasł). */
  accessDenied: { code: string; message: string; at: string } | null;
}

interface Schema extends DBSchema {
  meta: { key: string; value: { key: string; value: string | number } };
  sessions: { key: string; value: StoredSession };
  entries: { key: string; value: LocalEntry; indexes: { byToken: string } };
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

export function localDb(): Promise<IDBPDatabase<Schema>> {
  dbPromise ??= openDB<Schema>('do-przyjazdu', 1, {
    upgrade(db) {
      db.createObjectStore('meta', { keyPath: 'key' });
      db.createObjectStore('sessions', { keyPath: 'token' });
      db.createObjectStore('entries', { keyPath: 'entryId' }).createIndex('byToken', 'token');
    },
  });
  return dbPromise;
}

/** Stały identyfikator tego urządzenia i licznik kolejności wpisów (reguła 1). */
export async function deviceId(): Promise<string> {
  const db = await localDb();
  const existing = await db.get('meta', 'deviceId');
  if (existing) return String(existing.value);
  const id = `dev-${uuid()}`;
  await db.put('meta', { key: 'deviceId', value: id });
  return id;
}

export async function nextSequence(): Promise<number> {
  const db = await localDb();
  const tx = db.transaction('meta', 'readwrite');
  const current = Number((await tx.store.get('sequence'))?.value ?? 0);
  await tx.store.put({ key: 'sequence', value: current + 1 });
  await tx.done;
  return current + 1;
}

export async function getSession(token: string): Promise<StoredSession | undefined> {
  return (await localDb()).get('sessions', token);
}

export async function putSession(s: StoredSession): Promise<void> {
  await (await localDb()).put('sessions', s);
}

export async function entriesFor(token: string): Promise<LocalEntry[]> {
  const list = await (await localDb()).getAllFromIndex('entries', 'byToken', token);
  return list.sort((a, b) => a.deviceSequence - b.deviceSequence);
}

export async function putEntry(e: LocalEntry): Promise<void> {
  await (await localDb()).put('entries', e);
}

/** Zakończenie demo: usunięcie lokalnej sesji i wpisów z telefonu (sekcja 10). */
export async function clearLocalSession(token: string): Promise<void> {
  const db = await localDb();
  const tx = db.transaction(['sessions', 'entries'], 'readwrite');
  await tx.objectStore('sessions').delete(token);
  for (const key of await tx.objectStore('entries').index('byToken').getAllKeys(token)) {
    await tx.objectStore('entries').delete(key);
  }
  await tx.done;
}
