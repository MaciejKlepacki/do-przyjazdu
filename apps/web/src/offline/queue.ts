// Kolejka wpisów: unikalny entryId i numer kolejności na urządzeniu (reguła 1).
// Stany: queued, sending, received-by-server, rejected; SMS osobno.
import type { SmsFallbackStatus, WitnessEnvelope } from '@do-przyjazdu/shared';
import { uuid } from '../lib/uuid';
import { deviceId, nextSequence, putEntry, type LocalEntry } from './db';

type NewEntry = Pick<LocalEntry, 'kind' | 'payload'> & Pick<WitnessEnvelope, 'kind' | 'payload'>;

/** Zapis na urządzeniu - zawsze najpierw lokalnie, wysyłka osobno. */
export async function enqueue(token: string, entry: NewEntry): Promise<LocalEntry> {
  const local = {
    ...entry,
    entryId: uuid(),
    token,
    deviceId: await deviceId(),
    deviceSequence: await nextSequence(),
    deviceTime: new Date().toISOString(),
    status: 'queued',
    receivedTime: null,
    error: null,
    sms: null,
  } as LocalEntry;
  await putEntry(local);
  return local;
}

export function toEnvelope(e: LocalEntry): WitnessEnvelope {
  return {
    entryId: e.entryId,
    deviceId: e.deviceId,
    deviceSequence: e.deviceSequence,
    deviceTime: e.deviceTime,
    kind: e.kind,
    payload: e.payload,
  } as WitnessEnvelope;
}

export async function setSmsStatus(e: LocalEntry, status: SmsFallbackStatus, text: string): Promise<LocalEntry> {
  const updated = { ...e, sms: { status, text, updatedAt: new Date().toISOString() } } as LocalEntry;
  await putEntry(updated);
  return updated;
}

export const isPending = (e: LocalEntry) => e.status === 'queued' || e.status === 'sending';
