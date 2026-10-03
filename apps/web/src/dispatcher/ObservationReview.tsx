// Odpowiedzi świadka z informacją o brakach i źródle informacji.
import type { FieldState, MissingInformationItem, Observation, ObservationField } from '@do-przyjazdu/shared';
import { Info, Plus } from 'lucide-react';
import { useState } from 'react';
import { StalenessLabel } from '../components/StalenessLabel';
import { api, errorMessage } from '../lib/api';
import { answerText } from '../lib/labels';
import { formatTime } from '../lib/time';

interface Props {
  incidentId: string;
  fields: ObservationField[];
  fieldStates: FieldState[];
  missing: MissingInformationItem[];
  observations: Observation[];
  canManage: boolean;
  onChange: () => void;
}

export function FieldStateList({ fields, fieldStates, timeMode = 'age' }: { fields: ObservationField[]; fieldStates: FieldState[]; timeMode?: 'age' | 'both' }) {
  const fieldMap = new Map(fields.map((f) => [f.key, f]));
  return (
    <ul className="kv">
      {fieldStates.map((s) => {
        const field = fieldMap.get(s.fieldKey);
        const showOlder = s.latest && !s.latest.value.known && s.lastKnown;
        return (
          <li key={s.fieldKey} className={!s.latest ? 'is-missing' : !s.latest.value.known ? 'is-unknown' : ''}>
            <span className="kv-label">{s.label}</span>
            <span className="kv-value">{s.latest ? answerText(field, s.latest.value) : 'brak odpowiedzi'}</span>
            {showOlder && (
              <span className="kv-older">
                wcześniej: {answerText(field, s.lastKnown!.value)} ({formatTime(s.lastKnown!.times.receivedTime)})
              </span>
            )}
            {s.latest && (
              <span className="kv-time">
                {timeMode === 'age' ? (
                  <StalenessLabel prefix="odebrano" at={s.latest.times.receivedTime} staleAfterSeconds={300} />
                ) : (
                  <>
                    zapisano {formatTime(s.latest.times.deviceTime)} (telefon) · odebrano {formatTime(s.latest.times.receivedTime)}
                  </>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ObservationReview({ incidentId, fields, fieldStates, missing, observations, canManage, onChange }: Props) {
  const notes = observations.filter((o) => o.freeText).slice(-5).reverse();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <FieldStateList fields={fields} fieldStates={fieldStates} />
      {missing.length > 0 && (
        <div className="callout callout-orange small" style={{ marginTop: '0.8rem' }}>
          <Info size={17} />
          <span>
            <strong>Braki:</strong> {missing.map((m) => `${m.label.replace(/\?$/, '')} (${m.reason === 'unknown' ? 'nie wiem' : 'brak odpowiedzi'})`).join('; ')}
          </span>
        </div>
      )}
      <p className="hint" style={{ marginTop: '0.7rem' }}>
        Brak nowych informacji nie oznacza, że stan się nie zmienił.
      </p>
      {notes.length > 0 && (
        <>
          <h3 className="section-label" style={{ marginTop: '1rem' }}>
            Uwagi
          </h3>
          <ul className="notes-list">
            {notes.map((o) => (
              <li key={o.entryId} className="note">
                <div className="note-meta">
                  {formatTime(o.times.receivedTime)} · {o.source === 'dispatcher-assessment' ? 'ocena prowadzącego' : 'świadek'}
                </div>
                <span className="quote">{o.freeText}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {canManage && (
        <div className="inline-form">
          <input placeholder="Ocena prowadzącego (osobne źródło niż obserwacja świadka)" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          <button
            className="btn btn-tint-blue"
            disabled={!note.trim()}
            onClick={async () => {
              try {
                await api(`/incidents/${incidentId}/observations`, { method: 'POST', body: { text: note } });
                setNote('');
                onChange();
              } catch (err) {
                setError(errorMessage(err));
              }
            }}
          >
            <Plus size={16} /> Dodaj
          </button>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
