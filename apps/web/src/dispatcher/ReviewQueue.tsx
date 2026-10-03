// Zgłoszenia wymagające przeglądu, z ręcznym potwierdzeniem obsługi.
import type { InboundSms, SituationChangeReport } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleCheck, MessageSquare, Siren } from 'lucide-react';
import { useState } from 'react';
import { softSpring } from '../components/ui';
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

  if (openReports.length === 0 && unreadSms.length === 0) {
    return (
      <p className="all-clear">
        <CircleCheck size={18} /> Nic nie czeka na przegląd.
      </p>
    );
  }
  return (
    <>
      {error && <p className="error-text">{error}</p>}
      <ul className="review-list">
        <AnimatePresence initial={false}>
          {openReports.map((r) => (
            <motion.li key={r.entryId} layout className="review-item" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0, padding: 0 }} transition={softSpring}>
              <span className="card-icon is-red">
                <Siren size={17} />
              </span>
              <div className="review-body">
                <div className="review-title">Zmiana sytuacji</div>
                <p className="review-text quote">{r.text}</p>
                <div className="xsmall subtle">
                  czas telefonu {formatTime(r.times.deviceTime)} · odebrano {formatTime(r.times.receivedTime)}
                </div>
              </div>
              {canManage && (
                <button className="btn btn-sm btn-dark" onClick={() => call(`/situation-changes/${r.entryId}/review`)}>
                  <Check size={15} /> Obsłużone
                </button>
              )}
            </motion.li>
          ))}
          {unreadSms.map((s) => (
            <motion.li key={s.id} layout className="review-item is-sms" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0, padding: 0 }} transition={softSpring}>
              <span className="card-icon is-blue">
                <MessageSquare size={17} />
              </span>
              <div className="review-body">
                <div className="review-title">
                  SMS {s.isSimulated && <span className="badge">symulacja</span>}
                </div>
                <pre className="sms-raw">{s.rawText}</pre>
                <div className="xsmall subtle">odebrano {formatTime(s.receivedTime)} - odbiór nie oznacza przeczytania</div>
              </div>
              {canManage && (
                <button className="btn btn-sm btn-dark" onClick={() => call(`/sms/${s.id}/read`)}>
                  <Check size={15} /> Przeczytałem
                </button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </>
  );
}
