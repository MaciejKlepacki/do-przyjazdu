// Krótki opis zdarzenia, czas ostatniej otrzymanej aktualizacji, link dla świadka
// i jego unieważnienie, przejście do widoku przekazania.
import type { IncidentPanelResponse, TimelineEvent } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  ClipboardList,
  Handshake,
  Inbox,
  ListChecks,
  MessageSquareText,
  Package,
  QrCode,
  Route,
  ServerCrash,
  Smartphone,
  Unplug,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StalenessLabel, useAge } from '../components/StalenessLabel';
import { StaffShell } from '../components/StaffShell';
import { Avatar, CardHead, LiveDot, ProgressRing, softSpring, Splash } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { usePolling } from '../lib/polling';
import { formatDuration, formatTime } from '../lib/time';
import { useAuth } from './auth';
import { StatusBadge } from './DispatcherHome';
import { EquipmentEntry } from './EquipmentEntry';
import { InstructionList } from './InstructionList';
import { ObservationReview } from './ObservationReview';
import { ReviewQueue } from './ReviewQueue';
import { SmsSimulator } from './SmsSimulator';
import { Timeline } from './Timeline';
import { WitnessLinks } from './WitnessLinks';

export function StatTile({ icon, label, value, sub, tone }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode; tone?: string | undefined }) {
  return (
    <motion.div className={`stat${tone ? ` is-${tone}` : ''}`} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
      <div className="stat-top">
        {icon}
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </motion.div>
  );
}

export function IncidentPanel() {
  const id = useParams().id ?? '';
  const { me } = useAuth();
  const panel = usePolling(() => api<IncidentPanelResponse>(`/incidents/${id}`), undefined, [id]);
  const timeline = usePolling(() => api<TimelineEvent[]>(`/incidents/${id}/timeline`), undefined, [id]);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = panel.data;
  const lastEntry = useAge(data?.contact.lastReceivedAt, 180);
  const lastContact = useAge(data?.contact.lastWitnessContactAt, data?.contact.gapThresholdSeconds ?? 30);
  const refresh = () => {
    void panel.refresh();
    void timeline.refresh();
  };

  if (!data) {
    return panel.error ? (
      <Splash icon={<ServerCrash size={34} />} tone="red" title="Nie udało się wczytać zdarzenia">
        <p>{panel.error}</p>
        <Link to="/dispatcher" className="btn btn-primary">
          Wróć do listy
        </Link>
      </Splash>
    ) : (
      <Splash title="Wczytywanie zdarzenia…" />
    );
  }
  const { incident, contact } = data;
  const canManage = me.user.role === 'dispatcher' && incident.status !== 'closed';
  const openReviews = data.situationReports.filter((r) => !r.reviewedAt).length + data.sms.filter((s) => !s.readAt).length;
  const responders = data.staff.filter((s) => s.role === 'responder');
  const total = data.instructionOutcomes.length;
  const done = data.instructionOutcomes.filter((o) => o.state === 'done').length;
  const problems = data.instructionOutcomes.filter((o) => o.state === 'cannot-do' || o.state === 'needs-clarification').length;

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
    <StaffShell
      demo={incident.isDemo}
      crumbs={
        <>
          <Link to="/dispatcher" className="crumbs-hide-sm">
            Zdarzenia
          </Link>
          <ChevronRight size={14} className="crumbs-hide-sm" />
          <span className="current mono">{incident.id}</span>
        </>
      }
    >
      <motion.section className="incident-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        <div className="ih-main">
          <div className="ih-id-row">
            <h1 className="display">{incident.id}</h1>
            <StatusBadge status={incident.status} large />
          </div>
          <p className="ih-desc">{incident.description}</p>
        </div>
        <div className="ih-actions">
          <Link to={`/handover/${incident.id}`} className="btn btn-lg btn-primary">
            <ClipboardList size={18} /> Widok przekazania
          </Link>
        </div>
      </motion.section>

      {panel.error && (
        <div className="callout callout-red" style={{ marginBottom: '1rem' }}>
          <ServerCrash size={18} />
          <span>
            Brak połączenia z serwerem ({panel.error}). Dane poniżej mogą być nieaktualne — <StalenessLabel prefix="pobrano" at={panel.lastSuccessAt} />.
          </span>
        </div>
      )}
      {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

      <AnimatePresence>
        {contact.ongoingGapSince && (
          <motion.div className="alert-banner" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={softSpring}>
            <span className="alert-banner-icon">
              <Unplug size={20} />
            </span>
            <div>
              <strong>
                Brak kontaktu z telefonem świadka od {formatTime(contact.ongoingGapSince)} ({formatDuration(contact.ongoingGapSince, null)})
              </strong>
              <span>Świadek nie otrzymuje nowych poleceń. Brak nowych informacji nie oznacza, że stan się nie zmienił.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="stats">
        <StatTile
          icon={<MessageSquareText size={15} />}
          label="Ostatni wpis od świadka"
          value={<span className={lastEntry.stale ? 'is-stale' : undefined}>{lastEntry.text ?? 'brak'}</span>}
          sub={contact.lastReceivedAt ? `o ${formatTime(contact.lastReceivedAt)}` : 'świadek nic jeszcze nie wysłał'}
        />
        <StatTile
          icon={<Smartphone size={15} />}
          label="Kontakt z telefonem"
          tone={contact.ongoingGapSince ? 'red' : undefined}
          value={
            <>
              <LiveDot tone={!contact.lastWitnessContactAt ? 'gray' : lastContact.stale ? 'red' : 'green'} pulse={Boolean(contact.lastWitnessContactAt)} />
              <span className={lastContact.stale ? 'is-stale' : undefined}>{lastContact.text ?? 'brak'}</span>
            </>
          }
          sub={contact.lastWitnessContactAt ? `o ${formatTime(contact.lastWitnessContactAt)}` : 'świadek jeszcze nie otworzył linku'}
        />
        <StatTile
          icon={<Inbox size={15} />}
          label="Do przeglądu"
          tone={openReviews > 0 ? 'red' : 'green'}
          value={openReviews}
          sub={openReviews > 0 ? 'zgłoszenia i SMS-y czekają' : 'wszystko obsłużone'}
        />
        <StatTile
          icon={<ListChecks size={15} />}
          label="Czynności wykonane"
          value={
            <>
              <ProgressRing value={total ? done / total : 0} size={34} stroke={4.5} />
              {done}/{total}
            </>
          }
          sub={problems > 0 ? `${problems} z problemem` : total ? 'bez zgłoszonych trudności' : 'brak zatwierdzonych'}
        />
      </div>

      <div className="panel-grid">
        <div className="panel-col">
          <section className="card">
            <CardHead icon={<Inbox size={18} />} tone="red" title="Do przeglądu" aside={openReviews > 0 ? <span className="count-bubble">{openReviews}</span> : undefined} />
            <ReviewQueue reports={data.situationReports} sms={data.sms} canManage={canManage} onChange={refresh} />
            {me.demoMode && canManage && <SmsSimulator onSent={refresh} hint="Wiadomość z poprawnym identyfikatorem zdarzenia zostanie przypisana tutaj." />}
          </section>
          <section className="card">
            <CardHead icon={<MessageSquareText size={18} />} tone="blue" title="Odpowiedzi świadka" sub="Ostatnia odpowiedź na każde pytanie" />
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
            <CardHead icon={<Package size={18} />} tone="indigo" title="Wyposażenie" sub="Na miejscu i dostarczone (np. dronem)" />
            <EquipmentEntry incidentId={incident.id} equipment={data.equipment} staff={data.staff} canManage={canManage} onChange={refresh} />
          </section>
          <section className="card">
            <CardHead icon={<QrCode size={18} />} tone="blue" title="Dostęp świadka" sub="Link bez konta, możliwy do unieważnienia" />
            <WitnessLinks incidentId={incident.id} links={data.witnessLinks} canManage={canManage} onChange={refresh} />
          </section>
          <section className="card">
            <CardHead icon={<Users size={18} />} tone="green" title="Ratownik przejmujący" />
            {data.assignedResponders.length > 0 ? (
              <div className="row" style={{ marginBottom: '0.8rem' }}>
                {data.assignedResponders.map((r) => (
                  <span key={r.id} className="user-chip" style={{ paddingRight: '0.8rem' }}>
                    <Avatar name={r.displayName} size={28} />
                    <strong className="small">{r.displayName}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p className="hint" style={{ marginBottom: '0.8rem' }}>
                Nie przydzielono.
              </p>
            )}
            {canManage && (
              <div className="row">
                {responders
                  .filter((r) => !data.assignedResponders.some((a) => a.id === r.id))
                  .map((r) => (
                    <button key={r.id} className="btn btn-sm btn-tint-green" onClick={() => call(() => api(`/incidents/${incident.id}/responders`, { method: 'POST', body: { responderId: r.id } }))}>
                      <UserPlus size={15} /> Przydziel: {r.displayName}
                    </button>
                  ))}
              </div>
            )}
            {data.handover && (
              <div className="callout callout-green" style={{ marginTop: '0.8rem' }}>
                <Handshake size={18} />
                <span>
                  Przejęte {formatTime(data.handover.acceptedAt)} przez <strong>{data.staff.find((s) => s.id === data.handover!.responderId)?.displayName}</strong>
                </span>
              </div>
            )}
            {canManage && (
              <>
                <hr className="divider" />
                {confirmClose ? (
                  <div className="row">
                    <span className="small strong">Zamknąć zdarzenie?</span>
                    <button className="btn btn-sm btn-danger" onClick={() => call(() => api(`/incidents/${incident.id}/status`, { method: 'POST', body: { to: 'closed' } }))}>
                      Tak, zamknij
                    </button>
                    <button className="btn btn-sm" onClick={() => setConfirmClose(false)}>
                      Anuluj
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-outline-red" onClick={() => setConfirmClose(true)}>
                    Zamknij zdarzenie
                  </button>
                )}
              </>
            )}
          </section>
        </div>
        <div className="panel-col">
          <section className="card">
            <CardHead
              icon={<ListChecks size={18} />}
              tone="green"
              title="Instrukcje"
              sub="Świadek widzi tylko zatwierdzone. Zmiana treści tworzy nową wersję."
            />
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
            <CardHead icon={<Route size={18} />} title="Oś czasu" sub="Najnowsze na górze" aside={<LiveDot tone="green" />} />
            <Timeline events={[...(timeline.data ?? [])].reverse()} fields={data.fields} instructions={data.instructions} staff={data.staff} />
          </section>
        </div>
      </div>
    </StaffShell>
  );
}
