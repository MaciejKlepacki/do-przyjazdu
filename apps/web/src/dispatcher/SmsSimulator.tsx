// Demo: symulacja odbiornika SMS. Wpis jest oznaczony jako symulowany (sekcja 10).
import { useState } from 'react';
import { api, errorMessage } from '../lib/api';

export function SmsSimulator({ onSent, hint }: { onSent: () => void; hint?: string }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <details className="sms-sim">
      <summary>Symuluj odbiór SMS (demo)</summary>
      <p className="small muted">Wklej treść SMS-a z telefonu świadka. {hint}</p>
      <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="DP ZD-XXXX #identyfikator-wpisu treść" />
      <button
        className="btn btn-small"
        disabled={!text.trim()}
        onClick={async () => {
          try {
            const sms = await api<{ needsManualReview: boolean }>('/sms/simulate', { method: 'POST', body: { text } });
            setMsg(sms.needsManualReview ? 'Odebrano — nie rozpoznano zdarzenia, trafia do ręcznej weryfikacji.' : 'Odebrano i przypisano do zdarzenia.');
            setText('');
            onSent();
          } catch (err) {
            setMsg(errorMessage(err));
          }
        }}
      >
        Odbierz (symulacja)
      </button>
      {msg && <p className="small">{msg}</p>}
    </details>
  );
}
