// Awaryjny kanał SMS (sekcja 10). Link sms: otwiera systemową aplikację Wiadomości
// z krótkim tekstem; wysyła sam świadek. Treść: identyfikator zdarzenia, krótka
// odpowiedź, opcjonalne współrzędne — bez nazwiska i zbędnych danych medycznych.
// Statusy: przygotowano / otwarto aplikację SMS / wysłano z telefonu /
// odebrano przez centralę / przeczytano przez prowadzącego.
// UI nie może twierdzić, że wiadomość dotarła, dopóki centrala tego nie potwierdzi.
import { formatSmsBody, SMS_TEXT_MAX, type WitnessSessionResponse } from '@do-przyjazdu/shared';
import { useState } from 'react';
import { ACK_LABEL, SMS_STATUS_LABEL } from '../lib/labels';
import type { LocalEntry } from '../offline/db';
import { setSmsStatus } from '../offline/queue';
import { smsStatusFor } from './entryStatus';

function defaultText(entry: LocalEntry, session: WitnessSessionResponse): string {
  if (entry.kind === 'situation-change') return `ZMIANA: ${entry.payload.text}`;
  if (entry.kind === 'acknowledgement') {
    const n = session.instructions.findIndex((i) => i.id === entry.payload.instructionId) + 1;
    return `Czynnosc ${n || '?'} v${entry.payload.instructionVersion}: ${ACK_LABEL[entry.payload.result]}`;
  }
  return entry.payload.freeText ? `OBS: ${entry.payload.freeText}` : 'OBS: nowa obserwacja zapisana w aplikacji';
}

interface Props {
  entry: LocalEntry;
  session: WitnessSessionResponse;
  onClose: () => void;
  onChanged: () => void;
}

export function SmsFallback({ entry, session, onClose, onChanged }: Props) {
  const [text, setText] = useState(() => entry.sms?.text || defaultText(entry, session));
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const status = smsStatusFor(entry, session);
  const body = formatSmsBody({ incidentId: session.incident.id, entryId: entry.entryId, text, coords });
  const number = session.sms.number ?? '';
  const href = `sms:${number}${/iPhone|iPad/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(body)}`;

  const mark = async (s: 'prepared' | 'sms-app-opened' | 'declared-sent') => {
    await setSmsStatus(entry, s, text);
    onChanged();
  };

  const addLocation = () => {
    if (!('geolocation' in navigator)) return setGeoMsg('Ten telefon nie udostępnia lokalizacji.');
    setGeoMsg('Ustalanie położenia…');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
        setGeoMsg(`Dokładność ok. ${Math.round(p.coords.accuracy)} m. Sprawdź przed wysłaniem.`);
      },
      () => setGeoMsg('Nie udało się ustalić położenia.'),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  };

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Wyślij SMS">
      <div className="sheet-body">
        <h2>Aktualizacja SMS-em</h2>
        <p className="small">
          Telefon otworzy aplikację Wiadomości z gotowym tekstem. <strong>Wysyłasz sam.</strong> SMS to zwykła wiadomość — może dotrzeć z
          opóźnieniem albo wcale. Nie wpisuj nazwisk.
        </p>
        {session.sms.simulated && (
          <div className="notice notice-warn small">
            Demo: odbiór SMS w centrali jest <strong>symulowany</strong>
            {number ? '' : ' i numer odbiorczy nie jest ustawiony'}. Prowadzący wkleja treść w panelu.
          </div>
        )}
        <label className="field-label">
          Treść (max {SMS_TEXT_MAX} znaków)
          <textarea rows={3} maxLength={SMS_TEXT_MAX} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="row">
          <button className="btn btn-secondary" onClick={addLocation}>
            {coords ? 'Odśwież położenie' : 'Dodaj współrzędne'}
          </button>
          {coords && (
            <button className="btn" onClick={() => setCoords(null)}>
              Usuń współrzędne
            </button>
          )}
        </div>
        {geoMsg && <p className="small muted">{geoMsg}</p>}
        <pre className="sms-preview">{body}</pre>
        <a className="btn btn-primary btn-large" href={href} onClick={() => void mark('sms-app-opened')}>
          Otwórz aplikację SMS
        </a>
        {(status === 'sms-app-opened' || status === 'prepared') && (
          <button className="btn" onClick={() => void mark('declared-sent')}>
            Wysłałem SMS
          </button>
        )}
        <p className="small">
          Status: <strong>{status ? SMS_STATUS_LABEL[status] : 'nie przygotowano'}</strong>
          {status === 'declared-sent' && ' — centrala jeszcze nie potwierdziła odbioru.'}
        </p>
        <button className="btn" onClick={onClose}>
          Zamknij
        </button>
      </div>
    </div>
  );
}
