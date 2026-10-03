// Kilka jednoznacznych pytań ze scenariusza + krótka dodatkowa informacja.
// Przy każdym pytaniu dostępne „nie wiem”. Formularz nie zmusza do diagnozy (sekcja 7).
import type { MaybeKnown, ObservationAnswer, ObservationField } from '@do-przyjazdu/shared';
import { useState } from 'react';
import type { LocalEntry } from '../offline/db';
import { EntryStatus } from './entryStatus';

type Value = MaybeKnown<string | number | string[]>;

interface Props {
  fields: ObservationField[];
  onSubmit: (answers: ObservationAnswer[], freeText: string | null) => Promise<LocalEntry>;
  lastSaved: LocalEntry | null;
}

export function ObservationForm({ fields, onSubmit, lastSaved }: Props) {
  const [values, setValues] = useState<Record<string, Value>>({});
  const [freeText, setFreeText] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const set = (key: string, v: Value | null) =>
    setValues((prev) => {
      const next = { ...prev };
      if (v === null) delete next[key];
      else next[key] = v;
      return next;
    });

  const toggleMulti = (field: ObservationField, option: string) => {
    const current = values[field.key];
    const list = current?.known && Array.isArray(current.value) ? current.value : [];
    const next = list.includes(option) ? list.filter((x) => x !== option) : [...list, option];
    set(field.key, next.length ? { known: true, value: next } : null);
  };

  const answers: ObservationAnswer[] = Object.entries(values).map(([fieldKey, value]) => ({ fieldKey, value }));
  const canSubmit = answers.length > 0 || freeText.trim().length > 0;

  const submit = async () => {
    setBusy(true);
    try {
      const entry = await onSubmit(answers, freeText.trim() || null);
      setSavedId(entry.entryId);
      setValues({});
      setFreeText('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="obs-form">
      {savedId && lastSaved?.entryId === savedId && (
        <div className="notice notice-ok">
          Obserwacja zapisana. <EntryStatus entry={lastSaved} />
        </div>
      )}
      <p className="muted">Odpowiadaj tylko na to, co widzisz. Możesz pominąć pytanie albo wybrać „nie wiem”.</p>
      {fields.map((field) => {
        const v = values[field.key];
        const unknown = v && !v.known;
        return (
          <fieldset key={field.key} className="obs-field">
            <legend>{field.label}</legend>
            <div className="options">
              {field.options?.map((o) => {
                const selected = v?.known && (Array.isArray(v.value) ? v.value.includes(o.value) : v.value === o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={Boolean(selected)}
                    className={selected ? 'option selected' : 'option'}
                    onClick={() =>
                      field.kind === 'multi-choice'
                        ? toggleMulti(field, o.value)
                        : set(field.key, selected ? null : { known: true, value: o.value })
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
              {(field.kind === 'short-text' || field.kind === 'number') && (
                <input
                  type={field.kind === 'number' ? 'number' : 'text'}
                  value={v?.known ? String(v.value) : ''}
                  onChange={(e) =>
                    set(field.key, e.target.value === '' ? null : { known: true, value: field.kind === 'number' ? Number(e.target.value) : e.target.value })
                  }
                />
              )}
              <button
                type="button"
                aria-pressed={Boolean(unknown)}
                className={unknown ? 'option option-unknown selected' : 'option option-unknown'}
                onClick={() => set(field.key, unknown ? null : { known: false, reason: 'unknown' })}
              >
                Nie wiem
              </button>
            </div>
          </fieldset>
        );
      })}
      <label className="field-label">
        Coś jeszcze? (krótko, bez nazwisk)
        <textarea value={freeText} maxLength={500} rows={3} onChange={(e) => setFreeText(e.target.value)} />
      </label>
      <button className="btn btn-primary btn-large" disabled={!canSubmit || busy} onClick={submit}>
        Zapisz obserwację
      </button>
    </div>
  );
}
