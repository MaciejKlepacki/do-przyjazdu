// Widok przekazania: ostatnie obserwacje z czasem zapisania, zatwierdzone instrukcje
// i rezultaty, wyposażenie, nierozwiązane trudności, braki informacji, okresy bez kontaktu,
// przycisk potwierdzenia przejęcia. Działa bez AI.
import type { HandoverReport, StaffUser } from '@do-przyjazdu/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DemoBanner } from '../components/DemoBanner';
import { StalenessLabel } from '../components/StalenessLabel';
import { useAuth } from '../dispatcher/auth';
import { Timeline } from '../dispatcher/Timeline';
import { api, errorMessage } from '../lib/api';
import { ACK_LABEL, EQUIPMENT_STATE_LABEL, OUTCOME_LABEL, STATUS_LABEL, answerText } from '../lib/labels';
import { usePolling } from '../lib/polling';
import { formatDuration, formatTime } from '../lib/time';
import { AiDraftPanel } from './AiDraftPanel';

export function HandoverView() {
  const id = useParams().id ?? '';
  const { me, logout } = useAuth();
  const report = usePolling(() => api<HandoverReport>(`/incidents/${id}/handover`), 5000, [id]);
  const staffList = usePolling(() => api<StaffUser[]>('/auth/accounts'), 60_000);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const r = report.data;
  if (!r) return <div className="page centered">{report.error ? <p className="error">{report.error}</p> : 'Ładowanie…'}</div>;

  const staff = staffList.data ?? [];
  const name = (uid: string) => staff.find((s) => s.id === uid)?.displayName ?? uid;
  const fieldMap = new Map(r.fields.map((f) => [f.key, f]));
  const instructionsAll = r.timeline.flatMap((e) => (e.type === 'instruction-approved' ? [e.data] : []));
  const canAccept = me.user.role === 'responder' && !r.handover && r.incident.status === 'open';
  const isLead = me.user.role === 'dispatcher' && me.user.id === r.incident.leadDispatcherId;

  const cite = (ids: string[]) => {
    setHighlight(new Set(ids));
    document.getElementById(`entry-${ids[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      const summary = r.aiDraft?.approvedAt ? r.aiDraft.text : null;
      await api(`/incidents/${id}/handover`, { method: 'POST', body: { approvedSummary: summary } });
      await report.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page handover">
      <DemoBanner visible={me.demoMode || r.incident.isDemo} />
      <header className="topbar">
        {me.user.role === 'dispatcher' ? (
          <Link to={`/dispatcher/${id}`} className="btn btn-small">
            ← Panel
          </Link>
        ) : (
          <Link to="/dispatcher" className="btn btn-small">
            ← Zdarzenia
          </Link>
        )}
        <h1>
          Przekazanie · {r.incident.id} <span className="chip chip-info">{STATUS_LABEL[r.incident.status]}</span>
        </h1>
        <span className="muted small">{me.user.displayName}</span>
        <button className="btn btn-small" onClick={() => void logout()}>
          Wyloguj
        </button>
      </header>
      {report.error && <div className="notice notice-bad">Brak połączenia z serwerem — dane mogą być nieaktualne.</div>}

      <section className="card">
        <p className="lead">{r.incident.description}</p>
        <div className="row wrap">
          <StalenessLabel prefix="Ostatnia informacja od świadka" at={r.lastReceivedAt} never="brak" staleAfterSeconds={180} />
          <span className="muted small">raport z {formatTime(r.generatedAt)}</span>
        </div>
        <p className="small muted">Brak nowych informacji nie oznacza, że stan poszkodowanego się nie zmienił.</p>
      </section>

      {(r.openSituationReports.length > 0 || r.unresolvedDifficulties.length > 0) && (
        <section className="card card-alert">
          <h2>Nierozwiązane trudności i zgłoszenia</h2>
          <ul>
            {r.openSituationReports.map((s) => (
              <li key={s.entryId}>
                <strong>Zmiana sytuacji ({formatTime(s.times.receivedTime)}):</strong> „{s.text}” — nieobsłużone
              </li>
            ))}
            {r.unresolvedDifficulties.map((a) => {
              const ins = r.approvedInstructions.find((i) => i.id === a.instructionId);
              return (
                <li key={a.entryId}>
                  <strong>{ACK_LABEL[a.result]}</strong> ({formatTime(a.times.receivedTime)}): {ins?.text ?? a.instructionId}
                  {a.comment && <> — „{a.comment}”</>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid">
        <div className="col">
          <section className="card">
            <h2>Stan według ostatnich odpowiedzi świadka</h2>
            <table className="field-table">
              <thead>
                <tr>
                  <th>Pytanie</th>
                  <th>Odpowiedź</th>
                  <th>Zapisano / odebrano</th>
                </tr>
              </thead>
              <tbody>
                {r.fieldStates.map((s) => {
                  const field = fieldMap.get(s.fieldKey);
                  return (
                    <tr key={s.fieldKey} className={!s.latest ? 'row-missing' : !s.latest.value.known ? 'row-unknown' : ''}>
                      <td>{s.label}</td>
                      <td>
                        {s.latest ? <strong>{answerText(field, s.latest.value)}</strong> : <span className="muted">brak odpowiedzi</span>}
                        {s.latest && !s.latest.value.known && s.lastKnown && (
                          <div className="small muted">
                            wcześniej: {answerText(field, s.lastKnown.value)} ({formatTime(s.lastKnown.times.receivedTime)})
                          </div>
                        )}
                      </td>
                      <td className="small">
                        {s.latest ? (
                          <>
                            {formatTime(s.latest.times.deviceTime)} / {formatTime(s.latest.times.receivedTime)}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {r.missingInformation.length > 0 && (
              <>
                <h3>Brakujące informacje</h3>
                <ul>
                  {r.missingInformation.map((m) => (
                    <li key={m.fieldKey}>
                      {m.label} — <span className="muted">{m.reason === 'unknown' ? 'świadek nie wie' : 'nie otrzymano odpowiedzi'}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {r.latestObservations.some((o) => o.freeText) && (
              <>
                <h3>Ostatnie uwagi</h3>
                <ul className="notes">
                  {r.latestObservations
                    .filter((o) => o.freeText)
                    .map((o) => (
                      <li key={o.entryId}>
                        <span className="muted small">
                          {formatTime(o.times.receivedTime)} · {o.source === 'dispatcher-assessment' ? 'ocena prowadzącego' : 'świadek'}
                        </span>{' '}
                        „{o.freeText}”
                      </li>
                    ))}
                </ul>
              </>
            )}
          </section>

          <section className="card">
            <h2>Polecenia i rezultaty</h2>
            {r.approvedInstructions.length === 0 && <p className="muted">Nie zatwierdzono żadnych instrukcji.</p>}
            <ol className="instructions">
              {r.approvedInstructions.map((i) => {
                const o = r.instructionOutcomes.find((x) => x.instructionId === i.id);
                return (
                  <li key={i.id} className="ins">
                    <div className="ins-head">
                      <span className={`chip outcome-${o?.state ?? 'awaiting'}`}>{OUTCOME_LABEL[o?.state ?? 'awaiting']}</span>
                      <span className="small muted">
                        v{i.version} · zatwierdzono {formatTime(i.approvedAt)}
                        {o?.latest && ` · odpowiedź ${formatTime(o.latest.times.receivedTime)}`}
                      </span>
                      {i.packageId && <span className="chip chip-info">{i.packageId}</span>}
                    </div>
                    <p className="ins-text">{i.text}</p>
                    {o && o.olderVersionAcks.length > 0 && (
                      <p className="small muted">Odpowiedzi do starszych wersji: {o.olderVersionAcks.map((a) => `v${a.instructionVersion} ${ACK_LABEL[a.result]}`).join(', ')}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="card">
            <h2>Wyposażenie na miejscu</h2>
            {r.equipment.length === 0 ? (
              <p className="muted">Brak wpisów.</p>
            ) : (
              <ul className="equipment">
                {r.equipment.map((e) => (
                  <li key={e.id}>
                    <strong>{e.name}</strong> — {EQUIPMENT_STATE_LABEL[e.state]} {e.packageId && <span className="chip chip-info">{e.packageId}</span>}
                    <span className="muted small"> · {formatTime(e.times.receivedTime)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Okresy bez kontaktu</h2>
            {r.contactGaps.length === 0 ? (
              <p className="muted">Nie odnotowano.</p>
            ) : (
              <ul>
                {r.contactGaps.map((g) => (
                  <li key={g.from} className={g.ongoing ? 'error' : ''}>
                    {formatTime(g.from)} – {g.to ? formatTime(g.to) : 'trwa'} ({formatDuration(g.from, g.to)})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Szkic podsumowania (AI, opcjonalnie)</h2>
            <AiDraftPanel incidentId={id} draft={r.aiDraft} available={r.aiAvailable} canApprove={isLead} onChange={() => void report.refresh()} onCite={cite} />
          </section>

          <section className="card card-accept">
            {r.handover ? (
              <p>
                <strong>Zdarzenie przejęte</strong> przez {name(r.handover.responderId)} o {formatTime(r.handover.acceptedAt)}.
              </p>
            ) : canAccept ? (
              <>
                <button className="btn btn-primary btn-large" disabled={busy} onClick={accept}>
                  Potwierdzam przejęcie zdarzenia
                </button>
                <p className="small muted">Zapisuje czas i osobę przejmującą. {r.aiDraft?.approvedAt ? 'Dołączony zostanie zatwierdzony szkic.' : ''}</p>
              </>
            ) : (
              <p className="muted">Przejęcie potwierdza przydzielony ratownik.</p>
            )}
            {error && <p className="error">{error}</p>}
          </section>
        </div>
        <div className="col">
          <section className="card">
            <h2>Przebieg (chronologicznie)</h2>
            <Timeline events={r.timeline} fields={r.fields} instructions={instructionsAll} staff={staff} highlight={highlight} />
          </section>
        </div>
      </div>
    </div>
  );
}

