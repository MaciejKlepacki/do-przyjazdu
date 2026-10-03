// Lokalna historia wpisów z ich stanem wysyłki. Wpisy nie znikają po synchronizacji.
import type { ObservationField, WitnessSessionResponse } from '@do-przyjazdu/shared';
import { useState } from 'react';
import { ACK_LABEL, answerText } from '../lib/labels';
import { formatTime } from '../lib/time';
import type { LocalEntry } from '../offline/db';
import { isPending } from '../offline/queue';
import { EntryStatus, SmsStatus } from './entryStatus';

function describe(entry: LocalEntry, session: WitnessSessionResponse, fields: Map<string, ObservationField>): string {
  if (entry.kind === 'situation-change') return `Zgłoszenie zmiany: ${entry.payload.text}`;
  if (entry.kind === 'acknowledgement') {
    const ins = session.instructions.find((i) => i.id === entry.payload.instructionId);
    const label = ins ? ins.text.slice(0, 60) + (ins.text.length > 60 ? '…' : '') : 'czynność';
    return `${ACK_LABEL[entry.payload.result]} — „${label}” (v${entry.payload.instructionVersion})${entry.payload.comment ? ` · ${entry.payload.comment}` : ''}`;
  }
  const parts = entry.payload.answers.map((a) => `${fields.get(a.fieldKey)?.label ?? a.fieldKey} ${answerText(fields.get(a.fieldKey), a.value)}`);
  if (entry.payload.freeText) parts.push(`„${entry.payload.freeText}”`);
  return `Obserwacja: ${parts.join(' · ')}`;
}

interface Props {
  entries: LocalEntry[];
  session: WitnessSessionResponse;
  onSms: (entry: LocalEntry) => void;
  onClear: () => Promise<void>;
}

export function EntryHistory({ entries, session, onSms, onClear }: Props) {
  const [confirming, setConfirming] = useState(false);
  const fields = new Map(session.fields.map((f) => [f.key, f]));
  const pending = entries.filter(isPending).length;
  return (
    <div className="history">
      {entries.length === 0 && <p className="muted">Nie masz jeszcze żadnych wpisów.</p>}
      <ul className="entry-list">
        {[...entries].reverse().map((e) => (
          <li key={e.entryId} className="entry">
            <div className="entry-head">
              <span className="muted small">zapisano {formatTime(e.deviceTime)} (czas telefonu)</span>
            </div>
            <p>{describe(e, session, fields)}</p>
            <div className="row wrap">
              <EntryStatus entry={e} />
              <SmsStatus entry={e} session={session} />
              {isPending(e) && (
                <button className="btn btn-small" onClick={() => onSms(e)}>
                  Wyślij SMS-em
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="danger-zone">
        <h3>Koniec zdarzenia</h3>
        <p className="small">Usuwa sesję i wpisy z tego telefonu. Dane wysłane do centrali zostają u prowadzącego.</p>
        {pending > 0 && <p className="small warn">Uwaga: {pending} wpisów nie dotarło jeszcze do centrali.</p>}
        {confirming ? (
          <div className="row">
            <button className="btn btn-bad" onClick={() => void onClear()}>
              Tak, wyczyść dane
            </button>
            <button className="btn" onClick={() => setConfirming(false)}>
              Anuluj
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => setConfirming(true)}>
            Wyczyść dane z telefonu
          </button>
        )}
      </div>
    </div>
  );
}
