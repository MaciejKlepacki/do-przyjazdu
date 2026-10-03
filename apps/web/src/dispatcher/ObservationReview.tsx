// Odpowiedzi świadka z informacją o brakach i źródle informacji.
import type { FieldState, MissingInformationItem, Observation, ObservationField } from '@do-przyjazdu/shared';
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

export function ObservationReview({ incidentId, fields, fieldStates, missing, observations, canManage, onChange }: Props) {
  const fieldMap = new Map(fields.map((f) => [f.key, f]));
  const notes = observations.filter((o) => o.freeText).slice(-5).reverse();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <table className="field-table">
        <thead>
          <tr>
            <th>Pytanie</th>
            <th>Ostatnia odpowiedź</th>
            <th>Odebrano</th>
          </tr>
        </thead>
        <tbody>
          {fieldStates.map((s) => {
            const field = fieldMap.get(s.fieldKey);
            const showOlder = s.latest && !s.latest.value.known && s.lastKnown;
            return (
              <tr key={s.fieldKey} className={!s.latest ? 'row-missing' : !s.latest.value.known ? 'row-unknown' : ''}>
                <td>{s.label}</td>
                <td>
                  {s.latest ? <strong>{answerText(field, s.latest.value)}</strong> : <span className="muted">brak odpowiedzi</span>}
                  {showOlder && (
                    <div className="small muted">
                      wcześniej: {answerText(field, s.lastKnown!.value)} ({formatTime(s.lastKnown!.times.receivedTime)})
                    </div>
                  )}
                </td>
                <td className="small">{s.latest ? <StalenessLabel prefix="" at={s.latest.times.receivedTime} staleAfterSeconds={300} /> : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {missing.length > 0 && (
        <p className="small">
          <strong>Braki:</strong> {missing.map((m) => `${m.label.replace(/\?$/, '')} (${m.reason === 'unknown' ? 'nie wiem' : 'brak odpowiedzi'})`).join('; ')}
        </p>
      )}
      <p className="small muted">Brak nowych informacji nie oznacza, że stan się nie zmienił.</p>
      {notes.length > 0 && (
        <>
          <h3>Uwagi</h3>
          <ul className="notes">
            {notes.map((o) => (
              <li key={o.entryId}>
                <span className="muted small">{formatTime(o.times.receivedTime)} · {o.source === 'dispatcher-assessment' ? 'ocena prowadzącego' : 'świadek'}</span>{' '}
                „{o.freeText}”
              </li>
            ))}
          </ul>
        </>
      )}
      {canManage && (
        <div className="row">
          <input
            className="grow"
            placeholder="Ocena prowadzącego (osobne źródło niż obserwacja świadka)"
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="btn btn-small"
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
            Dodaj
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
