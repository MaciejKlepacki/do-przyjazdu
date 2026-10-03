import type { ObservationField, WitnessSessionResponse } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, Eye, Inbox, MessageSquare, Siren, Trash } from 'lucide-react';
import { useState } from 'react';
import { CardHead, EmptyState, plural, softSpring } from '../components/ui';
import { ACK_LABEL, answerText } from '../lib/labels';
import { formatTime } from '../lib/time';
import type { LocalEntry } from '../offline/db';
import { isPending } from '../offline/queue';
import { EntryStatus, SmsStatus } from './entryStatus';

const KIND = {
  observation: { label: 'Obserwacja', icon: <Eye size={16} /> },
  acknowledgement: { label: 'Odpowiedź na czynność', icon: <CircleCheck size={16} /> },
  'situation-change': { label: 'Zgłoszenie zmiany', icon: <Siren size={16} /> },
} as const;

function describe(entry: LocalEntry, session: WitnessSessionResponse, fields: Map<string, ObservationField>): string {
  if (entry.kind === 'situation-change') return entry.payload.text;
  if (entry.kind === 'acknowledgement') {
    const ins = session.instructions.find((i) => i.id === entry.payload.instructionId);
    const label = ins ? ins.text.slice(0, 70) + (ins.text.length > 70 ? '…' : '') : 'czynność';
    return `${ACK_LABEL[entry.payload.result]} - „${label}” (v${entry.payload.instructionVersion})${entry.payload.comment ? ` · ${entry.payload.comment}` : ''}`;
  }
  const parts = entry.payload.answers.map((a) => `${fields.get(a.fieldKey)?.label ?? a.fieldKey} ${answerText(fields.get(a.fieldKey), a.value)}`);
  if (entry.payload.freeText) parts.push(`„${entry.payload.freeText}”`);
  return parts.join(' · ');
}

interface Props {
  entries: LocalEntry[];
  session: WitnessSessionResponse;
  onSms: (entry: LocalEntry) => void;
  onClear: () => Promise<void>;
}

export function EntryHistory({ entries, session, onSms, onClear }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clear = async () => {
    if (clearing) return;
    setClearing(true);
    setError(null);
    try { await onClear(); }
    catch { setError('Nie udało się wyczyścić pamięci telefonu. Spróbuj ponownie.'); }
    finally { setClearing(false); }
  };
  const fields = new Map(session.fields.map((f) => [f.key, f]));
  const pending = entries.filter(isPending).length;
  const delivered = entries.filter((e) => e.status === 'received-by-server').length;
  return (
    <div className="history">
      <h2 className="title-lg">Moje wpisy</h2>
      <div className="stat-pair">
        <div className="mini-stat is-green">
          <b>{delivered}</b>
          <span>Otrzymane w centrali</span>
        </div>
        <div className={pending ? 'mini-stat is-orange' : 'mini-stat'}>
          <b>{pending}</b>
          <span>Czekają na wysłanie</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={<Inbox size={26} />} title="Brak wpisów">
          Twoje odpowiedzi i obserwacje pojawią się tutaj razem ze stanem wysyłki.
        </EmptyState>
      ) : (
        <ol className="feed">
          <AnimatePresence initial={false}>
            {[...entries].reverse().map((e) => (
              <motion.li key={e.entryId} layout className="feed-item" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
                <span className={`feed-node is-${e.kind}`}>{KIND[e.kind].icon}</span>
                <div className="feed-card">
                  <div className="feed-meta">
                    <strong>{KIND[e.kind].label}</strong>· zapisano {formatTime(e.deviceTime)} (czas telefonu)
                  </div>
                  <p>{describe(e, session, fields)}</p>
                  <div className="feed-status">
                    <EntryStatus entry={e} />
                    <SmsStatus entry={e} session={session} />
                    {isPending(e) && (
                      <button className="btn btn-sm btn-tint-blue" onClick={() => onSms(e)}>
                        <MessageSquare size={14} /> Wyślij SMS-em
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}

      <section className="card danger-card">
        <CardHead icon={<Trash size={17} />} tone="red" title="Koniec zdarzenia" sub="Usuwa sesję i wpisy z tego telefonu. Dane wysłane do centrali zostają u prowadzącego." />
        {pending > 0 && (
          <p className="small text-orange strong" style={{ marginBottom: '0.7rem' }}>
            Uwaga: {pending} {plural(pending, 'wpis nie dotarł', 'wpisy nie dotarły', 'wpisów nie dotarło')} jeszcze do centrali.
          </p>
        )}
        {confirming ? (
          <div className="row">
            <button className="btn btn-danger" disabled={clearing} onClick={() => void clear()}>
              {clearing ? 'Czyszczenie…' : 'Tak, wyczyść dane'}
            </button>
            <button className="btn" disabled={clearing} onClick={() => setConfirming(false)}>
              Anuluj
            </button>
          </div>
        ) : (
          <button className="btn btn-outline-red" onClick={() => setConfirming(true)}>
            Wyczyść dane z telefonu
          </button>
        )}
        {error && <p className="error-text" role="alert">{error}</p>}
      </section>
    </div>
  );
}
