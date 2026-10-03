// Jedna instrukcja na ekranie, duży tekst, numer wersji, opcjonalna ilustracja
// i trzy przyciski: wykonane / nie mogę wykonać / potrzebuję wyjaśnienia.
import { instructionOutcome, type AcknowledgementResult, type Instruction } from '@do-przyjazdu/shared';
import { useMemo, useState } from 'react';
import { ACK_LABEL, OUTCOME_LABEL } from '../lib/labels';
import { formatTime } from '../lib/time';
import type { LocalEntry } from '../offline/db';
import { EntryStatus } from './entryStatus';

interface Props {
  instructions: Instruction[];
  entries: LocalEntry[];
  onAnswer: (instruction: Instruction, result: AcknowledgementResult, comment: string | null) => Promise<void>;
}

export function CurrentActionScreen({ instructions, entries, onAnswer }: Props) {
  const acks = useMemo(
    () =>
      entries.flatMap((e) =>
        e.kind === 'acknowledgement'
          ? [{ entryId: e.entryId, ...e.payload, deviceSequence: e.deviceSequence, times: { deviceTime: e.deviceTime, receivedTime: e.receivedTime } }]
          : [],
      ),
    [entries],
  );
  const outcomes = useMemo(() => instructions.map((i) => instructionOutcome(i, acks)), [instructions, acks]);
  const firstOpen = outcomes.findIndex((o) => o.state !== 'done');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  if (instructions.length === 0) {
    return (
      <div className="empty">
        <h2>Czekaj na polecenia</h2>
        <p>Instrukcje pojawią się tutaj po zatwierdzeniu przez prowadzącego. W tym czasie możesz opisać sytuację w zakładce „Obserwacje”.</p>
      </div>
    );
  }

  const index = Math.max(0, selectedId ? instructions.findIndex((i) => i.id === selectedId) : firstOpen === -1 ? instructions.length - 1 : firstOpen);
  const current = instructions[index]!;
  const outcome = outcomes[index]!;
  const latestEntry = outcome.latest ? entries.find((e) => e.entryId === outcome.latest!.entryId) : undefined;
  const allDone = firstOpen === -1;

  const answer = async (result: AcknowledgementResult) => {
    setBusy(true);
    try {
      await onAnswer(current, result, comment.trim() || null);
      setComment('');
      // Po „wykonane” przechodzimy do kolejnej niewykonanej czynności.
      if (result === 'done') setSelectedId(null);
      else setSelectedId(current.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="action">
      {allDone && !selectedId && <div className="notice notice-ok">Wszystkie czynności oznaczone jako wykonane. Czekaj na kolejne polecenia.</div>}
      <div className="action-meta">
        <span>
          Czynność {index + 1} z {instructions.length}
        </span>
        <span>
          wersja {current.version} · zatwierdzono {formatTime(current.approvedAt)}
        </span>
      </div>
      {current.packageId && <div className="chip chip-info">Pakiet {current.packageId}</div>}
      <p className="action-text">{current.text}</p>
      {current.illustrationUrl && <img className="action-img" src={current.illustrationUrl} alt="" />}

      {outcome.olderVersionAcks.length > 0 && outcome.state === 'awaiting' && (
        <div className="notice notice-warn">Prowadzący zmienił treść tej czynności. Twoja wcześniejsza odpowiedź dotyczyła starszej wersji — odpowiedz ponownie.</div>
      )}
      {outcome.latest && latestEntry && (
        <div className="action-answered">
          Twoja odpowiedź: <strong>{ACK_LABEL[outcome.latest.result]}</strong> <EntryStatus entry={latestEntry} />
        </div>
      )}

      <div className="ack-buttons">
        <button className="btn btn-ok btn-large" disabled={busy} onClick={() => answer('done')}>
          Wykonane
        </button>
        <button className="btn btn-bad btn-large" disabled={busy} onClick={() => answer('cannot-do')}>
          Nie mogę wykonać
        </button>
        <button className="btn btn-warn btn-large" disabled={busy} onClick={() => answer('needs-clarification')}>
          Potrzebuję wyjaśnienia
        </button>
      </div>
      <label className="field-label">
        Krótki komentarz (opcjonalnie)
        <input value={comment} maxLength={300} onChange={(e) => setComment(e.target.value)} placeholder="np. nie mamy karimaty" />
      </label>

      <ol className="action-list">
        {instructions.map((i, n) => (
          <li key={i.id}>
            <button className={n === index ? 'action-list-item active' : 'action-list-item'} onClick={() => setSelectedId(i.id)}>
              <span className={`dot dot-${outcomes[n]!.state}`} aria-hidden />
              <span className="action-list-text">{i.text}</span>
              <span className="muted small">{OUTCOME_LABEL[outcomes[n]!.state]}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
