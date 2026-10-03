// Kilka jednoznacznych pytań ze scenariusza + krótka dodatkowa informacja.
// Przy każdym pytaniu dostępne „nie wiem”. Formularz nie zmusza do diagnozy (sekcja 7).
import type { MaybeKnown, ObservationAnswer, ObservationField } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, PenLine, Send } from 'lucide-react';
import { useState } from 'react';
import { haptic, softSpring } from '../components/ui';
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

  const set = (key: string, v: Value | null) => {
    haptic(6);
    setValues((prev) => {
      const next = { ...prev };
      if (v === null) delete next[key];
      else next[key] = v;
      return next;
    });
  };

  const toggleMulti = (field: ObservationField, option: string) => {
    const current = values[field.key];
    const list = current?.known && Array.isArray(current.value) ? current.value : [];
    const next = list.includes(option) ? list.filter((x) => x !== option) : [...list, option];
    set(field.key, next.length ? { known: true, value: next } : null);
  };

  const answers: ObservationAnswer[] = Object.entries(values).map(([fieldKey, value]) => ({ fieldKey, value }));
  const canSubmit = answers.length > 0 || freeText.trim().length > 0;
  const pct = fields.length ? (answers.length / fields.length) * 100 : 0;

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
    <div className="obs">
      <header className="obs-intro">
        <h2 className="title-lg">Co widzisz?</h2>
        <p>Odpowiadaj tylko na to, co widzisz. Możesz pominąć pytanie albo wybrać „Nie wiem”.</p>
        <div className="meter" aria-label={`Odpowiedziano ${answers.length} z ${fields.length}`}>
          <span className="meter-track">
            <motion.span className="meter-bar" initial={false} animate={{ width: `${pct}%` }} transition={softSpring} />
          </span>
          {answers.length}/{fields.length}
        </div>
      </header>

      <AnimatePresence>
        {savedId && lastSaved?.entryId === savedId && (
          <motion.div className="callout callout-green" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}>
            <Check size={18} strokeWidth={3} />
            <div className="stack-sm">
              <strong>Obserwacja zapisana</strong>
              <div>
                <EntryStatus entry={lastSaved} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {fields.map((field, n) => {
        const v = values[field.key];
        const unknown = v && !v.known;
        const labelId = `q-${field.key}`;
        return (
          <motion.div
            key={field.key}
            role="group"
            aria-labelledby={labelId}
            className={v ? 'q-card is-answered' : 'q-card'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...softSpring, delay: Math.min(n * 0.04, 0.3) }}
          >
            <div className="q-title" id={labelId}>
              <span className="q-num">{v ? <Check size={14} strokeWidth={3} /> : n + 1}</span>
              {field.label}
            </div>
            <div className="chips">
              {field.options?.map((o) => {
                const selected = Boolean(v?.known && (Array.isArray(v.value) ? v.value.includes(o.value) : v.value === o.value));
                return (
                  <motion.button
                    key={o.value}
                    type="button"
                    layout
                    whileTap={{ scale: 0.94 }}
                    aria-pressed={selected}
                    className={selected ? 'chip-opt is-on' : 'chip-opt'}
                    onClick={() => (field.kind === 'multi-choice' ? toggleMulti(field, o.value) : set(field.key, selected ? null : { known: true, value: o.value }))}
                  >
                    {selected && <Check size={15} strokeWidth={3} />}
                    {o.label}
                  </motion.button>
                );
              })}
              {(field.kind === 'short-text' || field.kind === 'number') && (
                <input
                  type={field.kind === 'number' ? 'number' : 'text'}
                  inputMode={field.kind === 'number' ? 'numeric' : undefined}
                  placeholder={field.unit ? `wpisz (${field.unit})` : 'wpisz'}
                  value={v?.known ? String(v.value) : ''}
                  onChange={(e) =>
                    set(field.key, e.target.value === '' ? null : { known: true, value: field.kind === 'number' ? Number(e.target.value) : e.target.value })
                  }
                />
              )}
              <motion.button
                type="button"
                layout
                whileTap={{ scale: 0.94 }}
                aria-pressed={Boolean(unknown)}
                className={unknown ? 'chip-opt chip-unknown is-on' : 'chip-opt chip-unknown'}
                onClick={() => set(field.key, unknown ? null : { known: false, reason: 'unknown' })}
              >
                Nie wiem
              </motion.button>
            </div>
          </motion.div>
        );
      })}

      <label className={freeText.trim() ? 'q-card is-answered' : 'q-card'}>
        <span className="q-title">
          <span className="q-num">
            <PenLine size={14} />
          </span>
          Coś jeszcze?
        </span>
        <textarea value={freeText} maxLength={500} rows={3} placeholder="Krótko, bez nazwisk" onChange={(e) => setFreeText(e.target.value)} />
      </label>

      <motion.button className="btn btn-xl btn-primary btn-block" whileTap={{ scale: 0.97 }} disabled={!canSubmit || busy} onClick={submit}>
        <Send size={20} /> Zapisz obserwację
      </motion.button>
    </div>
  );
}
