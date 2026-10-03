// Krótki opis zdarzenia, czas ostatniej otrzymanej aktualizacji, link dla świadka
// i jego unieważnienie, przejście do widoku przekazania.
import type { IncidentPanelResponse, TimelineEvent } from '@do-przyjazdu/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DemoBanner } from '../components/DemoBanner';
import { StalenessLabel } from '../components/StalenessLabel';
import { api, errorMessage } from '../lib/api';
import { STATUS_LABEL } from '../lib/labels';
import { usePolling } from '../lib/polling';
import { formatDuration, formatTime } from '../lib/time';
import { useAuth } from './auth';
import { EquipmentEntry } from './EquipmentEntry';
import { InstructionList } from './InstructionList';
import { ObservationReview } from './ObservationReview';
import { ReviewQueue } from './ReviewQueue';
import { SmsSimulator } from './SmsSimulator';
import { Timeline } from './Timeline';
import { WitnessLinks } from './WitnessLinks';

export function IncidentPanel() {
  const id = useParams().id ?? '';
  const { me, logout } = useAuth();
  const panel = usePolling(() => api<IncidentPanelResponse>(`/incidents/${id}`), undefined, [id]);
  const timeline = usePolling(() => api<TimelineEvent[]>(`/incidents/${id}/timeline`), undefined, [id]);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => {
    void panel.refresh();
    void timeline.refresh();
  };

  const data = panel.data;
  if (!data) {
    return <div className="page centered">{panel.error ? <p className="error">{panel.error}</p> : 'Ładowanie…'}</div>;
  }
  const { incident, contact } = data;
  const canManage = me.user.role === 'dispatcher' && incident.status !== 'closed';
  const openReviews = data.situationReports.filter((r) => !r.reviewedAt).length + data.sms.filter((s) => !s.readAt).length;
  const responders = data.staff.filter((s) => s.role === 'responder');

  const call = async (fn: () => Promise<unknown>) => {
    try {
      setError(null);
      await fn();
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="page wide">
      <DemoBanner visible={me.demoMode || incident.isDemo} />
      <header className="topbar">
        <Link to="/dispatcher" className="btn btn-small">
          ← Zdarzenia
        </Link>
        <h1>
          {incident.id} <span className="chip chip-info">{STATUS_LABEL[incident.status]}</span>
        </h1>
        <Link to={`/handover/${incident.id}`} className="btn btn-primary btn-small">
          Widok przekazania
        </Link>
        <span className="muted small">{me.user.displayName}</span>
        <button className="btn btn-small" onClick={() => void logout()}>
          Wyloguj
        </button>
      </header>
      {panel.error && (
        <div className="notice notice-bad">
          Brak połączenia z serwerem ({panel.error}). Dane poniżej mogą być nieaktualne — <StalenessLabel prefix="pobrano" at={panel.lastSuccessAt} />.
        </div>
      )}
      {error && <p className="error">{error}</p>}

      <section className="card status-strip">
        <p className="lead">{incident.description}</p>
        <div className="row wrap">
          <StalenessLabel prefix="Ostatni wpis od świadka" at={contact.lastReceivedAt} never="brak" staleAfterSeconds={180} />
          <StalenessLabel prefix="Ostatni kontakt z telefonem" at={contact.lastWitnessContactAt} never="świadek jeszcze nie otworzył linku" staleAfterSeconds={contact.gapThresholdSeconds} />
          {openReviews > 0 && <span className="chip chip-bad">Do przeglądu: {openReviews}</span>}
        </div>
        {contact.ongoingGapSince && (
          <div className="notice notice-bad">
            <strong>Brak kontaktu z telefonem świadka od {formatTime(contact.ongoingGapSince)} ({formatDuration(contact.ongoingGapSince, null)}).</strong> Świadek nie
            otrzymuje nowych poleceń. Brak nowych informacji nie oznacza, że stan się nie zmienił.
          </div>
        )}
      </section>

      <div className="grid">
        <div className="col">
          <section className="card">
            <h2>Do przeglądu</h2>
            <ReviewQueue reports={data.situationReports} sms={data.sms} canManage={canManage} onChange={refresh} />
            {me.demoMode && canManage && <SmsSimulator onSent={refresh} hint="Wiadomość z poprawnym identyfikatorem zdarzenia zostanie przypisana tutaj." />}
          </section>
          <section className="card">
            <h2>Odpowiedzi świadka</h2>
            <ObservationReview
              incidentId={incident.id}
              fields={data.fields}
              fieldStates={data.fieldStates}
              missing={data.missingInformation}
              observations={data.observations}
              canManage={canManage}
              onChange={refresh}
            />
          </section>
          <section className="card">
            <h2>Wyposażenie</h2>
            <EquipmentEntry incidentId={incident.id} equipment={data.equipment} staff={data.staff} canManage={canManage} onChange={refresh} />
          </section>
          <section className="card">
            <h2>Dostęp świadka</h2>
            <WitnessLinks incidentId={incident.id} links={data.witnessLinks} canManage={canManage} onChange={refresh} />
          </section>
          <section className="card">
            <h2>Ratownik przejmujący</h2>
            {data.assignedResponders.length > 0 ? (
              <p>{data.assignedResponders.map((r) => r.displayName).join(', ')}</p>
            ) : (
              <p className="muted">Nie przydzielono.</p>
            )}
            {canManage && (
              <div className="row wrap">
                {responders
                  .filter((r) => !data.assignedResponders.some((a) => a.id === r.id))
                  .map((r) => (
                    <button key={r.id} className="btn btn-small" onClick={() => call(() => api(`/incidents/${incident.id}/responders`, { method: 'POST', body: { responderId: r.id } }))}>
                      Przydziel: {r.displayName}
                    </button>
                  ))}
              </div>
            )}
            {data.handover && (
              <p className="chip chip-ok">
                Przejęte {formatTime(data.handover.acceptedAt)} przez {data.staff.find((s) => s.id === data.handover!.responderId)?.displayName}
              </p>
            )}
            {canManage &&
              (confirmClose ? (
                <div className="row">
                  <button className="btn btn-bad btn-small" onClick={() => call(() => api(`/incidents/${incident.id}/status`, { method: 'POST', body: { to: 'closed' } }))}>
                    Tak, zamknij zdarzenie
                  </button>
                  <button className="btn btn-small" onClick={() => setConfirmClose(false)}>
                    Anuluj
                  </button>
                </div>
              ) : (
                <button className="btn btn-small btn-bad-outline" onClick={() => setConfirmClose(true)}>
                  Zamknij zdarzenie
                </button>
              ))}
          </section>
        </div>
        <div className="col">
          <section className="card">
            <h2>Instrukcje</h2>
            <p className="small muted">Świadek widzi tylko zatwierdzone. Zmiana treści tworzy nową wersję; odpowiedź do starszej wersji nie potwierdza nowej.</p>
            <InstructionList
              incidentId={incident.id}
              instructions={data.instructions}
              outcomes={data.instructionOutcomes}
              acknowledgements={data.acknowledgements}
              staff={data.staff}
              canManage={canManage}
              onChange={refresh}
            />
          </section>
          <section className="card">
            <h2>Oś czasu</h2>
            <Timeline events={[...(timeline.data ?? [])].reverse()} fields={data.fields} instructions={data.instructions} staff={data.staff} />
          </section>
        </div>
      </div>
    </div>
  );
}
