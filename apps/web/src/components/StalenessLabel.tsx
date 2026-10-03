// „Otrzymano X minut temu” / „Pobrano X minut temu”. Stary pomiar nigdy jako bieżący (sekcja 12).
import { useNow } from '../lib/polling';
import { ageSeconds, formatAge, formatTime } from '../lib/time';

interface Props {
  prefix: string;
  at: string | null | undefined;
  /** Po ilu sekundach wyróżnić informację jako starą. */
  staleAfterSeconds?: number;
  never?: string;
  /** Bez godziny w nawiasie. */
  compact?: boolean;
}

export function StalenessLabel({ prefix, at, staleAfterSeconds = 120, never = 'brak', compact = false }: Props) {
  const now = useNow(5000);
  const age = ageSeconds(at, now);
  const stale = age !== null && age > staleAfterSeconds;
  return (
    <span className={stale ? 'staleness stale' : 'staleness'} title={at ? new Date(at).toLocaleString('pl-PL') : undefined}>
      {prefix && `${prefix}: `}
      {at ? (compact ? formatAge(at, now) : `${formatAge(at, now)} (${formatTime(at)})`) : never}
    </span>
  );
}

/** Sam wiek informacji — do kafelków. Zwraca też, czy jest stara. */
export function useAge(at: string | null | undefined, staleAfterSeconds: number) {
  const now = useNow(5000);
  const age = ageSeconds(at, now);
  return { text: at ? formatAge(at, now) : null, stale: age !== null && age > staleAfterSeconds };
}
