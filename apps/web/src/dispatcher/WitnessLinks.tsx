// Link dla świadka: losowy token, ważny dla jednej sesji, możliwy do unieważnienia.
// Token widać tylko raz - w bazie zostaje skrót.
import type { WitnessLinkCreated, WitnessLinkInfo } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, EyeOff, Link2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { softSpring, useToast } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { formatAge, formatTime } from '../lib/time';

interface Props {
  incidentId: string;
  links: WitnessLinkInfo[];
  canManage: boolean;
  onChange: () => void;
}

export function WitnessLinks({ incidentId, links, canManage, onChange }: Props) {
  const toast = useToast();
  const [created, setCreated] = useState<WitnessLinkCreated | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = created ? `${window.location.origin}${created.path}` : null;

  useEffect(() => {
    if (!url) return setQr(null);
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#1d1d1f', light: '#ffffff' } }).then(setQr, () => setQr(null));
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
      <AnimatePresence>
        {created && url && (
          <motion.div className="link-hero" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={softSpring}>
            {qr && (
              <div className="qr-frame">
                <img src={qr} alt="Kod QR z linkiem dla świadka" width={150} height={150} />
              </div>
            )}
            <div className="link-hero-body">
              <strong>Link gotowy</strong>
              <p className="hint">Przekaż świadkowi (SMS, komunikator) albo pokaż kod QR. Link pokazujemy tylko teraz.</p>
              <code className="link-url">{url}</code>
              <div className="row">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    navigator.clipboard?.writeText(url).then(
                      () => {
                        setCopied(true);
                        toast({ tone: 'ok', icon: <Check size={17} strokeWidth={3} />, title: 'Skopiowano link', detail: 'Wklej go świadkowi w SMS-ie' });
                      },
                      () => setCopied(false),
                    )
                  }
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Skopiowano' : 'Kopiuj link'}
                </button>
                <button className="btn btn-sm" onClick={() => setCreated(null)}>
                  <EyeOff size={15} /> Ukryj
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {links.length > 0 && (
        <ul className="link-rows">
          {links.map((l) => {
            const active = !l.revokedAt && l.expiresAt > new Date().toISOString();
            return (
              <li key={l.id}>
                <span className={active ? 'badge badge-green' : 'badge'}>
                  <Link2 size={12} /> {l.revokedAt ? 'unieważniony' : active ? 'aktywny' : 'wygasł'}
                </span>
                <span className="muted">
                  utworzono {formatTime(l.createdAt)} · ostatni kontakt: {l.lastSeenAt ? formatAge(l.lastSeenAt) : 'jeszcze nie otwarto'}
                </span>
                {canManage && active && (
                  <button className="btn btn-sm btn-outline-red" onClick={() => call(() => api(`/witness-links/${l.id}`, { method: 'DELETE' }))}>
                    Unieważnij
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {canManage && (
        <button
          className="btn btn-tint-blue"
          onClick={() =>
            call(async () => {
              setCreated(await api<WitnessLinkCreated>(`/incidents/${incidentId}/witness-links`, { method: 'POST' }));
              setCopied(false);
            })
          }
        >
          <QrCode size={17} /> Utwórz nowy link dla świadka
        </button>
      )}
      <p className="hint" style={{ marginTop: '0.75rem' }}>
        Unieważnienie odcina dostęp przy następnym połączeniu. Nie usuwa danych z telefonu, który jest offline.
      </p>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
