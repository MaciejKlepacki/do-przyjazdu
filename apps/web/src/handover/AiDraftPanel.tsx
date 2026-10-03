// Szkic AI jako osobna sekcja, wyraźnie oznaczona, z odnośnikami do wpisów osi czasu
// i zatwierdzeniem przez prowadzącego. Brak szkicu nie blokuje przekazania.
import type { AiSummaryDraft } from '@do-przyjazdu/shared';
import { useState } from 'react';
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
    return <p className="muted small">AI nie jest skonfigurowane. Widok przekazania powyżej powstaje bez AI.</p>;
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
    <div className="ai-panel">
      <p className="small">
        <strong>Szkic przygotowany przez AI — nie jest wpisem w historii.</strong> Każde zdanie ma odnośniki do wpisów; zdania bez odnośnika lub z
        treścią diagnostyczną są odrzucane. Sprawdź z osią czasu.
      </p>
      {draft && (
        <>
          <ol className="ai-sentences">
            {draft.sentences.map((s, i) => (
              <li key={i}>
                {s.text}{' '}
                <button className="cite" onClick={() => onCite(s.entryIds)} title="Pokaż wpisy na osi czasu">
                  [{s.entryIds.length} wpis{s.entryIds.length === 1 ? '' : 'y'}]
                </button>
              </li>
            ))}
          </ol>
          <p className="small muted">
            wygenerowano {formatTime(draft.generatedAt)}
            {draft.rejectedCount > 0 && ` · odrzucono zdań: ${draft.rejectedCount}`}
            {draft.approvedAt ? ` · zatwierdzono ${formatTime(draft.approvedAt)}` : ' · niezatwierdzony'}
          </p>
          {canApprove && !draft.approvedAt && (
            <button
              className="btn btn-small"
              onClick={async () => {
                try {
                  await api(`/ai-drafts/${draft.id}/approve`, { method: 'POST' });
                  onChange();
                } catch (err) {
                  setError(errorMessage(err));
                }
              }}
            >
              Zatwierdzam szkic (prowadzący)
            </button>
          )}
        </>
      )}
      {available && (
        <button className="btn btn-small" disabled={busy} onClick={generate}>
          {busy ? 'Generowanie…' : draft ? 'Wygeneruj ponownie' : 'Przygotuj szkic AI'}
        </button>
      )}
      {error && <p className="error">{error} Widok przekazania działa bez AI.</p>}
    </div>
  );
}
