/**
 * Reguły synchronizacji z sekcji 10. Trzymane jako dane, żeby testy
 * i checklista odwoływały się do tych samych identyfikatorów.
 */
export const SYNC_RULES = {
  UNIQUE_ENTRY_ID: 'Każdy lokalny wpis ma unikalny identyfikator i numer kolejności na urządzeniu.',
  ACCEPT_ONCE: 'Serwer przyjmuje ponowiony wpis tylko raz.',
  TWO_CLOCKS: 'Czas urządzenia i czas odbioru przez serwer zapisywane są oddzielnie.',
  ANSWER_BINDS_VERSION: 'Odpowiedź świadka odnosi się do konkretnej wersji instrukcji.',
  OLD_ACK_NOT_NEW: 'Potwierdzenie starszej instrukcji nie potwierdza nowszej wersji.',
  NO_LOCAL_OVERWRITE: 'Aktualizacja instrukcji nie nadpisuje lokalnej historii.',
  ACCESS_BEFORE_ENTRIES: 'Po odzyskaniu internetu najpierw sprawdzany jest dostęp i stan sesji, potem wpisy.',
  SMS_IS_SEPARATE_EVENT: 'SMS z odbiornika jest osobnym zdarzeniem osi czasu, nie zastępuje wpisu z telefonu.',
  SMS_NEEDS_SESSION_REF: 'SMS musi wskazywać sesję i wpis; nieznana wiadomość idzie do ręcznej weryfikacji.',
} as const;

export type SyncRuleId = keyof typeof SYNC_RULES;
