import type { Timestamp } from './common.js';

/**
 * Status awaryjnego SMS-a widoczny dla świadka (sekcja 10).
 * „declared-sent” to deklaracja świadka — przeglądarka nie wie, czy SMS wyszedł.
 * Dopiero „received-by-center” oznacza odbiór przez centralę, a „read-by-lead” przeczytanie.
 */
export type SmsFallbackStatus = 'prepared' | 'sms-app-opened' | 'declared-sent' | 'received-by-center' | 'read-by-lead';

/** Wiadomość przyjęta przez odbiornik SMS. Osobne zdarzenie osi czasu (reguła 8). */
export interface InboundSms {
  id: string;
  rawText: string;
  claimedIncidentId: string | null;
  claimedEntryId: string | null;
  linkedIncidentId: string | null;
  linkedEntryId: string | null;
  /** Nieznana sesja lub nieczytelna treść — ręczna weryfikacja, nigdy autoprzypisanie (reguła 9). */
  needsManualReview: boolean;
  receivedTime: Timestamp;
  readById: string | null;
  readAt: Timestamp | null;
  /** W demo odbiór SMS jest symulowany i musi być tak oznaczony. */
  isSimulated: boolean;
}

/** Prefiks rozpoznawany przez odbiornik. */
export const SMS_PREFIX = 'DP';

/** Limit treści — SMS ma być krótki i bez zbędnych danych medycznych. */
export const SMS_TEXT_MAX = 100;

export interface SmsBody {
  incidentId: string;
  entryId: string;
  text: string;
  coords: { lat: number; lon: number } | null;
}

/** Format: `DP <zdarzenie> #<wpis> <treść> [GPS:lat,lon]`. Bez nazwisk w treści. */
export function formatSmsBody(body: SmsBody): string {
  const text = body.text.replace(/\s+/g, ' ').trim().slice(0, SMS_TEXT_MAX);
  const gps = body.coords ? ` GPS:${body.coords.lat.toFixed(5)},${body.coords.lon.toFixed(5)}` : '';
  return `${SMS_PREFIX} ${body.incidentId} #${body.entryId} ${text}${gps}`;
}

/** Zwraca null, gdy wiadomość nie ma wymaganego formatu — wtedy trafia do ręcznej weryfikacji. */
export function parseSmsBody(raw: string): SmsBody | null {
  const match = /^\s*DP\s+(\S+)\s+#(\S+)\s*(.*?)\s*(?:GPS:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))?\s*$/is.exec(raw);
  if (!match) return null;
  const [, incidentId, entryId, text, lat, lon] = match;
  if (!incidentId || !entryId) return null;
  return {
    incidentId: incidentId.toUpperCase(),
    entryId,
    text: text ?? '',
    coords: lat && lon ? { lat: Number(lat), lon: Number(lon) } : null,
  };
}
