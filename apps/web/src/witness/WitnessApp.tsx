// Telefon świadka: dołączenie przez link, bieżąca czynność, obserwacje, historia wpisów.
// Każdy wpis najpierw trafia do IndexedDB, potem jest wysyłany; brak internetu nie blokuje zapisu.
import type { AcknowledgementResult, Instruction, ObservationAnswer } from '@do-przyjazdu/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DemoBanner } from '../components/DemoBanner';
import { clearLocalSession, entriesFor, getSession, putSession, type LocalEntry, type StoredSession } from '../offline/db';
import { enqueue, isPending, setSmsStatus } from '../offline/queue';
import { syncNow } from '../offline/sync';
import { ConnectivityBar, type Connectivity } from './ConnectivityBar';
import { CurrentActionScreen } from './CurrentActionScreen';
import { EntryHistory } from './EntryHistory';
import { JoinScreen } from './JoinScreen';
import { ObservationForm } from './ObservationForm';
import { OfflineNotice } from './OfflineNotice';
import { ReportChangeButton } from './ReportChangeButton';
import { SmsFallback } from './SmsFallback';

const SYNC_INTERVAL_MS = 5000;
type Tab = 'action' | 'observe' | 'history';

export function WitnessApp() {
  const token = useParams().token ?? '';
  const [stored, setStored] = useState<StoredSession | null | undefined>(undefined);
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [connectivity, setConnectivity] = useState<Connectivity>('unknown');
  const [denied, setDenied] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('action');
  const [smsEntryId, setSmsEntryId] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    const [s, e] = await Promise.all([getSession(token), entriesFor(token)]);
    if (!mounted.current) return;
    setStored(s ?? null);
    setEntries(e);
  }, [token]);

  const sync = useCallback(async () => {
    const result = await syncNow(token);
    if (!mounted.current) return;
    if (result.kind === 'ok') {
      setConnectivity('online');
      setDenied(null);
    } else if (result.kind === 'offline') setConnectivity('offline');
    else if (result.kind === 'denied') {
      setConnectivity('online');
      setDenied(result.message);
    }
    await reload();
  }, [token, reload]);

  useEffect(() => {
    mounted.current = true;
    void reload().then(sync);
    const timer = setInterval(() => void sync(), SYNC_INTERVAL_MS);
    const wake = () => void sync();
    const onVisible = () => document.visibilityState === 'visible' && wake();
    window.addEventListener('online', wake);
    window.addEventListener('offline', () => setConnectivity('offline'));
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload, sync]);

  const add = async (entry: Parameters<typeof enqueue>[1]) => {
    const local = await enqueue(token, entry);
    await reload();
    void sync();
    return local;
  };

  if (cleared) {
    return (
      <div className="witness centered">
        <h1>Dane usunięte z telefonu</h1>
        <p>Możesz zamknąć tę stronę.</p>
      </div>
    );
  }

  if (stored === undefined) return <div className="witness centered">Ładowanie…</div>;

  if (stored === null) {
    return (
      <div className="witness centered">
        {denied ? (
          <>
            <h1>Brak dostępu</h1>
            <p>{denied}</p>
          </>
        ) : connectivity === 'offline' ? (
          <>
            <h1>Brak internetu</h1>
            <p>Do pierwszego otwarcia linku potrzebne jest połączenie. Spróbuj ponownie, gdy pojawi się zasięg.</p>
            <button className="btn btn-primary" onClick={() => void sync()}>
              Spróbuj ponownie
            </button>
          </>
        ) : (
          <p>Łączenie z centralą…</p>
        )}
      </div>
    );
  }

  const { session } = stored;
  const demo = session.demoMode || session.incident.isDemo;

  if (!stored.joinedAt) {
    return (
      <div className="witness">
        <DemoBanner visible={demo} />
        <JoinScreen
          session={session}
          onJoin={async () => {
            await putSession({ ...stored, joinedAt: new Date().toISOString() });
            await reload();
          }}
        />
      </div>
    );
  }

  const pending = entries.filter(isPending);
  const smsEntry = smsEntryId ? entries.find((e) => e.entryId === smsEntryId) : undefined;
  const openSms = async (entry: LocalEntry) => {
    if (!entry.sms) await setSmsStatus(entry, 'prepared', '');
    await reload();
    setSmsEntryId(entry.entryId);
  };
  const lastObservation = [...entries].reverse().find((e) => e.kind === 'observation') ?? null;
  const offline = connectivity === 'offline';

  return (
    <div className="witness">
      <DemoBanner visible={demo} />
      <ConnectivityBar connectivity={connectivity} pending={pending.length} lastSyncAt={stored.lastSyncAt} />
      {(denied || stored.accessDenied) && (
        <div className="notice notice-bad">
          <strong>{denied ?? stored.accessDenied?.message}</strong> Nowe wpisy nie zostaną wysłane. Wcześniej pobrane instrukcje mogą być nieaktualne.
        </div>
      )}
      {offline && <OfflineNotice fetchedAt={stored.fetchedAt} onSms={pending.length ? () => void openSms(pending.at(-1)!) : null} />}
      <header className="witness-header">
        <span className="incident-id small-id">{session.incident.id}</span>
        {session.incident.status !== 'open' && <span className="chip chip-info">Zdarzenie przejęte przez ratowników</span>}
      </header>
      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'action'} onClick={() => setTab('action')}>
          Czynność
        </button>
        <button role="tab" aria-selected={tab === 'observe'} onClick={() => setTab('observe')}>
          Obserwacje
        </button>
        <button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>
          Moje wpisy{pending.length ? ` (${pending.length})` : ''}
        </button>
      </nav>
      <main className="witness-main">
        {tab === 'action' && (
          <CurrentActionScreen
            instructions={session.instructions}
            entries={entries}
            onAnswer={async (instruction: Instruction, result: AcknowledgementResult, comment: string | null) => {
              await add({ kind: 'acknowledgement', payload: { instructionId: instruction.id, instructionVersion: instruction.version, result, comment } });
            }}
          />
        )}
        {tab === 'observe' && (
          <ObservationForm
            fields={session.fields}
            lastSaved={lastObservation}
            onSubmit={(answers: ObservationAnswer[], freeText: string | null) => add({ kind: 'observation', payload: { answers, freeText } })}
          />
        )}
        {tab === 'history' && (
          <EntryHistory
            entries={entries}
            session={session}
            onSms={(e) => void openSms(e)}
            onClear={async () => {
              await clearLocalSession(token);
              setCleared(true);
            }}
          />
        )}
      </main>
      <ReportChangeButton
        offline={offline}
        onReport={(text) => add({ kind: 'situation-change', payload: { text } })}
        findEntry={(id) => entries.find((e) => e.entryId === id)}
        onSms={(e) => void openSms(e)}
      />
      {smsEntry && <SmsFallback entry={smsEntry} session={session} onClose={() => setSmsEntryId(null)} onChanged={() => void reload()} />}
    </div>
  );
}
