// Łatwo dostępne zgłoszenie zmiany sytuacji.
// Po zapisie rozróżnienie: „zapisano na urządzeniu” vs „otrzymano w centrali”.
import { useState } from 'react';
import type { LocalEntry } from '../offline/db';
import { EntryStatus } from './entryStatus';

const QUICK = ['Przestał odpowiadać', 'Trudniej oddycha', 'Jest bardziej zimno', 'Pogoda się pogarsza', 'Zagrożenie w miejscu, w którym jesteśmy'];

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

  const submit = async (value: string) => {
    if (!value.trim()) return;
    const entry = await onReport(value.trim());
    setSavedId(entry.entryId);
    setText('');
  };

  return (
    <>
      <div className="report-bar">
        <button className="btn btn-alert btn-large" onClick={() => { setOpen(true); setSavedId(null); }}>
          Zgłoś zmianę sytuacji
        </button>
      </div>
      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Zgłoś zmianę sytuacji">
          <div className="sheet-body">
            <h2>Co się zmieniło?</h2>
            {saved ? (
              <>
                <div className="notice">
                  <p>
                    <strong>Zgłoszenie zapisane.</strong>
                  </p>
                  <EntryStatus entry={saved} />
                  {saved.status !== 'received-by-server' && (
                    <p className="small">Centrala jeszcze go nie otrzymała. Jeśli możesz dzwonić — powiedz o zmianie prowadzącemu.</p>
                  )}
                </div>
                {offline && saved.status !== 'received-by-server' && (
                  <button className="btn btn-secondary" onClick={() => onSms(saved)}>
                    Wyślij to zgłoszenie SMS-em
                  </button>
                )}
                <button className="btn" onClick={() => setOpen(false)}>
                  Zamknij
                </button>
              </>
            ) : (
              <>
                <div className="quick-list">
                  {QUICK.map((q) => (
                    <button key={q} className="btn btn-secondary" onClick={() => submit(q)}>
                      {q}
                    </button>
                  ))}
                </div>
                <label className="field-label">
                  Albo opisz krótko
                  <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
                </label>
                <div className="row">
                  <button className="btn btn-alert" disabled={!text.trim()} onClick={() => submit(text)}>
                    Zapisz zgłoszenie
                  </button>
                  <button className="btn" onClick={() => setOpen(false)}>
                    Anuluj
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
