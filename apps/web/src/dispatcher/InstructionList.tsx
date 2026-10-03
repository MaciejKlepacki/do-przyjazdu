// Lista instrukcji: zatwierdzenie, zmiana treści (nowa wersja), wycofanie.
// Widoczny autor, wersja i czas zatwierdzenia.
import type { Acknowledgement, Instruction, InstructionOutcome, StaffUser } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Check, Eye, EyeOff, Package, Pencil, Plus, Send, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import { softSpring } from '../components/ui';
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

const OUTCOME_TONE = { awaiting: '', done: 'badge-green', 'cannot-do': 'badge-red', 'needs-clarification': 'badge-orange' } as const;

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
      {error && <p className="error-text">{error}</p>}
      <ol className="ins-list">
        {group(instructions).map((g, n) => {
          const outcome = outcomes.find((o) => o.instructionId === g.id);
          const latestAck = outcome?.latest ? acknowledgements.find((a) => a.entryId === outcome.latest!.entryId) : undefined;
          const withdrawn = g.latest.status === 'withdrawn';
          const pendingDraft = g.latest.status === 'draft' ? g.latest : null;
          const state = outcome?.state ?? 'awaiting';
          return (
            <motion.li key={g.id} layout className={`ins ${g.live ? 'is-live' : withdrawn ? 'is-withdrawn' : 'is-draft'}`} transition={softSpring}>
              <span className={`ins-num is-${g.live ? state : 'awaiting'}`}>
                {g.live && state === 'done' ? <Check size={14} strokeWidth={3} /> : g.live && state === 'cannot-do' ? <X size={14} strokeWidth={3} /> : n + 1}
              </span>
              <div className="ins-head">
                {g.live ? (
                  <span className="badge badge-blue">
                    <Eye size={12} /> u świadka · v{g.live.version}
                  </span>
                ) : withdrawn ? (
                  <span className="badge">
                    <Ban size={12} /> wycofana
                  </span>
                ) : (
                  <span className="badge badge-orange">
                    <EyeOff size={12} /> szkic - świadek nie widzi
                  </span>
                )}
                {g.latest.packageId && (
                  <span className="badge badge-indigo">
                    <Package size={12} /> {g.latest.packageId}
                  </span>
                )}
                {outcome && g.live && <span className={`badge ${OUTCOME_TONE[state]}`}>{OUTCOME_LABEL[state]}</span>}
                {outcome && outcome.olderVersionAcks.length > 0 && outcome.state === 'awaiting' && (
                  <span className="badge badge-orange">
                    <TriangleAlert size={12} /> odpowiedź tylko do starszej wersji
                  </span>
                )}
              </div>
              <p className="ins-text">{(g.live ?? g.latest).text}</p>
              {g.live && (
                <p className="ins-meta">
                  v{g.live.version} zatwierdził {g.live.approvedBy?.kind === 'dispatcher' ? name(g.live.approvedBy.userId) : '-'} o {formatTime(g.live.approvedAt)} · autor:{' '}
                  {name(g.live.authorId)}
                </p>
              )}
              {latestAck?.comment && (
                <div className="ins-quote">
                  <b>Komentarz świadka</b>
                  <span className="quote">{latestAck.comment}</span>
                </div>
              )}
              {pendingDraft && g.live && (
                <div className="callout callout-orange small" style={{ marginTop: '0.6rem' }}>
                  <Pencil size={16} />
                  <span>
                    Nowa wersja v{pendingDraft.version} czeka na zatwierdzenie: <span className="quote">{pendingDraft.text}</span>
                  </span>
                </div>
              )}
              {g.versions.length > 1 && (
                <details className="versions">
                  <summary>Historia wersji ({g.versions.length})</summary>
                  <ul>
                    {g.versions.map((v) => (
                      <li key={v.version}>
                        <b>v{v.version}</b> · {v.status === 'approved' ? `zatwierdzona ${formatTime(v.approvedAt)}` : v.status === 'withdrawn' ? `wycofana ${formatTime(v.withdrawnAt)}` : 'szkic'}{' '}
                        · {v.text}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <AnimatePresence initial={false}>
                {canManage && editing === g.id && (
                  <motion.div className="stack-sm" style={{ marginTop: '0.75rem' }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <textarea rows={3} autoFocus value={draftText} onChange={(e) => setDraftText(e.target.value)} />
                    <div className="row">
                      <button
                        className="btn btn-sm btn-primary"
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
                      <button className="btn btn-sm" onClick={() => setEditing(null)}>
                        Anuluj
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {canManage && editing !== g.id && (
                <div className="ins-actions">
                  {pendingDraft && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => call(() => api(`/instructions/${g.id}/approve`, { method: 'POST', body: { version: pendingDraft.version } }))}
                    >
                      <Send size={14} /> Zatwierdź i wyślij v{pendingDraft.version}
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setEditing(g.id);
                      setDraftText(g.latest.text);
                    }}
                  >
                    <Pencil size={14} /> Zmień treść
                  </button>
                  {!withdrawn && (g.live || pendingDraft) && (
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red-ink)' }} onClick={() => call(() => api(`/instructions/${g.id}/withdraw`, { method: 'POST' }))}>
                      <Ban size={14} /> Wycofaj
                    </button>
                  )}
                </div>
              )}
            </motion.li>
          );
        })}
      </ol>
      {canManage && (
        <div className="compose">
          <div className="compose-title">
            <Plus size={16} /> Nowa instrukcja (szkic)
          </div>
          <textarea rows={2} placeholder="Jedna czynność, prostym językiem" value={newText} onChange={(e) => setNewText(e.target.value)} />
          <div className="inline-form" style={{ marginTop: 0 }}>
            <input placeholder="Pakiet (opcjonalnie)" value={newPackage} onChange={(e) => setNewPackage(e.target.value)} />
            <button
              className="btn btn-tint-blue"
              disabled={!newText.trim()}
              onClick={() =>
                call(async () => {
                  await api(`/incidents/${incidentId}/instructions`, { method: 'POST', body: { text: newText, packageId: newPackage || null } });
                  setNewText('');
                  setNewPackage('');
                })
              }
            >
              <Plus size={16} /> Dodaj szkic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
