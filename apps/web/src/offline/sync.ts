// Po odzyskaniu połączenia: najpierw sprawdzenie dostępu i stanu sesji, potem wysłanie wpisów (reguła 7).
// Aktualizacja instrukcji nie nadpisuje lokalnej historii (reguła 6).
import type { SyncResponse, WitnessSessionResponse } from '@do-przyjazdu/shared';
import { api, ApiError, NetworkError } from '../lib/api';
import { entriesFor, getSession, putEntry, putSession, type StoredSession } from './db';
import { isPending, toEnvelope } from './queue';

export type SyncOutcome =
  | { kind: 'ok'; at: string }
  | { kind: 'offline' }
  | { kind: 'denied'; code: string; message: string }
  | { kind: 'error'; message: string };

let running: Promise<SyncOutcome> | null = null;

/** Jedna synchronizacja naraz — kolejne wywołania czekają na trwającą. */
export function syncNow(token: string): Promise<SyncOutcome> {
  running ??= doSync(token).finally(() => {
    running = null;
  });
  return running;
}

async function doSync(token: string): Promise<SyncOutcome> {
  const stored = await getSession(token);

  // 1. Dostęp i stan sesji.
  let session: WitnessSessionResponse;
  try {
    session = await api<WitnessSessionResponse>('/witness/session', { witnessToken: token });
  } catch (err) {
    if (err instanceof NetworkError) return { kind: 'offline' };
    if (err instanceof ApiError && err.status === 401 && stored) {
      await putSession({ ...stored, accessDenied: { code: err.code, message: err.message, at: new Date().toISOString() } });
      return { kind: 'denied', code: err.code, message: err.message };
    }
    return err instanceof ApiError && err.status === 401
      ? { kind: 'denied', code: err.code, message: err.message }
      : { kind: 'error', message: (err as Error).message };
  }
  const now = new Date().toISOString();
  const base: StoredSession = stored ?? { token, session, fetchedAt: now, joinedAt: null, lastSyncAt: null, accessDenied: null };
  await putSession({ ...base, session, fetchedAt: now, accessDenied: null });

  // 2. Wpisy z kolejki, w kolejności z urządzenia.
  const pending = (await entriesFor(token)).filter(isPending);
  if (pending.length > 0 && base.joinedAt) {
    for (const e of pending) await putEntry({ ...e, status: 'sending' });
    try {
      const res = await api<SyncResponse>('/witness/sync', { method: 'POST', witnessToken: token, body: { entries: pending.map(toEnvelope) } });
      for (const e of pending) {
        const item = res.items.find((i) => i.entryId === e.entryId);
        if (!item) await putEntry({ ...e, status: 'queued' });
        else if (item.accepted) await putEntry({ ...e, status: 'received-by-server', receivedTime: item.receivedTime, error: null });
        else await putEntry({ ...e, status: 'rejected', error: item.error });
      }
    } catch (err) {
      // Nie wiemy, czy serwer przyjął — wpis wraca do kolejki; ponowienie jest bezpieczne (reguła 2).
      for (const e of pending) await putEntry({ ...e, status: 'queued' });
      if (err instanceof NetworkError) return { kind: 'offline' };
      return { kind: 'error', message: (err as Error).message };
    }
  }
  const at = new Date().toISOString();
  const latest = await getSession(token);
  if (latest) await putSession({ ...latest, lastSyncAt: at });
  return { kind: 'ok', at };
}
