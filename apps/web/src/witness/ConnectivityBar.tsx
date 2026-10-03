// Stały pasek: „Połączono” / „Brak internetu” / „Oczekiwanie na potwierdzenie wysyłki”,
// liczba niewysłanych wpisów i czas ostatniej synchronizacji.
import { StalenessLabel } from '../components/StalenessLabel';

export type Connectivity = 'online' | 'offline' | 'unknown';

interface Props {
  connectivity: Connectivity;
  pending: number;
  lastSyncAt: string | null;
}

export function ConnectivityBar({ connectivity, pending, lastSyncAt }: Props) {
  const state = connectivity === 'offline' ? 'offline' : pending > 0 ? 'pending' : connectivity === 'online' ? 'online' : 'unknown';
  const label = {
    online: 'Połączono',
    offline: 'Brak internetu',
    pending: 'Oczekiwanie na potwierdzenie wysyłki',
    unknown: 'Sprawdzanie połączenia…',
  }[state];
  return (
    <div className={`conn-bar conn-${state}`} role="status" aria-live="polite">
      <strong>{label}</strong>
      <span>Niewysłane: {pending}</span>
      <StalenessLabel prefix="Synchronizacja" at={lastSyncAt} never="jeszcze nie" staleAfterSeconds={30} />
    </div>
  );
}
