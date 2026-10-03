// Link dla świadka: losowy token, ważny dla jednej sesji, możliwy do unieważnienia.
// Token widać tylko raz — w bazie zostaje skrót.
import type { WitnessLinkCreated, WitnessLinkInfo } from '@do-przyjazdu/shared';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../lib/api';
import { formatAge, formatTime } from '../lib/time';

interface Props {
  incidentId: string;
  links: WitnessLinkInfo[];
  canManage: boolean;
  onChange: () => void;
}

export function WitnessLinks({ incidentId, links, canManage, onChange }: Props) {
  const [created, setCreated] = useState<WitnessLinkCreated | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = created ? `${window.location.origin}${created.path}` : null;

  useEffect(() => {
    if (!url) return setQr(null);
    QRCode.toDataURL(url, { margin: 1, width: 220 }).then(setQr, () => setQr(null));
  }, [url]);

  const call = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div>
      {created && url && (
        <div className="link-box">
          {qr && <img src={qr} alt="Kod QR z linkiem dla świadka" width={160} height={160} />}
          <div>
            <p className="small">Przekaż świadkowi (SMS, komunikator). Link pokazujemy tylko teraz.</p>
            <code className="link-url">{url}</code>
            <div className="row">
              <button
                className="btn btn-small"
                onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true), () => setCopied(false))}
              >
                {copied ? 'Skopiowano' : 'Kopiuj'}
              </button>
              <button className="btn btn-small" onClick={() => setCreated(null)}>
                Ukryj
              </button>
            </div>
          </div>
        </div>
      )}
      <ul className="links">
        {links.map((l) => {
          const active = !l.revokedAt && l.expiresAt > new Date().toISOString();
          return (
            <li key={l.id}>
              <span className={active ? 'chip chip-ok' : 'chip'}>{l.revokedAt ? 'unieważniony' : active ? 'aktywny' : 'wygasł'}</span>
              <span className="small">
                utworzono {formatTime(l.createdAt)} · ostatni kontakt: {l.lastSeenAt ? formatAge(l.lastSeenAt) : 'jeszcze nie otwarto'}
              </span>
              {canManage && active && (
                <button className="btn btn-small btn-bad-outline" onClick={() => call(() => api(`/witness-links/${l.id}`, { method: 'DELETE' }))}>
                  Unieważnij
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {canManage && (
        <button
          className="btn btn-small"
          onClick={() =>
            call(async () => {
              setCreated(await api<WitnessLinkCreated>(`/incidents/${incidentId}/witness-links`, { method: 'POST' }));
              setCopied(false);
            })
          }
        >
          Utwórz nowy link dla świadka
        </button>
      )}
      <p className="small muted">Unieważnienie odcina dostęp przy następnym połączeniu. Nie usuwa danych z telefonu, który jest offline.</p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
