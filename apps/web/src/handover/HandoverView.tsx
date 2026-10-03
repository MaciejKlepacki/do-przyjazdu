// Widok przekazania: ostatnie obserwacje z czasem zapisania, zatwierdzone instrukcje
// i rezultaty, wyposażenie, nierozwiązane trudności, braki informacji, okresy bez kontaktu,
// przycisk potwierdzenia przejęcia. Działa bez AI.
import type { HandoverReport, StaffUser } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  CircleCheck,
  CircleQuestionMark,
  ClipboardList,
  Handshake,
  Info,
  ListChecks,
  LoaderCircle,
  Package,
  Route,
  ServerCrash,
  Siren,
  Sparkles,
  TriangleAlert,
  Unplug,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAge } from '../components/StalenessLabel';
import { StaffShell } from '../components/StaffShell';
import { CardHead, DrawCheck, haptic, softSpring, Splash, useToast } from '../components/ui';
import { useAuth } from '../dispatcher/auth';
import { StatusBadge } from '../dispatcher/DispatcherHome';
import { FieldStateList } from '../dispatcher/ObservationReview';
import { Timeline } from '../dispatcher/Timeline';
import { api, errorMessage } from '../lib/api';
import { ACK_LABEL, EQUIPMENT_STATE_LABEL, OUTCOME_LABEL } from '../lib/labels';
import { usePolling } from '../lib/polling';
import { formatDuration, formatTime } from '../lib/time';
import { StateIcon } from '../witness/CurrentActionScreen';
import { AiDraftPanel } from './AiDraftPanel';

export function HandoverView() {
  const id = useParams().id ?? '';
  const { me } = useAuth();
  const toast = useToast();
  const report = usePolling(() => api<HandoverReport>(`/incidents/${id}/handover`), 5000, [id]);
  const staffList = usePolling(() => api<StaffUser[]>('/auth/accounts'), 60_000);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastInfo = useAge(report.data?.lastReceivedAt, 180);

  const r = report.data;
  if (!r) {
    return report.error ? (
      <Splash icon={<ServerCrash size={34} />} tone="red" title="Nie udało się wczytać raportu">
        <p>{report.error}</p>
      </Splash>
    ) : (
      <Splash title="Przygotowanie raportu…" />
    );
  }

  const staff = staffList.data ?? [];
  const name = (uid: string) => staff.find((s) => s.id === uid)?.displayName ?? uid;
  const instructionsAll = r.timeline.flatMap((e) => (e.type === 'instruction-approved' ? [e.data] : []));
  const canAccept = me.user.role === 'responder' && !r.handover && r.incident.status === 'open';
  const isLead = me.user.role === 'dispatcher' && me.user.id === r.incident.leadDispatcherId;
  const done = r.instructionOutcomes.filter((o) => o.state === 'done').length;
  const openIssues = r.openSituationReports.length + r.unresolvedDifficulties.length;
  const gapTotal = r.contactGaps.length;

  const cite = (ids: string[]) => {
    setHighlight(new Set(ids));
    document.getElementById(`entry-${ids[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => setHighlight(new Set()), 4000);
  };

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      const summary = r.aiDraft?.approvedAt ? r.aiDraft.text : null;
      await api(`/incidents/${id}/handover`, { method: 'POST', body: { approvedSummary: summary } });
      haptic([15, 60, 25]);
      toast({ tone: 'ok', icon: <Handshake size={17} />, title: 'Zdarzenie przejęte', detail: `${r.incident.id} · ${formatTime(new Date().toISOString())}` });
      await report.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StaffShell
      demo={r.incident.isDemo}
      crumbs={
        <>
          {me.user.role === 'dispatcher' ? (
            <Link to={`/dispatcher/${id}`} className="crumbs-hide-sm mono">
              {id}
            </Link>
          ) : (
            <Link to="/dispatcher" className="crumbs-hide-sm">
              Zdarzenia
            </Link>
          )}
          <ChevronRight size={14} className="crumbs-hide-sm" />
          <span className="current">Przekazanie</span>
        </>
      }
    >
      <motion.section className="handover-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        <div className="hh-top">
          <div>
            <p className="eyebrow">Przekazanie zdarzenia</p>
            <h1>{r.incident.id}</h1>
            <p className="desc">{r.incident.description}</p>
          </div>
          <StatusBadge status={r.incident.status} large />
        </div>
        <div className="hh-stats">
          <div className="hh-stat">
            <b>{lastInfo.text ?? 'brak'}</b>
            <span>Ostatnia informacja od świadka</span>
          </div>
          <div className="hh-stat">
            <b>
              {done}/{r.instructionOutcomes.length}
            </b>
            <span>Czynności wykonane</span>
          </div>
          <div className={openIssues ? 'hh-stat is-alert' : 'hh-stat'}>
            <b>{openIssues}</b>
            <span>Nierozwiązane trudności</span>
          </div>
          <div className={r.contactGaps.some((g) => g.ongoing) ? 'hh-stat is-alert' : 'hh-stat'}>
            <b>{gapTotal}</b>
            <span>Okresy bez kontaktu</span>
          </div>
        </div>
        <p className="hh-note">
          <Info size={14} /> Raport z {formatTime(r.generatedAt)}. Brak nowych informacji nie oznacza, że stan poszkodowanego się nie zmienił.
        </p>
      </motion.section>

      {report.error && (
        <div className="callout callout-red" style={{ marginBottom: '1rem' }}>
          <ServerCrash size={18} /> Brak połączenia z serwerem — dane mogą być nieaktualne.
        </div>
      )}

      <div className="panel-grid" style={{ paddingBottom: canAccept ? '6rem' : undefined }}>
        <div className="panel-col">
          {openIssues > 0 && (
            <section className="card alert-card">
              <CardHead icon={<TriangleAlert size={18} />} tone="red" title="Nierozwiązane trudności i zgłoszenia" />
              <ul className="alert-list">
                {r.openSituationReports.map((s) => (
                  <li key={s.entryId}>
                    <Siren size={17} />
                    <span>
                      <strong>Zmiana sytuacji ({formatTime(s.times.receivedTime)}):</strong> <span className="quote">{s.text}</span> — nieobsłużone
                    </span>
                  </li>
                ))}
                {r.unresolvedDifficulties.map((a) => {
                  const ins = r.approvedInstructions.find((i) => i.id === a.instructionId);
                  return (
                    <li key={a.entryId}>
                      <CircleQuestionMark size={17} />
                      <span>
                        <strong>
                          {ACK_LABEL[a.result]} ({formatTime(a.times.receivedTime)}):
                        </strong>{' '}
                        {ins?.text ?? a.instructionId}
                        {a.comment && (
                          <>
                            {' '}
                            — <span className="quote">{a.comment}</span>
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="card">
            <CardHead icon={<ClipboardList size={18} />} tone="blue" title="Stan według ostatnich odpowiedzi świadka" sub="Czas zapisu na telefonie i czas odbioru" />
            <FieldStateList fields={r.fields} fieldStates={r.fieldStates} timeMode="both" />
            {r.missingInformation.length > 0 && (
              <>
                <h3 className="section-label" style={{ marginTop: '1rem' }}>
                  Brakujące informacje
                </h3>
                <div className="row">
                  {r.missingInformation.map((m) => (
                    <span key={m.fieldKey} className="badge badge-orange">
                      {m.label.replace(/\?$/, '')} · {m.reason === 'unknown' ? 'świadek nie wie' : 'brak odpowiedzi'}
                    </span>
                  ))}
                </div>
              </>
            )}
            {r.latestObservations.some((o) => o.freeText) && (
              <>
                <h3 className="section-label" style={{ marginTop: '1rem' }}>
                  Ostatnie uwagi
                </h3>
                <ul className="notes-list">
                  {r.latestObservations
                    .filter((o) => o.freeText)
                    .map((o) => (
                      <li key={o.entryId} className="note">
                        <div className="note-meta">
                          {formatTime(o.times.receivedTime)} · {o.source === 'dispatcher-assessment' ? 'ocena prowadzącego' : 'świadek'}
                        </div>
                        <span className="quote">{o.freeText}</span>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </section>

          <section className="card">
            <CardHead icon={<ListChecks size={18} />} tone="green" title="Polecenia i rezultaty" />
            {r.approvedInstructions.length === 0 && <p className="hint">Nie zatwierdzono żadnych instrukcji.</p>}
            <ol className="list-group" style={{ boxShadow: 'none' }}>
              {r.approvedInstructions.map((i, n) => {
                const o = r.instructionOutcomes.find((x) => x.instructionId === i.id);
                const state = o?.state ?? 'awaiting';
                return (
                  <li key={i.id} className="ins-mini" style={{ cursor: 'default', alignItems: 'flex-start' }}>
                    <StateIcon state={state} n={n + 1} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="strong" style={{ fontSize: '0.94rem' }}>
                        {i.text}
                      </div>
                      <div className="row xsmall subtle" style={{ marginTop: '0.3rem', gap: '0.4rem' }}>
                        <span>
                          v{i.version} · zatwierdzono {formatTime(i.approvedAt)}
                          {o?.latest && ` · odpowiedź ${formatTime(o.latest.times.receivedTime)}`}
                        </span>
                        {i.packageId && <span className="badge badge-indigo">{i.packageId}</span>}
                      </div>
                      {o && o.olderVersionAcks.length > 0 && (
                        <div className="xsmall muted" style={{ marginTop: '0.25rem' }}>
                          Odpowiedzi do starszych wersji: {o.olderVersionAcks.map((a) => `v${a.instructionVersion} ${ACK_LABEL[a.result]}`).join(', ')}
                        </div>
                      )}
                    </div>
                    <span className={`badge ${state === 'done' ? 'badge-green' : state === 'awaiting' ? '' : state === 'cannot-do' ? 'badge-red' : 'badge-orange'}`}>
                      {OUTCOME_LABEL[state]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="card">
            <CardHead icon={<Package size={18} />} tone="indigo" title="Wyposażenie na miejscu" />
            {r.equipment.length === 0 ? (
              <p className="hint">Brak wpisów.</p>
            ) : (
              <ul className="equip-list">
                {r.equipment.map((e) => (
                  <li key={e.id} className="equip">
                    <span className="equip-icon">
                      <Package size={17} />
                    </span>
                    <div className="equip-body">
                      <strong>{e.name}</strong>
                      <span>{formatTime(e.times.receivedTime)}</span>
                    </div>
                    {e.packageId && <span className="badge badge-indigo">{e.packageId}</span>}
                    <span className={`badge ${e.state === 'unavailable' ? 'badge-red' : 'badge-green'}`}>{EQUIPMENT_STATE_LABEL[e.state]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <CardHead icon={<Unplug size={18} />} tone="orange" title="Okresy bez kontaktu" />
            {r.contactGaps.length === 0 ? (
              <p className="all-clear">
                <CircleCheck size={18} /> Nie odnotowano.
              </p>
            ) : (
              <ul className="gap-list">
                {r.contactGaps.map((g) => (
                  <li key={g.from} className={g.ongoing ? 'is-ongoing' : ''}>
                    <Unplug size={16} />
                    <span className="mono small">
                      {formatTime(g.from)} – {g.to ? formatTime(g.to) : 'trwa'}
                    </span>
                    <span className="spacer" />
                    <strong>{formatDuration(g.from, g.to)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card ai-card">
            <div className="card-head">
              <span className="ai-mark">
                <Sparkles size={17} />
              </span>
              <div>
                <h2>Szkic podsumowania</h2>
                <div className="card-sub">AI · opcjonalnie · wymaga zatwierdzenia prowadzącego</div>
              </div>
            </div>
            <AiDraftPanel incidentId={id} draft={r.aiDraft} available={r.aiAvailable} canApprove={isLead} onChange={() => void report.refresh()} onCite={cite} />
          </section>

          <AnimatePresence>
            {r.handover ? (
              <motion.section key="accepted" className="card accepted-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={softSpring}>
                <span className="celebrate-circle">
                  <DrawCheck size={30} />
                </span>
                <div>
                  <strong>Zdarzenie przejęte</strong>
                  <p className="muted small">
                    przez {name(r.handover.responderId)} o {formatTime(r.handover.acceptedAt)}
                  </p>
                </div>
              </motion.section>
            ) : (
              !canAccept && (
                <section className="card">
                  <p className="hint">Przejęcie potwierdza przydzielony ratownik.</p>
                </section>
              )
            )}
          </AnimatePresence>
        </div>
        <div className="panel-col">
          <section className="card timeline-sticky">
            <CardHead icon={<Route size={18} />} title="Przebieg" sub="Chronologicznie, od pierwszego wpisu" />
            <Timeline events={r.timeline} fields={r.fields} instructions={instructionsAll} staff={staff} highlight={highlight} />
          </section>
        </div>
      </div>

      <AnimatePresence>
        {canAccept && (
          <motion.div className="accept-bar" initial={{ y: 120, opacity: 0, x: '-50%' }} animate={{ y: 0, opacity: 1, x: '-50%' }} exit={{ y: 120, opacity: 0, x: '-50%' }} transition={softSpring}>
            <div className="accept-bar-text">
              <strong>Gotowy do przejęcia {r.incident.id}?</strong>
              <span>
                Zapisuje czas i osobę przejmującą.{r.aiDraft?.approvedAt ? ' Dołączony zostanie zatwierdzony szkic.' : ''}
                {error && <span className="error-text"> {error}</span>}
              </span>
            </div>
            <button className="btn btn-lg btn-success" disabled={busy} onClick={accept}>
              {busy ? <LoaderCircle size={18} className="spin" /> : <Handshake size={18} />} Potwierdzam przejęcie
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </StaffShell>
  );
}
