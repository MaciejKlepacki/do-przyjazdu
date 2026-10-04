// Szkic AI jako osobna sekcja, wyraźnie oznaczona, z odnośnikami do wpisów osi czasu
// i zatwierdzeniem przez prowadzącego. Brak szkicu nie blokuje przekazania.
import type { AiSummaryDraft } from '@do-przyjazdu/shared';
import { motion } from 'framer-motion';
import { Check, Link2, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { plural, softSpring } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { formatTime } from '../lib/time';

interface Props {
  incidentId: string;
  draft: AiSummaryDraft | null;
  available: boolean;
  canApprove: boolean;
  onChange: () => void;
  onCite: (entryIds: string[]) => void;
}

export function AiDraftPanel({ incidentId, draft, available, canApprove, onChange, onCite }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!available && !draft) {
    return <p className="hint">AI nie jest skonfigurowane. Widok przekazania powyżej powstaje bez AI.</p>;
  }

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/incidents/${incidentId}/ai-draft`, { method: 'POST', timeoutMs: 90_000 });
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <p className="hint">
        <strong>Szkic przygotowany przez AI - nie jest wpisem w historii.</strong> Każde zdanie ma odnośniki do wpisów; zdania bez odnośnika lub z treścią
        diagnostyczną są odrzucane. Sprawdź z osią czasu.
      </p>
      {busy && (
        <div className="row muted small">
          <LoaderCircle size={16} className="spin" /> Analiza osi czasu…
        </div>
      )}
      {draft && !busy && (
        <>
          <ol className="ai-sentences">
            {draft.sentences.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: i * 0.08 }}>
                <span>
                  {s.text}{' '}
                  <button className="cite" onClick={() => onCite(s.entryIds)} title="Pokaż wpisy na osi czasu">
                    <Link2 size={11} /> {s.entryIds.length} {plural(s.entryIds.length, 'wpis', 'wpisy', 'wpisów')}
                  </button>
                </span>
              </motion.li>
            ))}
          </ol>
          <div className="row">
            <span className="xsmall subtle">wygenerowano {formatTime(draft.generatedAt)}</span>
            {draft.rejectedCount > 0 && <span className="badge badge-orange">odrzucono zdań: {draft.rejectedCount}</span>}
            {draft.approvedAt ? (
              <span className="badge badge-green">
                <Check size={12} /> zatwierdzono {formatTime(draft.approvedAt)}
              </span>
            ) : (
              <span className="badge">niezatwierdzony</span>
            )}
          </div>
          {canApprove && !draft.approvedAt && (
            <div>
              <button
                className="btn btn-sm btn-tint-green"
                onClick={async () => {
                  try {
                    await api(`/ai-drafts/${draft.id}/approve`, { method: 'POST' });
                    onChange();
                  } catch (err) {
                    setError(errorMessage(err));
                  }
                }}
              >
                <Check size={15} /> Zatwierdzam szkic (prowadzący)
              </button>
            </div>
          )}
        </>
      )}
      {available && (
        <div>
          <button className="btn btn-sm btn-dark" disabled={busy} onClick={generate}>
            {draft ? <RefreshCw size={15} /> : <Sparkles size={15} />} {busy ? 'Generowanie…' : draft ? 'Wygeneruj ponownie' : 'Przygotuj szkic AI'}
          </button>
        </div>
      )}
      {error && <p className="error-text">{error} Widok przekazania działa bez AI.</p>}
    </div>
  );
}
