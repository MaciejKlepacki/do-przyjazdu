// Awaryjny kanał SMS (sekcja 10). Link sms: otwiera systemową aplikację Wiadomości
// z krótkim tekstem; wysyła sam świadek. Treść: identyfikator zdarzenia, krótka
// odpowiedź, opcjonalne współrzędne — bez nazwiska i zbędnych danych medycznych.
// Statusy: przygotowano / otwarto aplikację SMS / wysłano z telefonu /
// odebrano przez centralę / przeczytano przez prowadzącego.
// UI nie może twierdzić, że wiadomość dotarła, dopóki centrala tego nie potwierdzi.
import { formatSmsBody, SMS_TEXT_MAX, type SmsFallbackStatus, type WitnessSessionResponse } from '@do-przyjazdu/shared';
import { Check, FlaskConical, MapPin, MessageSquare, X } from 'lucide-react';
import { useState } from 'react';
import { ACK_LABEL, SMS_STATUS_LABEL } from '../lib/labels';
import type { LocalEntry } from '../offline/db';
import { setSmsStatus } from '../offline/queue';
import { smsStatusFor } from './entryStatus';

const STEPS: SmsFallbackStatus[] = ['prepared', 'sms-app-opened', 'declared-sent', 'received-by-center', 'read-by-lead'];

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
  onChanged: () => void;
}

/** Zawartość arkusza „Aktualizacja SMS-em”. */
export function SmsFallback({ entry, session, onChanged }: Props) {
  const [text, setText] = useState(() => entry.sms?.text || defaultText(entry, session));
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const status = smsStatusFor(entry, session);
  const body = formatSmsBody({ incidentId: session.incident.id, entryId: entry.entryId, text, coords });
  const number = session.sms.number ?? '';
  const href = `sms:${number}${/iPhone|iPad/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(body)}`;
  const reached = status ? STEPS.indexOf(status) : -1;

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
    <>
      <p className="hint">
        Telefon otworzy aplikację Wiadomości z gotowym tekstem. <strong>Wysyłasz sam.</strong> SMS to zwykła wiadomość — może dotrzeć z opóźnieniem albo
        wcale. Nie wpisuj nazwisk.
      </p>
      {session.sms.simulated && (
        <div className="callout callout-orange small">
          <FlaskConical size={17} />
          <span>
            Demo: odbiór SMS w centrali jest <strong>symulowany</strong>
            {number ? '' : ' i numer odbiorczy nie jest ustawiony'}. Prowadzący wkleja treść w panelu.
          </span>
        </div>
      )}
      <div>
        <div className="bubble-wrap">
          <div className="bubble">{body}</div>
        </div>
        <div className="bubble-meta">Podgląd wiadomości · {body.length} znaków</div>
      </div>
      <label className="field">
        <span>
          Treść (max {SMS_TEXT_MAX} znaków)
        </span>
        <textarea rows={2} maxLength={SMS_TEXT_MAX} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="row">
        <button className="btn btn-sm btn-tint-blue" onClick={addLocation}>
          <MapPin size={15} /> {coords ? 'Odśwież położenie' : 'Dodaj współrzędne'}
        </button>
        {coords && (
          <button className="btn btn-sm" onClick={() => setCoords(null)}>
            <X size={15} /> Usuń współrzędne
          </button>
        )}
      </div>
      {geoMsg && <p className="hint">{geoMsg}</p>}
      <a className="btn btn-xl btn-success btn-block" href={href} onClick={() => void mark('sms-app-opened')}>
        <MessageSquare size={21} /> Otwórz aplikację SMS
      </a>
      {(status === 'sms-app-opened' || status === 'prepared') && (
        <button className="btn btn-lg btn-block" onClick={() => void mark('declared-sent')}>
          <Check size={18} /> Wysłałem SMS
        </button>
      )}
      <div>
        <h3 className="section-label">Status</h3>
        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s} className={i < reached ? 'is-done' : i === reached ? 'is-done is-current' : ''}>
              <span className="stepper-dot">
                <Check size={12} strokeWidth={3} />
              </span>
              {SMS_STATUS_LABEL[s]}
              {i >= 3 && <span className="stepper-note subtle">potwierdza centrala</span>}
            </li>
          ))}
        </ol>
        {status === 'declared-sent' && <p className="hint" style={{ marginTop: '0.4rem' }}>Centrala jeszcze nie potwierdziła odbioru.</p>}
      </div>
    </>
  );
}
