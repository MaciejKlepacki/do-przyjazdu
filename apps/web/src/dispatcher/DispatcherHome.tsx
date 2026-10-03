// Lista zdarzeń, utworzenie sesji, kolejka SMS-ów do ręcznej weryfikacji.
import type { InboundSms, Incident, IncidentSummary } from '@do-przyjazdu/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DemoBanner } from '../components/DemoBanner';
import { StalenessLabel } from '../components/StalenessLabel';
import { api, errorMessage } from '../lib/api';
import { STATUS_LABEL } from '../lib/labels';
import { usePolling } from '../lib/polling';
import { formatDateTime, formatTime } from '../lib/time';
import { useAuth } from './auth';
import { SmsSimulator } from './SmsSimulator';

export function DispatcherHome() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const isDispatcher = me.user.role === 'dispatcher';
  const { data: incidents, error, refresh } = usePolling(() => api<IncidentSummary[]>('/incidents'));
  const unassigned = usePolling(() => (isDispatcher ? api<InboundSms[]>('/sms/unassigned') : Promise.resolve([])));
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const incident = await api<Incident>('/incidents', { method: 'POST', body: { description } });
      navigate(`/dispatcher/${incident.id}`);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  return (
    <div className="page">
      <DemoBanner visible={me.demoMode} />
      <header className="topbar">
        <h1>Do przyjazdu</h1>
        <span className="muted">{me.user.displayName}</span>
        <button className="btn btn-small" onClick={() => void logout()}>
          Wyloguj
        </button>
      </header>
      {error && <p className="error">Brak połączenia z serwerem: {error}</p>}

      <section className="card">
        <h2>{isDispatcher ? 'Prowadzone zdarzenia' : 'Przydzielone zdarzenia'}</h2>
        {incidents?.length === 0 && <p className="muted">Brak zdarzeń.</p>}
        <ul className="incident-list">
          {incidents?.map((i) => (
            <li key={i.id}>
              <Link to={isDispatcher ? `/dispatcher/${i.id}` : `/handover/${i.id}`} className="incident-link">
                <strong>{i.id}</strong>
                {i.isDemo && <span className="chip">demo</span>}
                <span className="chip chip-info">{STATUS_LABEL[i.status]}</span>
                {i.openReviews > 0 && <span className="chip chip-bad">Do przeglądu: {i.openReviews}</span>}
                <span className="incident-desc">{i.description}</span>
                <span className="muted small">
                  utworzono {formatDateTime(i.createdAt)} · <StalenessLabel prefix="ostatni wpis świadka" at={i.lastReceivedAt} never="brak" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {isDispatcher && (
        <section className="card">
          <h2>Nowa sesja zdarzenia</h2>
          <form onSubmit={create} className="row wrap">
            <input
              className="grow"
              placeholder="Krótki opis, bez nazwisk (np. upadek na szlaku, 2 osoby)"
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button className="btn btn-primary" disabled={description.trim().length < 3}>
              Utwórz
            </button>
          </form>
          <p className="small muted">Sesja dostanie pola formularza i szkice instrukcji ze scenariusza. Świadek zobaczy instrukcję dopiero po zatwierdzeniu.</p>
          {formError && <p className="error">{formError}</p>}
        </section>
      )}

      {isDispatcher && (
        <section className="card">
          <h2>SMS-y do ręcznej weryfikacji</h2>
          <p className="small muted">Wiadomości bez rozpoznanego zdarzenia. Nie są automatycznie dopisywane do żadnej akcji.</p>
          {unassigned.data?.length === 0 && <p className="muted">Brak.</p>}
          <ul className="entry-list">
            {unassigned.data?.map((s) => (
              <UnassignedSms key={s.id} sms={s} incidents={incidents ?? []} onDone={() => { void unassigned.refresh(); void refresh(); }} />
            ))}
          </ul>
          {me.demoMode && <SmsSimulator onSent={() => { void unassigned.refresh(); void refresh(); }} />}
        </section>
      )}
    </div>
  );
}

function UnassignedSms({ sms, incidents, onDone }: { sms: InboundSms; incidents: IncidentSummary[]; onDone: () => void }) {
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <li className="entry">
      <div className="row wrap">
        <span className="muted small">odebrano {formatTime(sms.receivedTime)}</span>
        {sms.isSimulated && <span className="chip">symulacja</span>}
        {sms.claimedIncidentId && <span className="chip chip-warn">wskazane zdarzenie: {sms.claimedIncidentId} (nie istnieje)</span>}
      </div>
      <pre className="sms-preview">{sms.rawText}</pre>
      <div className="row wrap">
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">— przypisz ręcznie do zdarzenia —</option>
          {incidents.map((i) => (
            <option key={i.id} value={i.id}>
              {i.id} · {i.description.slice(0, 40)}
            </option>
          ))}
        </select>
        <button
          className="btn btn-small"
          disabled={!target}
          onClick={async () => {
            try {
              await api(`/sms/${sms.id}/assign`, { method: 'POST', body: { incidentId: target } });
              onDone();
            } catch (err) {
              setError(errorMessage(err));
            }
          }}
        >
          Przypisz
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </li>
  );
}
