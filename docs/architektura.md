# Mapa repozytorium na dokument

| Katalog | Sekcja DO_PRZYJAZDU.md | Zakres |
|---|---|---|
| `packages/shared/src/model` | 11 „Minimalne obiekty danych” | Zdarzenie, dostęp świadka, obserwacja, instrukcja, potwierdzenie, wyposażenie, przekazanie |
| `packages/shared/src/sync` | 10 „Reguły synchronizacji” | Koperta wpisu, stany kolejki, reguły jako dane |
| `apps/api/src/db/migrations` | 11 | Schemat SQLite |
| `apps/api/src/auth` | 11 „Dostęp i dane”, 5 | Token świadka, logowanie panelu, role |
| `apps/api/src/routes` | 6 | Funkcje wymagane MVP |
| `apps/api/src/services` | 10, 7 | Idempotencja, wersje instrukcji, braki, raport przekazania |
| `apps/api/src/ai` | 9 | Szkic podsumowania i jego ograniczenia |
| `apps/web/src/witness` | 7 „Telefon świadka” | Wejście, bieżąca czynność, obserwacje, pasek łączności, SMS |
| `apps/web/src/dispatcher` | 7 „Panel dyspozytora” | Przegląd, instrukcje, zgłoszenia, oś czasu |
| `apps/web/src/handover` | 7 „Widok przekazania” | Raport i potwierdzenie przejęcia |
| `apps/web/src/offline` | 10 | Service Worker, IndexedDB, kolejka, synchronizacja |
| `apps/api/tests` | 14 | Checklista sprawdzeń |

## Granice techniczne przyjęte w prototypie

- Aktualizacje panelu przez odpytywanie API, bez WebSocketów.
- SQLite na jednym serwerze z trwałym dyskiem.
- Odbiór SMS wymaga uzgodnionego numeru i odbiornika; w demo symulowany i oznaczony.
- Brak integracji z dronem, HealthKit i systemami TOPR.
