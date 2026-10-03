// „Otrzymano X minut temu” / „Pobrano X minut temu”. Stary pomiar nigdy jako bieżący (sekcja 12).
import { useNow } from '../lib/polling';
import { ageSeconds, formatAge, formatTime } from '../lib/time';

interface Props {
  prefix: string;
  at: string | null | undefined;
  /** Po ilu sekundach wyróżnić informację jako starą. */
  staleAfterSeconds?: number;
  never?: string;
}

export function StalenessLabel({ prefix, at, staleAfterSeconds = 120, never = 'brak' }: Props) {
  const now = useNow(5000);
  const age = ageSeconds(at, now);
  const stale = age !== null && age > staleAfterSeconds;
  return (
    <span className={stale ? 'staleness stale' : 'staleness'} title={at ? new Date(at).toLocaleString('pl-PL') : undefined}>
      {prefix}: {at ? `${formatAge(at, now)} (${formatTime(at)})` : never}
    </span>
  );
}
