import { instructionOutcome, type AcknowledgementResult, type Instruction, type InstructionOutcomeState } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, ChevronsLeftRight, CircleQuestionMark, MessageSquarePlus, Package, Radio, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DrawCheck, haptic, softSpring, spring } from '../components/ui';
import { ACK_LABEL, OUTCOME_LABEL } from '../lib/labels';
import { formatTime } from '../lib/time';
import type { LocalEntry } from '../offline/db';
import { EntryStatus } from './entryStatus';

interface Props {
  instructions: Instruction[];
  entries: LocalEntry[];
  onAnswer: (instruction: Instruction, result: AcknowledgementResult, comment: string | null) => Promise<void>;
}

export function StateIcon({ state, n }: { state: InstructionOutcomeState; n?: number }) {
  const icon =
    state === 'done' ? <Check size={14} strokeWidth={3} /> : state === 'cannot-do' ? <X size={14} strokeWidth={3} /> : state === 'needs-clarification' ? '?' : n;
  return <span className={`state-icon is-${state}`}>{icon}</span>;
}

const slide = {
  enter: (dir: number) => ({ x: dir * 80, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir * -80, opacity: 0, scale: 0.98 }),
};

export function CurrentActionScreen({ instructions, entries, onAnswer }: Props) {
  const acks = useMemo(
    () =>
      entries.flatMap((e) =>
        e.kind === 'acknowledgement'
          ? [{ entryId: e.entryId, ...e.payload, deviceSequence: e.deviceSequence, times: { deviceTime: e.deviceTime, receivedTime: e.receivedTime } }]
          : [],
      ),
    [entries],
  );
  const outcomes = useMemo(() => instructions.map((i) => instructionOutcome(i, acks)), [instructions, acks]);
  const firstOpen = outcomes.findIndex((o) => o.state !== 'done');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);

  if (instructions.length === 0) {
    return (
      <motion.div className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="radar" aria-hidden>
          <span />
          <span />
          <span />
          <div className="radar-core">
            <Radio size={26} />
          </div>
        </div>
        <h2>Czekaj na polecenia</h2>
        <p>Instrukcje pojawią się tutaj, gdy prowadzący je zatwierdzi. W tym czasie opisz sytuację w zakładce „Obserwacje”.</p>
      </motion.div>
    );
  }

  const index = Math.max(0, selectedId ? instructions.findIndex((i) => i.id === selectedId) : firstOpen === -1 ? instructions.length - 1 : firstOpen);
  const current = instructions[index]!;
  const outcome = outcomes[index]!;
  const latestEntry = outcome.latest ? entries.find((e) => e.entryId === outcome.latest!.entryId) : undefined;
  const allDone = firstOpen === -1;
  const doneCount = outcomes.filter((o) => o.state === 'done').length;

  const go = (n: number) => {
    if (n < 0 || n >= instructions.length || n === index) return;
    haptic(6);
    setDirection(n > index ? 1 : -1);
    setSelectedId(instructions[n]!.id);
  };

  const answer = async (result: AcknowledgementResult) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    haptic(result === 'done' ? [12, 50, 22] : 24);
    try {
      await onAnswer(current, result, comment.trim() || null);
      setComment('');
      setCommentOpen(false);
      if (result === 'done') {
        setCelebrate(true);
        await new Promise((r) => setTimeout(r, 850));
        setCelebrate(false);
        setDirection(1);
        setSelectedId(null);
      } else setSelectedId(current.id);
    } catch {
      setError('Nie udało się zapisać odpowiedzi na telefonie. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="action">
      {error && <p className="error-text" role="alert">{error}</p>}
      <div>
        <div className="progress-head">
          <span className="eyebrow">
            Czynność {index + 1} z {instructions.length}
          </span>
          <span className="count">
            {doneCount}/{instructions.length} wykonane
          </span>
        </div>
        <div className="steps" role="tablist" aria-label="Czynności">
          {instructions.map((ins, n) => (
            <button
              key={ins.id}
              role="tab"
              aria-selected={n === index}
              aria-label={`Czynność ${n + 1}: ${OUTCOME_LABEL[outcomes[n]!.state]}`}
              className={`step is-${outcomes[n]!.state}${n === index ? ' is-current' : ''}`}
              onClick={() => go(n)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {allDone && !selectedId && !celebrate && (
          <motion.div className="all-done" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <span className="all-done-icon">
              <Check size={22} strokeWidth={3} />
            </span>
            <div>
              <strong>Wszystko wykonane</strong>
              <span>Czekaj na kolejne polecenia od prowadzącego.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="action-stage">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.article
            key={`${current.id}:${current.version}`}
            className="action-card"
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring}
            drag={instructions.length > 1 ? 'x' : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.22}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -500) go(index + 1);
              else if (info.offset.x > 70 || info.velocity.x > 500) go(index - 1);
            }}
          >
            <div className="action-card-top">
              {current.packageId && (
                <span className="badge badge-indigo">
                  <Package size={13} /> Pakiet {current.packageId}
                </span>
              )}
              <span className="action-version">
                wersja {current.version} · zatwierdzono {formatTime(current.approvedAt)}
              </span>
            </div>
            <p className="action-text">{current.text}</p>
            {current.illustrationUrl && <img className="action-img" src={current.illustrationUrl} alt="" />}

            {outcome.olderVersionAcks.length > 0 && outcome.state === 'awaiting' && (
              <div className="callout callout-orange small">
                <TriangleAlert size={18} />
                <span>Prowadzący zmienił treść tej czynności. Twoja wcześniejsza odpowiedź dotyczyła starszej wersji - odpowiedz ponownie.</span>
              </div>
            )}
            {outcome.latest && latestEntry && (
              <div className="answered">
                <span className={`answered-icon is-${outcome.latest.result}`}>
                  {outcome.latest.result === 'done' ? <Check size={14} strokeWidth={3} /> : outcome.latest.result === 'cannot-do' ? <X size={14} strokeWidth={3} /> : '?'}
                </span>
                <span>
                  Twoja odpowiedź: <strong>{ACK_LABEL[outcome.latest.result]}</strong>
                </span>
                <EntryStatus entry={latestEntry} />
              </div>
            )}
            {instructions.length > 1 && (
              <div className="swipe-hint" aria-hidden>
                <ChevronsLeftRight size={14} /> przesuń, aby zobaczyć inne czynności
              </div>
            )}

            <AnimatePresence>
              {celebrate && (
                <motion.div className="celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.span className="celebrate-circle" initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                    <DrawCheck size={46} />
                  </motion.span>
                  <motion.strong initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    Zapisano: wykonane
                  </motion.strong>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="ack">
        <AnimatePresence initial={false} mode="wait">
          {commentOpen ? (
            <motion.div key="box" className="comment-box" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={softSpring}>
              <label htmlFor="ack-comment">Komentarz do odpowiedzi (opcjonalnie)</label>
              <input id="ack-comment" autoFocus value={comment} maxLength={300} onChange={(e) => setComment(e.target.value)} placeholder="np. nie mamy karimaty" />
            </motion.div>
          ) : (
            <motion.div key="link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button className="link-btn" onClick={() => setCommentOpen(true)}>
                <MessageSquarePlus size={17} /> Dodaj komentarz do odpowiedzi
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button className="btn btn-xl btn-success btn-block" whileTap={{ scale: 0.97 }} disabled={busy} onClick={() => answer('done')}>
          <Check size={24} strokeWidth={3} /> Wykonane
        </motion.button>
        <div className="ack-row">
          <motion.button className="btn btn-lg btn-tint-red" whileTap={{ scale: 0.96 }} disabled={busy} onClick={() => answer('cannot-do')}>
            <X size={19} strokeWidth={2.6} /> Nie mogę wykonać
          </motion.button>
          <motion.button className="btn btn-lg btn-tint-orange" whileTap={{ scale: 0.96 }} disabled={busy} onClick={() => answer('needs-clarification')}>
            <CircleQuestionMark size={19} strokeWidth={2.4} /> Potrzebuję wyjaśnienia
          </motion.button>
        </div>
      </div>

      <section>
        <h3 className="section-label">Wszystkie czynności</h3>
        <ol className="list-group">
          {instructions.map((i, n) => (
            <li key={i.id}>
              <button className={n === index ? 'ins-mini is-current' : 'ins-mini'} onClick={() => go(n)}>
                <StateIcon state={outcomes[n]!.state} n={n + 1} />
                <span className="ins-mini-text">{i.text}</span>
                <ChevronRight size={18} />
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
