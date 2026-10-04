import type { HandoverReport, Incident, IncidentPanelResponse, TimelineEvent, WitnessLinkCreated } from '@do-przyjazdu/shared';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, ClipboardList, Eye, LoaderCircle, Plus, Radio, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo, plural, Splash } from '../components/ui';
import { useAuth } from '../dispatcher/auth';
import { InstructionList } from '../dispatcher/InstructionList';
import { FieldStateList } from '../dispatcher/ObservationReview';
import { ReviewQueue } from '../dispatcher/ReviewQueue';
import { Timeline } from '../dispatcher/Timeline';
import { api, errorMessage } from '../lib/api';
import { OUTCOME_LABEL } from '../lib/labels';
import { useNow, usePolling } from '../lib/polling';
import { formatTime } from '../lib/time';
import { WitnessApp } from '../witness/WitnessApp';
import { SignalLandscape } from '../brand/SignalLandscape';
import './demo.css';

interface DemoSession { incidentId: string; token: string; startedAt: number }
type View = 'contact' | 'instructions' | 'timeline' | 'handover';
const views: { id: View; label: string }[] = [{ id: 'contact', label: 'Sytuacja' }, { id: 'instructions', label: 'Polecenia' }, { id: 'timeline', label: 'Historia' }, { id: 'handover', label: 'Przekazanie' }];

function savedDemo(): DemoSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem('dp-presentation') ?? 'null');
    return value && typeof value.incidentId === 'string' && typeof value.token === 'string' && typeof value.startedAt === 'number' ? value : null;
  } catch { return null; }
}

export function DemoStudio() {
  const { me } = useAuth();
  const [session, setSession] = useState<DemoSession | null>(savedDemo);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const incident = await api<Incident>('/incidents', { method: 'POST', body: { description: 'Szlak w rejonie Doliny Pięciu Stawów (fikcyjne). Dwie osoby, jedna po upadku na szlaku, druga wezwała pomoc. Pogoda pogarsza się.' } });
      const link = await api<WitnessLinkCreated>(`/incidents/${incident.id}/witness-links`, { method: 'POST' });
      await api(`/incidents/${incident.id}/responders`, { method: 'POST', body: { responderId: 'ratownik' } });
      const next = { incidentId: incident.id, token: link.token, startedAt: Date.now() };
      setSession(next);
      try { sessionStorage.setItem('dp-presentation', JSON.stringify(next)); } catch { /*brak pamieci sesji*/ }
    } catch (err) { setError(errorMessage(err)); }
    finally { setCreating(false); }
  };

  if (!me.demoMode || me.user.role !== 'dispatcher') return <Splash title="Pokaz prowadzi dyspozytor">
    <p>Ten widok jest dostępny dla dyspozytora w trybie demonstracyjnym.</p>
    <Link to="/dispatcher" className="btn btn-primary">Przejdź do panelu</Link>
  </Splash>;
  return (
    <div className="demo-studio">
      <header className="studio-nav">
        <Link to="/" className="brand">
          <Logo size={34} />
          <span className="brand-name">Do przyjazdu<span className="wordmark-stop">.</span>
          </span>
        </Link>
        <span className="studio-mode">Pokaz na fikcyjnych danych</span>
        <Link to="/dispatcher" className="brand-text-link">Panel zespołu <ArrowUpRight size={16} />
        </Link>
      </header>
      {!session ? <main className="studio-start">
        <div className="studio-start-hero">
          <SignalLandscape />
          <div className="studio-start-copy">
            <p>Pokaz na działającej aplikacji.</p>
            <h1>Zobacz, co zostaje,<br /><span>gdy znika połączenie.</span></h1>
            <p className="studio-start-description">Obsługujesz telefon świadka i centralę na jednym ekranie. Zapisujesz obserwację, przerywasz transmisję i sprawdzasz, co dociera do ratownika.</p>
            <button className="brand-button" disabled={creating} onClick={() => void create()}>{creating ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />} Rozpocznij pokaz</button>
            <p className="studio-start-note">Działająca aplikacja · Fikcyjne zdarzenie · Około 3 minut</p>
          </div>
        </div>
        <div className="studio-start-sequence">
          <div><span>01</span><h2>Zapisz i potwierdź.</h2><p>Obserwacja trafia do centrali. Polecenie wraca na telefon.</p></div>
          <div><span>02</span><h2>Wstrzymaj transmisję.</h2><p>Kolejny wpis czeka lokalnie, aż przywrócisz transmisję.</p></div>
          <div><span>03</span><h2>Zobacz całą historię.</h2><p>Wpis dociera do raportu. Wraz z czasem zapisu i odbioru.</p></div>
        </div>
        <p className="hint">Każda próba tworzy nowe fikcyjne zdarzenie. Poprzednia historia zostaje w panelu.</p>
      </main> : <LiveDemo key={session.incidentId} session={session} onNew={create} creating={creating} />}
      {error && <p className="studio-error error-text" role="alert">{error}</p>}
    </div>
  );
}

function LiveDemo({ session, onNew, creating }: { session: DemoSession; onNew: () => Promise<void>; creating: boolean }) {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [pending, setPending] = useState(0);
  const [view, setView] = useState<View>('contact');
  const [offlineIds, setOfflineIds] = useState<string[]>([]);
  const [resynced, setResynced] = useState(false);
  const [reportRead, setReportRead] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const now = useNow(1000);
  const panel = usePolling(() => api<IncidentPanelResponse>(`/incidents/${session.incidentId}`), 2000, [session.incidentId]);
  const timeline = usePolling(() => api<TimelineEvent[]>(`/incidents/${session.incidentId}/timeline`), 2000, [session.incidentId]);
  const report = usePolling(() => api<HandoverReport>(`/incidents/${session.incidentId}/handover`), 2000, [session.incidentId]);
  const data = panel.data;
  const elapsed = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const refresh = () => { void panel.refresh(); void timeline.refresh(); void report.refresh(); };
  const queueChanged = useCallback((pendingIds: string[], receivedIds: string[]) => {
    setPending(pendingIds.length);
    if (paused && pendingIds.length > 0) setOfflineIds(previous => pendingIds.every(id => previous.includes(id)) ? previous : [...new Set([...previous, ...pendingIds])]);
    if (!paused && offlineIds.length > 0 && offlineIds.every(id => receivedIds.includes(id))) setResynced(true);
  }, [paused, offlineIds]);
  const steps = [
    { label: 'Obserwacja', done: Boolean(data?.observations.some(o => o.author.kind === 'witness')) },
    { label: 'Polecenie', done: Boolean(data?.instructions.some(i => i.status === 'approved')) },
    { label: 'Odpowiedź', done: Boolean(data?.acknowledgements.length) },
    { label: 'Powrót łączności', done: resynced },
    { label: 'Odczyt raportu', done: reportRead && Boolean(report.data) && !report.error },
  ];
  const nextStep = steps.findIndex(s => !s.done);
  const guide = [
    'Dołącz na telefonie i zapisz pierwszą obserwację.',
    'Otwórz Polecenia. Zatwierdź pierwszą instrukcję w centrali.',
    'Na telefonie wybierz Czynność i odpowiedz na polecenie.',
    'Wstrzymaj transmisję, zapisz obserwację, potem przywróć połączenie.',
    'Otwórz Przekazanie. Odczytaj historię, oba czasy i braki informacji.',
  ][nextStep] ?? 'Przepływ pokazany. Pełny raport i przejęcie są dostępne w panelu zespołu.';
  const witnessUrl = `${window.location.origin}/w/${session.token}`;

  return (
    <main className="studio-live">
      <div className="studio-title">
        <div>
          <p>Fikcyjne zdarzenie na szlaku · Telefon świadka + centrala</p>
          <h1>Jedna historia. Krok po kroku.</h1>
        </div>
        <div className="studio-timer">
          <span>Próba pokazu</span>
          <strong>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</strong>
        </div>
      </div>
      <ol className="studio-steps">{steps.map((step, n) =>
        <li key={step.label} aria-current={n === nextStep ? 'step' : undefined} className={step.done ? 'is-done' : n === nextStep ? 'is-current' : ''}>
          <span>{step.done ? <Check size={14} /> : String(n + 1).padStart(2, '0')}</span>{step.label}</li>)}</ol>
      <p className="studio-guide"><ArrowRight size={15} /><span>{guide}</span></p>
      <div className={`demo-signal-strip ${panel.error ? 'signal-error' : paused ? 'signal-waiting' : resynced && pending === 0 ? 'signal-received' : ''}`} role="status" aria-live="polite">
        <div className="signal-source"><Smartphone size={21} strokeWidth={1.5} /><div><span>Telefon świadka</span><strong>{pending ? `${pending} ${plural(pending, 'wpis czeka', 'wpisy czekają', 'wpisów czeka')}` : 'Brak oczekujących wpisów'}</strong></div></div>
        <div className="signal-bridge"><i aria-hidden="true" /><span>{panel.error ? <WifiOff size={17} /> : paused ? <WifiOff size={17} /> : pending ? <LoaderCircle size={17} className="spin" /> : resynced ? <Check size={17} /> : <Wifi size={17} />}{panel.error ? 'Brak odświeżenia danych' : paused ? 'Transmisja wstrzymana' : pending ? 'Wpisy czekają na odbiór' : resynced ? 'Odbiór potwierdzony' : 'Transmisja włączona'}</span><i aria-hidden="true" /></div>
        <div className="signal-target"><Radio size={21} strokeWidth={1.5} /><div><span>Centrala</span><strong>{panel.error ? 'Dane mogą być nieaktualne' : `${data?.observations.filter(o => o.author.kind === 'witness').length ?? 0} ${plural(data?.observations.filter(o => o.author.kind === 'witness').length ?? 0, 'obserwacja', 'obserwacje', 'obserwacji')}`}</strong></div></div>
      </div>
      <div className="demo-workspace">
        <section className="demo-witness" aria-label="Telefon świadka">
          <div className="demo-pane-title">
            <h2><span className="demo-role-number">01</span> Na miejscu</h2>
            <span>Telefon świadka</span>
          </div>
          <div className="demo-phone">
            <WitnessApp witnessToken={session.token} connectionPaused={paused} embedded onQueueChange={queueChanged} />
          </div>
          <div className="demo-transport">
            <button className={`btn ${paused ? 'btn-tint-orange' : 'btn-outline'}`} onClick={() => setPaused(p => !p)}>{paused ? <Wifi size={16} /> : <WifiOff size={16} />}{paused ? 'Przywróć transmisję' : 'Wstrzymaj transmisję'}</button>
            <p>Symulacja przerwy tylko dla tego telefonu. {paused ? `${pending} ${plural(pending, 'wpis czeka', 'wpisy czekają', 'wpisów czeka')} lokalnie.` : 'Centrala pozostaje połączona.'}</p>
          </div>
          <div className="demo-phone-links">
            <a href={witnessUrl} target="_blank" rel="noreferrer">Otwórz osobno <ArrowUpRight size={14} />
            </a>
            <button onClick={async () => { try { await navigator.clipboard.writeText(witnessUrl); setCopyError(false); } catch { setCopyError(true); } }}>Kopiuj link na telefon</button>
          </div>{copyError && <p className="hint" role="alert">Kopiowanie niedostępne. Otwórz widok osobno i skopiuj adres.</p>}
        </section>
        <section className="demo-central" aria-label="Panel centrali">
          <div className="demo-pane-title">
            <h2><span className="demo-role-number">02</span> W centrali</h2>
            <Link to={`/dispatcher/${session.incidentId}`}>{session.incidentId} <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="demo-central-body">
            <div className="demo-central-status">
              <Radio size={17} />
              <strong>{data?.contact.ongoingGapSince ? 'Brak kontaktu z telefonem' : data?.contact.lastWitnessContactAt ? 'Telefon nawiązał kontakt' : 'Czekamy na świadka'}</strong>
              <span>{data?.contact.lastWitnessContactAt ? `ostatni kontakt ${formatTime(data.contact.lastWitnessContactAt)}` : 'Link gotowy do otwarcia'}</span>
            </div>
            {panel.error && <p className="callout callout-red" role="alert">{panel.error} Dane mogą być nieaktualne.</p>}
            <div className="demo-counters">
              <div>
                <DemoCounter value={data?.observations.filter(o => o.author.kind === 'witness').length ?? 0} />
                <span>Obserwacje</span>
              </div>
              <div>
                <DemoCounter value={`${data?.instructionOutcomes.filter(o => o.state === 'done').length ?? 0}/${data?.instructionOutcomes.length ?? 0}`} />
                <span>Wykonane czynności</span>
              </div>
              <div>
                <DemoCounter value={data?.situationReports.filter(r => !r.reviewedAt).length ?? 0} />
                <span>Do przeglądu</span>
              </div>
            </div>
            <div className="demo-view-tabs" role="tablist" aria-label="Widoki centrali">{views.map(v =>
              <button key={v.id} role="tab" id={`demo-tab-${v.id}`} aria-selected={view === v.id} aria-controls="demo-central-content" onClick={() => { setView(v.id); if (v.id === 'handover') setReportRead(true); }}>{v.label}</button>)}</div>
            <div className="demo-central-content" id="demo-central-content" role="tabpanel" aria-labelledby={`demo-tab-${view}`} tabIndex={0}>
              {!data ? <p className="hint">Pobieranie danych…</p> : <motion.div key={view} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24, ease: [.2, .8, .2, 1] }}>
                {view === 'contact' && <>
                  <h3><Eye size={17} /> Ostatnie wpisy</h3>
                  {!data.observations.some(o => o.freeText) && <div className="demo-note-empty"><span>Historia zaczyna się na telefonie.</span><p>Zapisz pierwszą obserwację po lewej. Tutaj zobaczysz ją po odbiorze.</p></div>}
                  {data.observations.filter(o => o.freeText).slice(-3).reverse().map(o =>
                    <motion.div className="demo-note" key={o.entryId} initial={reducedMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .32, ease: [.2, .8, .2, 1] }}>
                      <span className="quote">{o.freeText}</span>
                      <small>zapisano {formatTime(o.times.deviceTime)} · odebrano {formatTime(o.times.receivedTime)}</small>
                    </motion.div>)}
                  <h3>Ostatnie odpowiedzi świadka</h3>
                  <FieldStateList fields={data.fields} fieldStates={data.fieldStates} timeMode="both" />
                  <h3>Zmiany wymagające przeglądu</h3>
                  <ReviewQueue reports={data.situationReports} sms={data.sms} canManage onChange={refresh} />
                </>}
                {view === 'instructions' && <>
                  <p className="demo-medical-note">Robocze treści demonstracyjne. Lekarz z zespołu zatwierdza scenariusz przed pokazem.</p>
                  <InstructionList incidentId={session.incidentId} instructions={data.instructions} outcomes={data.instructionOutcomes} acknowledgements={data.acknowledgements} staff={data.staff} canManage onChange={refresh} />
                </>}
                {view === 'timeline' && <>
                  <h3>Wspólna historia zdarzenia</h3>{timeline.error && <p className="error-text">{timeline.error}</p>}<Timeline events={timeline.data ?? []} fields={data.fields} instructions={data.instructions} staff={data.staff} />
                </>}
                {view === 'handover' && <>
                  <h3>
                    <ClipboardList size={17} /> Raport dla ratownika</h3>{report.error && <p className="error-text">{report.error} Raport może być nieaktualny.</p>}{report.data ? <DemoReport report={report.data} /> : <p className="hint">Pobieranie raportu…</p>}<Link className="btn btn-primary" to={`/handover/${session.incidentId}`}>Otwórz pełny raport <ArrowUpRight size={16} />
                  </Link>
                  <p className="hint">Przejęcie potwierdza przydzielony ratownik na swoim koncie.</p>
                </>}
              </motion.div>}
            </div>
          </div>
        </section>
      </div>
      <footer className="studio-live-footer">
        <p>Wpisy trafiają do tej samej bazy. Zapis na telefonie i odbiór w centrali to osobne zdarzenia.</p>
        <button className="btn btn-outline btn-sm" disabled={creating} onClick={() => void onNew()}>{creating ? <LoaderCircle size={14} className="spin" /> : <Plus size={14} />} Nowa próba pokazu</button>
      </footer>
    </main>
  );
}

function DemoCounter({ value }: { value: string | number }) {
  const reducedMotion = useReducedMotion();
  return <motion.strong key={value} initial={reducedMotion ? false : { opacity: .4, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>{value}</motion.strong>;
}

function DemoReport({ report }: { report: HandoverReport }) {
  const reducedMotion = useReducedMotion();
  return <div className="demo-report">
    <div className="demo-report-summary"><span>Historia gotowa do odczytu</span><strong>Co się wydarzyło.<br />Co wykonano. Czego nie wiemy.</strong><p>Raport z {formatTime(report.generatedAt)} · Na podstawie otrzymanych wpisów.</p></div>
    <FieldStateList fields={report.fields} fieldStates={report.fieldStates} timeMode="both" />
    <h3>Polecenia i rezultaty</h3>{report.approvedInstructions.length === 0 && <p className="hint">Brak zatwierdzonych poleceń.</p>}{report.approvedInstructions.map(i =>
      <div key={i.id} className="demo-report-instruction">
        <p>{i.text}</p>
        <strong>{OUTCOME_LABEL[report.instructionOutcomes.find(o => o.instructionId === i.id)?.state ?? 'awaiting']}</strong>
      </div>)}<h3>Co nadal wymaga uwagi</h3>
    <p>{report.missingInformation.length} pól bez znanej odpowiedzi · {report.unresolvedDifficulties.length} trudności · {report.openSituationReports.length} zgłoszeń bez przeglądu · {report.contactGaps.length} przerw w kontakcie</p>{report.latestObservations.filter(o => o.freeText).map(o =>
      <motion.div className="demo-note" key={o.entryId} initial={reducedMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .32 }}>
        <span className="quote">{o.freeText}</span>
        <small>telefon {formatTime(o.times.deviceTime)} · centrala {formatTime(o.times.receivedTime)}</small>
      </motion.div>)}</div>;
}
