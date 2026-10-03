// Lista instrukcji: zatwierdzenie, zmiana treści (nowa wersja), wycofanie.
// Widoczny autor, wersja i czas zatwierdzenia.
import type { Acknowledgement, Instruction, InstructionOutcome, StaffUser } from '@do-przyjazdu/shared';
import { useState } from 'react';
import { api, errorMessage } from '../lib/api';
import { OUTCOME_LABEL } from '../lib/labels';
import { formatTime } from '../lib/time';

interface Props {
  incidentId: string;
  instructions: Instruction[];
  outcomes: InstructionOutcome[];
  acknowledgements: Acknowledgement[];
  staff: StaffUser[];
  canManage: boolean;
  onChange: () => void;
}

interface Group {
  id: string;
  versions: Instruction[];
  latest: Instruction;
  live: Instruction | null;
}

function group(instructions: Instruction[]): Group[] {
  const map = new Map<string, Instruction[]>();
  for (const i of instructions) map.set(i.id, [...(map.get(i.id) ?? []), i]);
  return [...map.entries()]
    .map(([id, versions]) => {
      const sorted = versions.sort((a, b) => a.version - b.version);
      const approved = sorted.filter((v) => v.status === 'approved');
      return { id, versions: sorted, latest: sorted.at(-1)!, live: approved.at(-1) ?? null };
    })
    .sort((a, b) => a.latest.sortOrder - b.latest.sortOrder);
}

export function InstructionList({ incidentId, instructions, outcomes, acknowledgements, staff, canManage, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [newText, setNewText] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const name = (id: string) => staff.find((s) => s.id === id)?.displayName ?? (id === 'scenariusz-roboczy' ? 'scenariusz (roboczy)' : id);

  const call = async (fn: () => Promise<unknown>) => {
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
      {error && <p className="error">{error}</p>}
      <ol className="instructions">
        {group(instructions).map((g, n) => {
          const outcome = outcomes.find((o) => o.instructionId === g.id);
          const latestAck = outcome?.latest ? acknowledgements.find((a) => a.entryId === outcome.latest!.entryId) : undefined;
          const withdrawn = g.latest.status === 'withdrawn';
          const pendingDraft = g.latest.status === 'draft' ? g.latest : null;
          return (
            <li key={g.id} className={`ins ins-${g.live ? 'live' : withdrawn ? 'withdrawn' : 'draft'}`}>
              <div className="ins-head">
                <span className="ins-num">{n + 1}</span>
                {g.live ? (
                  <span className="chip chip-ok">u świadka: v{g.live.version}</span>
                ) : withdrawn ? (
                  <span className="chip">wycofana</span>
                ) : (
                  <span className="chip chip-warn">szkic — świadek nie widzi</span>
                )}
                {g.latest.packageId && <span className="chip chip-info">{g.latest.packageId}</span>}
                {outcome && <span className={`chip outcome-${outcome.state}`}>{OUTCOME_LABEL[outcome.state]}</span>}
                {outcome && outcome.olderVersionAcks.length > 0 && outcome.state === 'awaiting' && (
                  <span className="chip chip-warn">odpowiedź tylko do starszej wersji</span>
                )}
              </div>
              <p className="ins-text">{(g.live ?? g.latest).text}</p>
              {g.live && (
                <p className="small muted">
                  v{g.live.version} zatwierdził {g.live.approvedBy?.kind === 'dispatcher' ? name(g.live.approvedBy.userId) : '—'} o {formatTime(g.live.approvedAt)}
                  {' · '}autor: {name(g.live.authorId)}
                </p>
              )}
              {latestAck?.comment && <p className="quote">Świadek: „{latestAck.comment}”</p>}
              {pendingDraft && g.live && (
                <div className="notice notice-warn small">
                  Nowa wersja v{pendingDraft.version} czeka na zatwierdzenie: „{pendingDraft.text}”
                </div>
              )}
              {g.versions.length > 1 && (
                <details className="small">
                  <summary>Historia wersji ({g.versions.length})</summary>
                  <ul>
                    {g.versions.map((v) => (
                      <li key={v.version}>
                        v{v.version} · {v.status === 'approved' ? `zatwierdzona ${formatTime(v.approvedAt)}` : v.status === 'withdrawn' ? `wycofana ${formatTime(v.withdrawnAt)}` : 'szkic'} ·{' '}
                        {v.text}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {canManage && editing === g.id && (
                <div className="edit">
                  <textarea rows={3} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
                  <div className="row">
                    <button
                      className="btn btn-small btn-primary"
                      disabled={!draftText.trim()}
                      onClick={() =>
                        call(async () => {
                          await api(`/instructions/${g.id}`, { method: 'PATCH', body: { text: draftText } });
                          setEditing(null);
                        })
                      }
                    >
                      Zapisz jako nową wersję (szkic)
                    </button>
                    <button className="btn btn-small" onClick={() => setEditing(null)}>
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
              {canManage && editing !== g.id && (
                <div className="row wrap">
                  {pendingDraft && (
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => call(() => api(`/instructions/${g.id}/approve`, { method: 'POST', body: { version: pendingDraft.version } }))}
                    >
                      Zatwierdź v{pendingDraft.version}
                    </button>
                  )}
                  <button
                    className="btn btn-small"
                    onClick={() => {
                      setEditing(g.id);
                      setDraftText(g.latest.text);
                    }}
                  >
                    Zmień treść
                  </button>
                  {!withdrawn && (g.live || pendingDraft) && (
                    <button className="btn btn-small btn-bad-outline" onClick={() => call(() => api(`/instructions/${g.id}/withdraw`, { method: 'POST' }))}>
                      Wycofaj
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {canManage && (
        <div className="card-inner">
          <h3>Nowa instrukcja (szkic)</h3>
          <textarea rows={2} placeholder="Jedna czynność, prostym językiem" value={newText} onChange={(e) => setNewText(e.target.value)} />
          <div className="row">
            <input placeholder="Pakiet (opcjonalnie)" value={newPackage} onChange={(e) => setNewPackage(e.target.value)} />
            <button
              className="btn btn-small"
              disabled={!newText.trim()}
              onClick={() =>
                call(async () => {
                  await api(`/incidents/${incidentId}/instructions`, { method: 'POST', body: { text: newText, packageId: newPackage || null } });
                  setNewText('');
                  setNewPackage('');
                })
              }
            >
              Dodaj szkic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
