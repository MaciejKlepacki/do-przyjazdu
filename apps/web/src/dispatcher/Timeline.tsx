// Oś czasu zdarzenia. Wpisy nieusuwalne; poprawka widoczna jako osobny wpis.
import type { Instruction, ObservationField, StaffUser, TimelineEvent } from '@do-przyjazdu/shared';
import { ACK_LABEL, CHANNEL_LABEL, EQUIPMENT_STATE_LABEL, SOURCE_LABEL, STATUS_LABEL, answerText } from '../lib/labels';
import { formatDuration, formatTime } from '../lib/time';

interface Props {
  events: TimelineEvent[];
  fields: ObservationField[];
  instructions: Instruction[];
  staff: StaffUser[];
  highlight?: ReadonlySet<string>;
}

/** Opóźnienie odbioru względem czasu telefonu — sygnał, że wpis czekał w kolejce. */
function DelayNote({ deviceTime, receivedTime }: { deviceTime: string; receivedTime: string | null }) {
  if (!receivedTime) return null;
  const delay = (Date.parse(receivedTime) - Date.parse(deviceTime)) / 1000;
  return (
    <span className="muted small">
      czas telefonu {formatTime(deviceTime)} · odebrano {formatTime(receivedTime)}
      {delay > 30 && <span className="chip chip-warn">dotarło po {formatDuration(deviceTime, receivedTime)}</span>}
    </span>
  );
}

export function Timeline({ events, fields, instructions, staff, highlight }: Props) {
  const fieldMap = new Map(fields.map((f) => [f.key, f]));
  const name = (id: string) => staff.find((s) => s.id === id)?.displayName ?? id;
  const insNumber = (id: string) => {
    const ids = [...new Set(instructions.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.id))];
    return ids.indexOf(id) + 1;
  };
  const latestVersion = (id: string) => Math.max(...instructions.filter((i) => i.id === id && i.approvedAt).map((i) => i.version), 0);

  if (events.length === 0) return <p className="muted">Brak wpisów.</p>;
  return (
    <ol className="timeline">
      {events.map((e) => (
        <li key={e.id} id={`entry-${e.id}`} className={`tl tl-${e.type}${highlight?.has(e.id) ? ' tl-highlight' : ''}`}>
          <time className="tl-time">{formatTime(e.at)}</time>
          <div className="tl-body">{render(e)}</div>
        </li>
      ))}
    </ol>
  );

  function render(e: TimelineEvent) {
    switch (e.type) {
      case 'observation':
        return (
          <>
            <strong>{SOURCE_LABEL[e.data.source]}</strong>
            {e.data.author.kind === 'dispatcher' && <span className="muted"> · {name(e.data.author.userId)}</span>}
            <span className="chip">{CHANNEL_LABEL[e.data.channel]}</span>
            <ul className="answers">
              {e.data.answers.map((a) => (
                <li key={a.fieldKey} className={a.value.known ? '' : 'unknown'}>
                  {fieldMap.get(a.fieldKey)?.label ?? a.fieldKey} <strong>{answerText(fieldMap.get(a.fieldKey), a.value)}</strong>
                </li>
              ))}
            </ul>
            {e.data.freeText && <p className="quote">„{e.data.freeText}”</p>}
            {e.data.author.kind === 'witness' && <DelayNote deviceTime={e.data.times.deviceTime} receivedTime={e.data.times.receivedTime} />}
          </>
        );
      case 'instruction-approved':
        return (
          <>
            <strong>
              Zatwierdzono czynność {insNumber(e.data.id)} (v{e.data.version})
            </strong>
            {e.data.approvedBy?.kind === 'dispatcher' && <span className="muted"> · {name(e.data.approvedBy.userId)}</span>}
            {e.data.packageId && <span className="chip chip-info">{e.data.packageId}</span>}
            <p>{e.data.text}</p>
          </>
        );
      case 'instruction-withdrawn':
        return (
          <strong>
            Wycofano czynność {insNumber(e.data.id)}: <span className="muted">{e.data.text}</span>
          </strong>
        );
      case 'acknowledgement': {
        const outdated = e.data.instructionVersion < latestVersion(e.data.instructionId);
        return (
          <>
            <strong className={`ack-${e.data.result}`}>Świadek: {ACK_LABEL[e.data.result]}</strong> — czynność {insNumber(e.data.instructionId)} v
            {e.data.instructionVersion}
            {outdated && <span className="chip chip-warn">dotyczy starszej wersji</span>}
            {e.data.comment && <p className="quote">„{e.data.comment}”</p>}
            <DelayNote deviceTime={e.data.times.deviceTime} receivedTime={e.data.times.receivedTime} />
          </>
        );
      }
      case 'equipment':
        return (
          <>
            <strong>Wyposażenie:</strong> {e.data.name} — {EQUIPMENT_STATE_LABEL[e.data.state]}
            {e.data.packageId && <span className="chip chip-info">{e.data.packageId}</span>}
            {e.data.author.kind === 'dispatcher' && <span className="muted small"> · wpis: {name(e.data.author.userId)}</span>}
          </>
        );
      case 'status-change':
        return (
          <>
            <strong>Status:</strong> {STATUS_LABEL[e.data.from as keyof typeof STATUS_LABEL] ?? e.data.from} →{' '}
            {STATUS_LABEL[e.data.to as keyof typeof STATUS_LABEL] ?? e.data.to} <span className="muted">· {name(e.data.byUserId)}</span>
          </>
        );
      case 'situation-change-report':
        return (
          <>
            <strong className="ack-cannot-do">Zgłoszenie zmiany sytuacji</strong>
            <p className="quote">„{e.data.text}”</p>
            <DelayNote deviceTime={e.data.times.deviceTime} receivedTime={e.data.times.receivedTime} />{' '}
            {e.data.reviewedAt ? (
              <span className="chip chip-ok">obsłużone {formatTime(e.data.reviewedAt)}</span>
            ) : (
              <span className="chip chip-bad">czeka na przegląd</span>
            )}
          </>
        );
      case 'sms-received':
        return (
          <>
            <strong>SMS odebrany</strong> {e.data.isSimulated && <span className="chip">symulacja</span>}
            <pre className="sms-preview">{e.data.rawText}</pre>
            {e.data.readAt ? <span className="chip chip-ok">przeczytano {formatTime(e.data.readAt)}</span> : <span className="chip chip-bad">nieprzeczytany</span>}
          </>
        );
      case 'contact-gap':
        return (
          <strong className="gap">
            {e.data.ongoing ? 'Trwa brak kontaktu z telefonem świadka' : 'Brak kontaktu z telefonem świadka'} —{' '}
            {formatDuration(e.data.from, e.data.to)}
            {e.data.to && ` (do ${formatTime(e.data.to)})`}
          </strong>
        );
      case 'handover':
        return (
          <strong>
            Zdarzenie przejęte przez: {name(e.data.responderId)}
          </strong>
        );
    }
  }
}
