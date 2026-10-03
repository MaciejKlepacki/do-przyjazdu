// Formatowanie i wiek informacji. Zawsze pokazujemy, jak stara jest dana
// i czy czas pochodzi z urządzenia, czy z serwera (sekcja 10, reguła 3).

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })} ${formatTime(iso)}`;
}

export function ageSeconds(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  return Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
}

export function formatAge(iso: string | null | undefined, now = Date.now()): string {
  const s = ageSeconds(iso, now);
  if (s === null) return 'nigdy';
  if (s < 20) return 'przed chwilą';
  if (s < 60) return `${s} s temu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min temu`;
  const h = Math.floor(m / 60);
  return `${h} godz. ${m % 60} min temu`;
}

export function formatDuration(fromIso: string, toIso: string | null, now = Date.now()): string {
  const s = Math.max(0, Math.round(((toIso ? Date.parse(toIso) : now) - Date.parse(fromIso)) / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ${s % 60} s` : `${Math.floor(m / 60)} godz. ${m % 60} min`;
}
