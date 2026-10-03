// Zgłoszenia wymagające przeglądu, z ręcznym potwierdzeniem obsługi.
import type { InboundSms, SituationChangeReport } from '@do-przyjazdu/shared';
import { useState } from 'react';
import { api, errorMessage } from '../lib/api';
import { formatTime } from '../lib/time';

interface Props {
  reports: SituationChangeReport[];
  sms: InboundSms[];
  canManage: boolean;
  onChange: () => void;
}

export function ReviewQueue({ reports, sms, canManage, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const openReports = reports.filter((r) => !r.reviewedAt);
  const unreadSms = sms.filter((s) => !s.readAt);
  const call = async (path: string) => {
    try {
      await api(path, { method: 'POST' });
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (openReports.length === 0 && unreadSms.length === 0) return <p className="muted">Nic nie czeka na przegląd.</p>;
  return (
    <ul className="review">
      {error && <p className="error">{error}</p>}
      {openReports.map((r) => (
        <li key={r.entryId} className="review-item">
          <div>
            <strong>Zmiana sytuacji:</strong> „{r.text}”
            <div className="small muted">
              czas telefonu {formatTime(r.times.deviceTime)} · odebrano {formatTime(r.times.receivedTime)}
            </div>
          </div>
          {canManage && (
            <button className="btn btn-small btn-primary" onClick={() => call(`/situation-changes/${r.entryId}/review`)}>
              Obsłużone
            </button>
          )}
        </li>
      ))}
      {unreadSms.map((s) => (
        <li key={s.id} className="review-item">
          <div>
            <strong>SMS</strong> {s.isSimulated && <span className="chip">symulacja</span>}
            <pre className="sms-preview">{s.rawText}</pre>
            <div className="small muted">odebrano {formatTime(s.receivedTime)} — odbiór nie oznacza przeczytania</div>
          </div>
          {canManage && (
            <button className="btn btn-small btn-primary" onClick={() => call(`/sms/${s.id}/read`)}>
              Przeczytałem
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
