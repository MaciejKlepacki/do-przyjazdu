/** ISO 8601 w UTC. */
export type Timestamp = string;

/**
 * Dwa czasy przy każdym wpisie (reguła synchronizacji 3):
 * zegar telefonu może być błędny, więc czas urządzenia nie zastępuje czasu serwera.
 */
export interface DualTimestamps {
  /** Czas podany przez urządzenie świadka. Niepewny. */
  deviceTime: Timestamp;
  /** Czas przyjęcia wpisu przez serwer. Pusty, dopóki wpis leży w kolejce. */
  receivedTime: Timestamp | null;
}

/** Kto wprowadził informację. Rozróżnienie wymagane w sekcji 8. */
export type Author =
  | { kind: 'witness'; incidentId: string }
  | { kind: 'dispatcher'; userId: string }
  | { kind: 'responder'; userId: string }
  | { kind: 'system' };

/** Skąd pochodzi informacja: obserwacja człowieka, pomiar urządzenia, ocena prowadzącego. */
export type InformationSource =
  | 'witness-observation'
  | 'device-measurement'
  | 'dispatcher-assessment'
  | 'simulated';

/** Brak danych to osobny stan — odpowiedź „nie wiem” nie jest wartością (sekcja 8). */
export type MaybeKnown<T> = { known: true; value: T } | { known: false; reason: 'unknown' | 'not-asked' };

/** Kanał, którym wpis dotarł do centrali (sekcja 10). */
export type DeliveryChannel = 'https' | 'sms-inbound' | 'demo-seed';
