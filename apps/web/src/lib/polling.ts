// Odpytywanie API co kilka sekund. WebSockety nie są potrzebne do pokazania wartości MVP (sekcja 11).
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './api';

export const POLL_INTERVAL_MS = 4000;

/** Pobiera dane od razu i co `intervalMs`, także po powrocie do karty. Ostatnie dane zostają przy błędzie. */
export function usePolling<T>(fetcher: () => Promise<T>, intervalMs = POLL_INTERVAL_MS, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      setLastSuccessAt(new Date().toISOString());
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), intervalMs);
    const onVisible = () => document.visibilityState === 'visible' && void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, intervalMs, ...deps]);

  return { data, error, lastSuccessAt, refresh };
}

/** Bieżący czas odświeżany co `ms` — do etykiet „X min temu”. */
export function useNow(ms = 10_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
