// Lista zdarzeń, utworzenie sesji, kolejka SMS-ów do ręcznej weryfikacji.
import type { InboundSms, Incident, IncidentSummary } from '@do-przyjazdu/shared';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, FlaskConical, Inbox, LoaderCircle, MessageSquareWarning, Plus, Radio } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAge } from '../components/StalenessLabel';
import { StaffShell } from '../components/StaffShell';
import { CardHead, EmptyState, LiveDot, softSpring } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { STATUS_LABEL } from '../lib/labels';
import { usePolling } from '../lib/polling';
import { formatDateTime, formatTime } from '../lib/time';
import { useAuth } from './auth';
import { SmsSimulator } from './SmsSimulator';

export function StatusBadge({ status, large = false }: { status: IncidentSummary['status']; large?: boolean }) {
  const tone = status === 'open' ? 'badge-green' : status === 'handed-over' ? 'badge-blue' : '';
  return (
    <span className={`badge ${tone}${large ? ' badge-lg' : ''}`}>
      {status === 'open' && <LiveDot tone="green" />}
      {STATUS_LABEL[status]}
    </span>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 || h >= 19 ? 'Dobry wieczór' : 'Dzień dobry';
}

export function DispatcherHome() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const isDispatcher = me.user.role === 'dispatcher';
  const { data: incidents, error, refresh } = usePolling(() => api<IncidentSummary[]>('/incidents'));
  const unassigned = usePolling(() => (isDispatcher ? api<InboundSms[]>('/sms/unassigned') : Promise.resolve([])));
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const incident = await api<Incident>('/incidents', { method: 'POST', body: { description } });
      navigate(`/dispatcher/${incident.id}`);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const open = incidents?.filter((i) => i.status === 'open').length ?? 0;
  return (
    <StaffShell>
      <motion.section className="page-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="display">
            {greeting()}, {me.user.displayName.split(' ')[0]}
          </h1>
          <p className="muted">
            {isDispatcher
              ? open > 0
                ? `Prowadzisz ${open} ${open === 1 ? 'otwarte zdarzenie' : 'otwarte zdarzenia'}.`
                : 'Brak otwartych zdarzeń.'
              : 'Zdarzenia przydzielone Ci do przejęcia.'}
          </p>
        </div>
      </motion.section>
      {error && (
        <div className="callout callout-red" style={{ marginBottom: '1rem' }}>
          <Radio size={18} /> Brak połączenia z serwerem: {error}
        </div>
      )}

      <div className="home-grid">
        <section>
          <div className="section-head">
            <h2>{isDispatcher ? 'Prowadzone zdarzenia' : 'Przydzielone zdarzenia'}</h2>
            {incidents && <span className="badge">{incidents.length}</span>}
          </div>
          {incidents?.length === 0 && (
            <div className="card">
              <EmptyState icon={<Inbox size={26} />} title="Brak zdarzeń">
                {isDispatcher ? 'Utwórz nową sesję zdarzenia obok.' : 'Gdy prowadzący przydzieli Ci zdarzenie, pojawi się tutaj.'}
              </EmptyState>
            </div>
          )}
          <div className="incident-cards">
            {incidents?.map((i, n) => (
              <motion.div key={i.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: n * 0.05 }}>
                <IncidentCard incident={i} href={isDispatcher ? `/dispatcher/${i.id}` : `/handover/${i.id}`} />
              </motion.div>
            ))}
          </div>
        </section>

        {isDispatcher && (
          <aside className="panel-col">
            <section className="card">
              <CardHead icon={<Plus size={18} />} tone="blue" title="Nowa sesja zdarzenia" sub="Pola formularza i szkice instrukcji ze scenariusza" />
              <form onSubmit={create} className="new-incident-form">
                <textarea
                  rows={2}
                  placeholder="Krótki opis, bez nazwisk (np. upadek na szlaku, 2 osoby)"
                  value={description}
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <button className="btn btn-primary btn-lg" disabled={description.trim().length < 3 || creating}>
                  {creating ? <LoaderCircle size={18} className="spin" /> : <Plus size={18} />} Utwórz zdarzenie
                </button>
                <p className="hint">Świadek zobaczy instrukcję dopiero po zatwierdzeniu.</p>
                {formError && <p className="error-text">{formError}</p>}
              </form>
            </section>

            <section className="card">
              <CardHead
                icon={<MessageSquareWarning size={18} />}
                tone="orange"
                title="SMS-y do ręcznej weryfikacji"
                sub="Bez rozpoznanego zdarzenia — nie są dopisywane automatycznie"
                aside={unassigned.data?.length ? <span className="count-bubble">{unassigned.data.length}</span> : undefined}
              />
              {unassigned.data?.length === 0 && <p className="all-clear">Brak wiadomości do sprawdzenia.</p>}
              <div>
                {unassigned.data?.map((s) => (
                  <UnassignedSms
                    key={s.id}
                    sms={s}
                    incidents={incidents ?? []}
                    onDone={() => {
                      void unassigned.refresh();
                      void refresh();
                    }}
                  />
                ))}
              </div>
              {me.demoMode && (
                <SmsSimulator
                  onSent={() => {
                    void unassigned.refresh();
                    void refresh();
                  }}
                />
              )}
            </section>
          </aside>
        )}
      </div>
    </StaffShell>
  );
}

function IncidentCard({ incident: i, href }: { incident: IncidentSummary; href: string }) {
  const age = useAge(i.lastReceivedAt, 180);
  return (
    <Link to={href} className="incident-card">
      <div className="ic-top">
        <span className="ic-id">{i.id}</span>
        <StatusBadge status={i.status} />
        {i.isDemo && (
          <span className="badge">
            <FlaskConical size={12} /> demo
          </span>
        )}
        {i.openReviews > 0 && <span className="badge badge-solid-red">{i.openReviews} do przeglądu</span>}
      </div>
      <p className="ic-desc">{i.description}</p>
      <div className="ic-foot">
        <span className="row" style={{ gap: '0.4rem' }}>
          <LiveDot tone={!i.lastReceivedAt ? 'gray' : age.stale ? 'orange' : 'green'} pulse={!age.stale && Boolean(i.lastReceivedAt)} />
          <span className={age.stale ? 'is-stale' : undefined}>Ostatni wpis świadka: {age.text ?? 'brak'}</span>
        </span>
        <span>· utworzono {formatDateTime(i.createdAt)}</span>
        <ChevronRight size={20} className="ic-arrow" />
      </div>
    </Link>
  );
}

function UnassignedSms({ sms, incidents, onDone }: { sms: InboundSms; incidents: IncidentSummary[]; onDone: () => void }) {
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="inbox-item">
      <div className="row">
        <span className="xsmall subtle">odebrano {formatTime(sms.receivedTime)}</span>
        {sms.isSimulated && <span className="badge">symulacja</span>}
        {sms.claimedIncidentId && <span className="badge badge-orange">wskazane: {sms.claimedIncidentId} (nie istnieje)</span>}
      </div>
      <pre className="sms-raw">{sms.rawText}</pre>
      <div className="inline-form" style={{ marginTop: 0 }}>
        <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ flex: '1 1 12rem' }}>
          <option value="">Przypisz ręcznie do zdarzenia…</option>
          {incidents.map((i) => (
            <option key={i.id} value={i.id}>
              {i.id} · {i.description.slice(0, 40)}
            </option>
          ))}
        </select>
        <button
          className="btn btn-sm btn-tint-blue"
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
          Przypisz <ArrowRight size={14} />
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
