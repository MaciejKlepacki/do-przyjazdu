// Stały pasek: „Połączono” / „Brak internetu” / „Oczekiwanie na potwierdzenie wysyłki”,
// liczba niewysłanych wpisów i czas ostatniej synchronizacji.
import { AnimatePresence, motion } from 'framer-motion';
import { LoaderCircle, Wifi, WifiOff } from 'lucide-react';
import { StalenessLabel } from '../components/StalenessLabel';
import { LiveDot, plural } from '../components/ui';

export type Connectivity = 'online' | 'offline' | 'unknown';

interface Props {
  connectivity: Connectivity;
  pending: number;
  lastSyncAt: string | null;
}

export function connState(connectivity: Connectivity, pending: number) {
  return connectivity === 'offline' ? 'offline' : pending > 0 ? 'pending' : connectivity === 'online' ? 'online' : 'unknown';
}

export function ConnectionPill({ connectivity, pending }: Pick<Props, 'connectivity' | 'pending'>) {
  const state = connState(connectivity, pending);
  const label = { online: 'Połączono', offline: 'Brak internetu', pending: 'Wysyłanie…', unknown: 'Sprawdzanie…' }[state];
  const icon = {
    online: <LiveDot tone="green" />,
    offline: <WifiOff size={14} />,
    pending: <LoaderCircle size={14} className="spin" />,
    unknown: <Wifi size={14} />,
  }[state];
  return (
    <motion.span layout className={`conn-pill is-${state}`} role="status" aria-live="polite" transition={{ type: 'spring', stiffness: 500, damping: 40 }}>
      {icon}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

export function ConnectivityDetails({ connectivity, pending, lastSyncAt }: Props) {
  const state = connState(connectivity, pending);
  return (
    <div className="conn-sub">
      <StalenessLabel prefix="Synchronizacja" at={lastSyncAt} never="jeszcze nie" staleAfterSeconds={30} compact />
      <span className="sep" />
      {pending > 0 ? (
        <span className="is-pending">
          {pending} {plural(pending, 'wpis czeka', 'wpisy czekają', 'wpisów czeka')} na wysłanie
        </span>
      ) : (
        <span>Niewysłane: 0</span>
      )}
      {state === 'pending' && connectivity === 'online' && (
        <>
          <span className="sep" />
          <span>Oczekiwanie na potwierdzenie wysyłki</span>
        </>
      )}
    </div>
  );
}
