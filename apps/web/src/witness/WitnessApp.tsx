// Telefon świadka: dołączenie przez link, bieżąca czynność, obserwacje, historia wpisów.
// Każdy wpis najpierw trafia do IndexedDB, potem jest wysyłany; brak internetu nie blokuje zapisu.
import type { AcknowledgementResult, Instruction, ObservationAnswer } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCheck, ClipboardList, Eye, LoaderCircle, ShieldCheck, ShieldX, Smartphone, Wifi, WifiOff, ListChecks } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DemoBanner } from '../components/DemoBanner';
import { Logo, plural, Sheet, Splash, spring, useRetained, useToast } from '../components/ui';
import { formatTime } from '../lib/time';
import { clearLocalSession, entriesFor, getSession, putSession, type LocalEntry, type StoredSession } from '../offline/db';
import { enqueue, isPending, setSmsStatus } from '../offline/queue';
import { syncNow } from '../offline/sync';
import { ConnectionPill, ConnectivityDetails, type Connectivity } from './ConnectivityBar';
import { CurrentActionScreen } from './CurrentActionScreen';
import { EntryHistory } from './EntryHistory';
import { JoinScreen } from './JoinScreen';
import { ObservationForm } from './ObservationForm';
import { OfflineNotice } from './OfflineNotice';
import { ReportChangeButton } from './ReportChangeButton';
import { SmsFallback } from './SmsFallback';

const SYNC_INTERVAL_MS = 5000;
type Tab = 'action' | 'observe' | 'history';
const TABS: { id: Tab; label: string; icon: typeof Eye }[] = [
  { id: 'action', label: 'Czynność', icon: ListChecks },
  { id: 'observe', label: 'Obserwacje', icon: Eye },
  { id: 'history', label: 'Moje wpisy', icon: ClipboardList },
];

export function WitnessApp() {
  const token = useParams().token ?? '';
  const toast = useToast();
  const [stored, setStored] = useState<StoredSession | null | undefined>(undefined);
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [connectivity, setConnectivity] = useState<Connectivity>('unknown');
  const [denied, setDenied] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('action');
  const [smsEntryId, setSmsEntryId] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const mounted = useRef(true);
  const delivered = useRef<Set<string> | null>(null);
  const prevConn = useRef<Connectivity>('unknown');

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
    const onOffline = () => setConnectivity('offline');
    window.addEventListener('online', wake);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener('online', wake);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload, sync]);

  // „Dostarczono do centrali” — tylko dla wpisów, które dotarły w trakcie tej wizyty.
  useEffect(() => {
    const received = entries.filter((e) => e.status === 'received-by-server');
    if (delivered.current === null) {
      if (stored !== undefined) delivered.current = new Set(received.map((e) => e.entryId));
      return;
    }
    const fresh = received.filter((e) => !delivered.current!.has(e.entryId));
    if (fresh.length === 0) return;
    fresh.forEach((e) => delivered.current!.add(e.entryId));
    const last = fresh.at(-1)!;
    toast({
      tone: 'ok',
      icon: <CheckCheck size={18} strokeWidth={2.6} />,
      title: fresh.length === 1 ? 'Otrzymano w centrali' : `${fresh.length} ${plural(fresh.length, 'wpis', 'wpisy', 'wpisów')} w centrali`,
      detail: `potwierdzenie serwera ${formatTime(last.receivedTime)}`,
    });
  }, [entries, stored, toast]);

  // Zmiana stanu połączenia — krótka informacja na górze.
  useEffect(() => {
    const prev = prevConn.current;
    prevConn.current = connectivity;
    if (prev === connectivity || prev === 'unknown') return;
    if (connectivity === 'offline') {
      toast({ tone: 'warn', icon: <WifiOff size={17} />, title: 'Brak internetu', detail: 'Odpowiedzi zapisują się na telefonie' });
    } else if (connectivity === 'online' && prev === 'offline') {
      toast({ tone: 'ok', icon: <Wifi size={17} />, title: 'Połączenie wróciło', detail: 'Wysyłamy zapisane wpisy…' });
    }
  }, [connectivity, toast]);

  const offline = connectivity === 'offline';
  const add = async (entry: Parameters<typeof enqueue>[1]) => {
    const local = await enqueue(token, entry);
    toast(
      offline
        ? { tone: 'warn', icon: <Smartphone size={17} />, title: 'Zapisano na telefonie', detail: 'Wyślemy, gdy wróci zasięg' }
        : { tone: 'info', icon: <LoaderCircle size={17} className="spin" />, title: 'Zapisano na telefonie', detail: 'Wysyłanie do centrali…' },
    );
    await reload();
    void sync();
    return local;
  };

  const smsEntry = smsEntryId ? entries.find((e) => e.entryId === smsEntryId) : undefined;
  const shownSmsEntry = useRetained(smsEntry);

  if (cleared) {
    return (
      <Splash icon={<ShieldCheck size={34} />} tone="green" title="Dane usunięte z telefonu">
        <p>Możesz zamknąć tę stronę.</p>
      </Splash>
    );
  }

  if (stored === undefined) return <Splash title="Do przyjazdu" />;

  if (stored === null) {
    if (denied) {
      return (
        <Splash icon={<ShieldX size={34} />} tone="red" title="Brak dostępu">
          <p>{denied}</p>
        </Splash>
      );
    }
    if (offline) {
      return (
        <Splash icon={<WifiOff size={34} />} tone="orange" title="Brak internetu">
          <p>Do pierwszego otwarcia linku potrzebne jest połączenie. Spróbuj ponownie, gdy pojawi się zasięg.</p>
          <button className="btn btn-lg btn-primary" onClick={() => void sync()}>
            Spróbuj ponownie
          </button>
        </Splash>
      );
    }
    return (
      <Splash title="Łączenie z centralą…">
        <p>Pobieramy instrukcje dla Twojego zdarzenia.</p>
      </Splash>
    );
  }

  const { session } = stored;
  const demo = session.demoMode || session.incident.isDemo;

  if (!stored.joinedAt) {
    return (
      <div>
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
  const openSms = async (entry: LocalEntry) => {
    if (!entry.sms) await setSmsStatus(entry, 'prepared', '');
    await reload();
    setSmsEntryId(entry.entryId);
  };
  const lastObservation = [...entries].reverse().find((e) => e.kind === 'observation') ?? null;
  const accessProblem = denied ?? stored.accessDenied?.message ?? null;
  const tabIndex = TABS.findIndex((t) => t.id === tab);

  return (
    <motion.div className="w-app" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <DemoBanner visible={demo} />
      <header className="w-header">
        <div className="w-header-row">
          <Logo size={32} />
          <div className="w-header-title">
            <span className="eyebrow">Zdarzenie</span>
            <strong>{session.incident.id}</strong>
          </div>
          <ConnectionPill connectivity={connectivity} pending={pending.length} />
        </div>
        <ConnectivityDetails connectivity={connectivity} pending={pending.length} lastSyncAt={stored.lastSyncAt} />
        {session.incident.status !== 'open' && (
          <div className="w-handed">
            <ShieldCheck size={16} /> Zdarzenie przejęte przez ratowników
          </div>
        )}
      </header>

      <AnimatePresence initial={false}>
        {(accessProblem || offline) && (
          <motion.div className="w-alerts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {accessProblem && (
              <div className="callout callout-red">
                <ShieldX size={19} />
                <span>
                  <strong>{accessProblem}</strong> Nowe wpisy nie zostaną wysłane. Wcześniej pobrane instrukcje mogą być nieaktualne.
                </span>
              </div>
            )}
            {offline && <OfflineNotice fetchedAt={stored.fetchedAt} onSms={pending.length ? () => void openSms(pending.at(-1)!) : null} />}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
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
          </motion.div>
        </AnimatePresence>
      </main>

      <ReportChangeButton
        offline={offline}
        onReport={(text) => add({ kind: 'situation-change', payload: { text } })}
        findEntry={(id) => entries.find((e) => e.entryId === id)}
        onSms={(e) => void openSms(e)}
      />

      <nav className="tabbar" role="tablist" aria-label="Sekcje">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const selected = i === tabIndex;
          return (
            <button key={t.id} role="tab" aria-selected={selected} className="tabbar-item" onClick={() => setTab(t.id)}>
              {selected && <motion.span layoutId="tabbar-pill" className="tabbar-pill" transition={spring} />}
              <Icon size={22} strokeWidth={selected ? 2.4 : 2} />
              <span>{t.label}</span>
              {t.id === 'history' && pending.length > 0 && (
                <motion.span className="count-bubble tabbar-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
                  {pending.length}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      <Sheet open={Boolean(smsEntry)} onClose={() => setSmsEntryId(null)} title="Aktualizacja SMS-em" label="Wyślij SMS">
        {shownSmsEntry && <SmsFallback key={shownSmsEntry.entryId} entry={shownSmsEntry} session={session} onChanged={() => void reload()} />}
      </Sheet>
    </motion.div>
  );
}
