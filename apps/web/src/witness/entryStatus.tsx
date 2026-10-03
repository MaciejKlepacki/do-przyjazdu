import type { SmsFallbackStatus, WitnessSessionResponse } from '@do-przyjazdu/shared';
import { SMS_STATUS_LABEL } from '../lib/labels';
import { formatTime } from '../lib/time';
import type { LocalEntry } from '../offline/db';

/** Rozróżnienie „zapisano na urządzeniu” i „otrzymano w centrali” (sekcja 7). */
export function EntryStatus({ entry }: { entry: LocalEntry }) {
  switch (entry.status) {
    case 'queued':
      return <span className="chip chip-warn">Zapisano na telefonie · czeka na wysłanie</span>;
    case 'sending':
      return <span className="chip chip-warn">Wysyłanie…</span>;
    case 'received-by-server':
      return <span className="chip chip-ok">Otrzymano w centrali {formatTime(entry.receivedTime)}</span>;
    case 'rejected':
      return <span className="chip chip-bad">Nie przyjęto: {entry.error}</span>;
  }
}

/** Status SMS: odbiór i przeczytanie potwierdza wyłącznie serwer. */
export function smsStatusFor(entry: LocalEntry, session: WitnessSessionResponse): SmsFallbackStatus | null {
  const receipt = session.smsReceipts.find((r) => r.entryId === entry.entryId);
  if (receipt) return receipt.readAt ? 'read-by-lead' : 'received-by-center';
  return entry.sms?.status ?? null;
}

export function SmsStatus({ entry, session }: { entry: LocalEntry; session: WitnessSessionResponse }) {
  const status = smsStatusFor(entry, session);
  if (!status) return null;
  const confirmed = status === 'received-by-center' || status === 'read-by-lead';
  return <span className={confirmed ? 'chip chip-ok' : 'chip'}>SMS: {SMS_STATUS_LABEL[status]}</span>;
}
