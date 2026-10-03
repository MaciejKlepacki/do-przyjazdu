// Łatwo dostępne zgłoszenie zmiany sytuacji.
// Po zapisie rozróżnienie: „zapisano na urządzeniu” vs „otrzymano w centrali”.
import { motion } from 'framer-motion';
import { CloudLightning, MessageSquare, ShieldAlert, Snowflake, UserRoundX, Wind } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { DrawCheck, haptic, LiveDot, Sheet, spring } from '../components/ui';
import type { LocalEntry } from '../offline/db';
import { EntryStatus } from './entryStatus';

const QUICK: { text: string; icon: ReactNode }[] = [
  { text: 'Przestał odpowiadać', icon: <UserRoundX size={19} /> },
  { text: 'Trudniej oddycha', icon: <Wind size={19} /> },
  { text: 'Jest bardziej zimno', icon: <Snowflake size={19} /> },
  { text: 'Pogoda się pogarsza', icon: <CloudLightning size={19} /> },
  { text: 'Zagrożenie w miejscu, w którym jesteśmy', icon: <ShieldAlert size={19} /> },
];

interface Props {
  onReport: (text: string) => Promise<LocalEntry>;
  findEntry: (entryId: string) => LocalEntry | undefined;
  onSms: (entry: LocalEntry) => void;
  offline: boolean;
}

export function ReportChangeButton({ onReport, findEntry, onSms, offline }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const saved = savedId ? findEntry(savedId) : undefined;
  const delivered = saved?.status === 'received-by-server';

  const submit = async (value: string) => {
    if (!value.trim()) return;
    haptic([20, 40, 20]);
    const entry = await onReport(value.trim());
    setSavedId(entry.entryId);
    setText('');
  };

  return (
    <>
      <div className="report-fab-wrap">
        <motion.button
          className="report-fab"
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptic(12);
            setOpen(true);
            setSavedId(null);
          }}
        >
          <LiveDot tone="red" /> Zgłoś zmianę sytuacji
        </motion.button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={saved ? 'Zgłoszenie zapisane' : 'Co się zmieniło?'} label="Zgłoś zmianę sytuacji">
        {saved ? (
          <>
            <div className={delivered ? 'saved-state' : 'saved-state is-queued'}>
              <motion.span className="celebrate-circle" initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                <DrawCheck size={38} />
              </motion.span>
              <p className="quote strong">{saved.kind === 'situation-change' ? saved.payload.text : ''}</p>
              <EntryStatus entry={saved} />
            </div>
            {!delivered && (
              <p className="hint" style={{ textAlign: 'center' }}>
                Centrala jeszcze go nie otrzymała. Jeśli możesz dzwonić — powiedz o zmianie prowadzącemu.
              </p>
            )}
            {offline && !delivered && (
              <button className="btn btn-lg btn-tint-blue btn-block" onClick={() => onSms(saved)}>
                <MessageSquare size={18} /> Wyślij to zgłoszenie SMS-em
              </button>
            )}
            <button className="btn btn-lg btn-block" onClick={() => setOpen(false)}>
              Zamknij
            </button>
          </>
        ) : (
          <>
            <div className="quick-grid">
              {QUICK.map((q, i) => (
                <motion.button
                  key={q.text}
                  className="quick-tile"
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.05 + i * 0.04 }}
                  onClick={() => submit(q.text)}
                >
                  <span className="quick-icon">{q.icon}</span>
                  {q.text}
                </motion.button>
              ))}
            </div>
            <label className="field">
              <span>Albo opisz krótko</span>
              <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Co się zmieniło?" />
            </label>
            <button className="btn btn-lg btn-dark btn-block" disabled={!text.trim()} onClick={() => submit(text)}>
              Zapisz zgłoszenie
            </button>
          </>
        )}
      </Sheet>
    </>
  );
}
