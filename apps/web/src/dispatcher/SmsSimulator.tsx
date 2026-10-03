// Demo: symulacja odbiornika SMS. Wpis jest oznaczony jako symulowany (sekcja 10).
import { ChevronRight, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage } from '../lib/api';

export function SmsSimulator({ onSent, hint }: { onSent: () => void; hint?: string }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <details className="disclosure">
      <summary>
        <FlaskConical size={16} /> Symuluj odbiór SMS (demo)
        <ChevronRight size={16} className="chev" />
      </summary>
      <div className="disclosure-body">
        <p className="hint">Wklej treść SMS-a z telefonu świadka. {hint}</p>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="DP ZD-XXXX #identyfikator-wpisu treść" style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }} />
        <div>
          <button
            className="btn btn-sm btn-dark"
            disabled={!text.trim()}
            onClick={async () => {
              try {
                const sms = await api<{ needsManualReview: boolean }>('/sms/simulate', { method: 'POST', body: { text } });
                setMsg(sms.needsManualReview ? 'Odebrano - nie rozpoznano zdarzenia, trafia do ręcznej weryfikacji.' : 'Odebrano i przypisano do zdarzenia.');
                setText('');
                onSent();
              } catch (err) {
                setMsg(errorMessage(err));
              }
            }}
          >
            Odbierz (symulacja)
          </button>
        </div>
        {msg && <p className="hint">{msg}</p>}
      </div>
    </details>
  );
}
