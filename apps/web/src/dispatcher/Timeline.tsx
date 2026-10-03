// Oś czasu zdarzenia. Wpisy nieusuwalne; poprawka widoczna jako osobny wpis.
import type { Instruction, ObservationField, StaffUser, TimelineEvent } from '@do-przyjazdu/shared';
import { motion } from 'framer-motion';
import { Ban, Check, CircleQuestionMark, Eye, Handshake, MessageSquare, Package, Send, Siren, Unplug, UserPen, X, ArrowRightLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { ACK_LABEL, CHANNEL_LABEL, EQUIPMENT_STATE_LABEL, SOURCE_LABEL, STATUS_LABEL, answerText } from '../lib/labels';
import { formatDuration, formatTime } from '../lib/time';

interface Props {
  events: TimelineEvent[];
  fields: ObservationField[];
  instructions: Instruction[];
  staff: StaffUser[];
  highlight?: ReadonlySet<string>;
}

/** Opóźnienie odbioru względem czasu telefonu - sygnał, że wpis czekał w kolejce. */
function DelayNote({ deviceTime, receivedTime }: { deviceTime: string; receivedTime: string | null }) {
  if (!receivedTime) return null;
  const delay = (Date.parse(receivedTime) - Date.parse(deviceTime)) / 1000;
  return (
    <div className="tl-sub">
      czas telefonu {formatTime(deviceTime)} · odebrano {formatTime(receivedTime)}
      {delay > 30 && <span className="badge badge-orange">dotarło po {formatDuration(deviceTime, receivedTime)}</span>}
    </div>
  );
}

function node(e: TimelineEvent): { tone: string; icon: ReactNode } {
  switch (e.type) {
    case 'observation':
      return e.data.source === 'dispatcher-assessment' ? { tone: 'indigo', icon: <UserPen size={14} /> } : { tone: 'blue', icon: <Eye size={14} /> };
    case 'instruction-approved':
      return { tone: '', icon: <Send size={13} /> };
    case 'instruction-withdrawn':
      return { tone: '', icon: <Ban size={13} /> };
    case 'acknowledgement':
      return e.data.result === 'done'
        ? { tone: 'green', icon: <Check size={14} strokeWidth={3} /> }
        : e.data.result === 'cannot-do'
          ? { tone: 'red', icon: <X size={14} strokeWidth={3} /> }
          : { tone: 'orange', icon: <CircleQuestionMark size={14} /> };
    case 'equipment':
      return { tone: 'indigo', icon: <Package size={14} /> };
    case 'status-change':
      return { tone: '', icon: <ArrowRightLeft size={13} /> };
    case 'situation-change-report':
      return { tone: 'red', icon: <Siren size={14} /> };
    case 'sms-received':
      return { tone: 'blue', icon: <MessageSquare size={13} /> };
    case 'contact-gap':
      return { tone: 'orange', icon: <Unplug size={14} /> };
    case 'handover':
      return { tone: 'green', icon: <Handshake size={14} /> };
  }
}

export function Timeline({ events, fields, instructions, staff, highlight }: Props) {
  const fieldMap = new Map(fields.map((f) => [f.key, f]));
  const name = (id: string) => staff.find((s) => s.id === id)?.displayName ?? id;
  const insNumber = (id: string) => {
    const ids = [...new Set(instructions.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.id))];
    return ids.indexOf(id) + 1;
  };
  const latestVersion = (id: string) => Math.max(...instructions.filter((i) => i.id === id && i.approvedAt).map((i) => i.version), 0);

  if (events.length === 0) return <p className="hint">Brak wpisów.</p>;
  return (
    <ol className="tl">
      {events.map((e) => {
        const n = node(e);
        const cls = ['tl-item', e.type === 'contact-gap' ? 'is-gap' : '', highlight?.has(e.id) ? 'is-highlight' : ''].filter(Boolean).join(' ');
        return (
          <motion.li key={e.id} id={`entry-${e.id}`} className={cls} layout="position" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <time className="tl-time">{formatTime(e.at)}</time>
            <span className={`tl-node${n.tone ? ` is-${n.tone}` : ''}`}>{n.icon}</span>
            <div className="tl-body">{render(e)}</div>
          </motion.li>
        );
      })}
    </ol>
  );

  function render(e: TimelineEvent) {
    switch (e.type) {
      case 'observation':
        return (
          <>
            <div className="tl-title">
              {SOURCE_LABEL[e.data.source]}
              {e.data.author.kind === 'dispatcher' && <span className="muted"> · {name(e.data.author.userId)}</span>}
              <span className="badge">{CHANNEL_LABEL[e.data.channel]}</span>
            </div>
            {e.data.answers.length > 0 && (
              <ul className="tl-answers">
                {e.data.answers.map((a) => (
                  <li key={a.fieldKey} className={a.value.known ? '' : 'is-unknown'}>
                    {fieldMap.get(a.fieldKey)?.label ?? a.fieldKey} <b>{answerText(fieldMap.get(a.fieldKey), a.value)}</b>
                  </li>
                ))}
              </ul>
            )}
            {e.data.freeText && <p className="quote">{e.data.freeText}</p>}
            {e.data.author.kind === 'witness' && <DelayNote deviceTime={e.data.times.deviceTime} receivedTime={e.data.times.receivedTime} />}
          </>
        );
      case 'instruction-approved':
        return (
          <>
            <div className="tl-title">
              Zatwierdzono czynność {insNumber(e.data.id)} (v{e.data.version})
              {e.data.approvedBy?.kind === 'dispatcher' && <span className="muted"> · {name(e.data.approvedBy.userId)}</span>}
              {e.data.packageId && <span className="badge badge-indigo">{e.data.packageId}</span>}
            </div>
            <p className="muted">{e.data.text}</p>
          </>
        );
      case 'instruction-withdrawn':
        return (
          <div className="tl-title">
            Wycofano czynność {insNumber(e.data.id)}: <span className="muted">{e.data.text}</span>
          </div>
        );
      case 'acknowledgement': {
        const outdated = e.data.instructionVersion < latestVersion(e.data.instructionId);
        const tone = e.data.result === 'done' ? 'text-green' : e.data.result === 'cannot-do' ? 'text-red' : 'text-orange';
        return (
          <>
            <div className="tl-title">
              <span className={tone}>Świadek: {ACK_LABEL[e.data.result]}</span>
              <span className="muted">
                · czynność {insNumber(e.data.instructionId)} v{e.data.instructionVersion}
              </span>
              {outdated && <span className="badge badge-orange">dotyczy starszej wersji</span>}
            </div>
            {e.data.comment && <p className="quote">{e.data.comment}</p>}
            <DelayNote deviceTime={e.data.times.deviceTime} receivedTime={e.data.times.receivedTime} />
          </>
        );
      }
      case 'equipment':
        return (
          <>
            <div className="tl-title">
              Wyposażenie: {e.data.name}
              {e.data.packageId && <span className="badge badge-indigo">{e.data.packageId}</span>}
            </div>
            <div className="tl-sub">
              {EQUIPMENT_STATE_LABEL[e.data.state]}
              {e.data.author.kind === 'dispatcher' && ` · wpis: ${name(e.data.author.userId)}`}
            </div>
          </>
        );
      case 'status-change':
        return (
          <div className="tl-title">
            Status: {STATUS_LABEL[e.data.from as keyof typeof STATUS_LABEL] ?? e.data.from} → {STATUS_LABEL[e.data.to as keyof typeof STATUS_LABEL] ?? e.data.to}
            <span className="muted"> · {name(e.data.byUserId)}</span>
          </div>
        );
      case 'situation-change-report':
        return (
          <>
            <div className="tl-title">
              <span className="text-red">Zgłoszenie zmiany sytuacji</span>
              {e.data.reviewedAt ? (
                <span className="badge badge-green">obsłużone {formatTime(e.data.reviewedAt)}</span>
              ) : (
                <span className="badge badge-solid-red">czeka na przegląd</span>
              )}
            </div>
            <p className="quote">{e.data.text}</p>
            <DelayNote deviceTime={e.data.times.deviceTime} receivedTime={e.data.times.receivedTime} />
          </>
        );
      case 'sms-received':
        return (
          <>
            <div className="tl-title">
              SMS odebrany {e.data.isSimulated && <span className="badge">symulacja</span>}
              {e.data.readAt ? <span className="badge badge-green">przeczytano {formatTime(e.data.readAt)}</span> : <span className="badge badge-red">nieprzeczytany</span>}
            </div>
            <pre className="sms-raw">{e.data.rawText}</pre>
          </>
        );
      case 'contact-gap':
        return (
          <div className="tl-title">
            {e.data.ongoing ? 'Trwa brak kontaktu z telefonem świadka' : 'Brak kontaktu z telefonem świadka'} - {formatDuration(e.data.from, e.data.to)}
            {e.data.to && <span className="muted"> (do {formatTime(e.data.to)})</span>}
          </div>
        );
      case 'handover':
        return <div className="tl-title text-green">Zdarzenie przejęte przez: {name(e.data.responderId)}</div>;
    }
  }
}
