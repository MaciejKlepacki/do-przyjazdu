# Checklista sprawdzeń (sekcja 14)

Sprawdzać na rzeczywistych urządzeniach, nie tylko w emulatorze.

| # | Sprawdzenie | Oczekiwany rezultat | Test |
|---|---|---|---|
| 1 | Poprawna ścieżka | Obserwacja, instrukcja i potwierdzenie w historii | |
| 2 | Brak zatwierdzenia | Świadek nie otrzymuje szkicu instrukcji | `handover.test.ts` |
| 3 | Odpowiedź „nie wiem” | System zachowuje brak informacji | `handover.test.ts` |
| 4 | Utrata internetu po pobraniu | Treść dostępna, nowy wpis zapisany lokalnie | |
| 5 | Zamknięcie i ponowne otwarcie strony | Lokalny wpis i pobrana sesja dostępne | |
| 6 | Odzyskanie połączenia | Kolejka wysłana, panel pokazuje czas odbioru | `sync.test.ts` |
| 7 | Ponowiona wysyłka | Wpis występuje tylko raz | `sync.test.ts` |
| 8 | Nowa wersja instrukcji | Potwierdzenie starszej nie potwierdza nowszej | `sync.test.ts` |
| 9 | Stare dane | Panel pokazuje ich wiek i brak aktualnego kontaktu | |
| 10 | Unieważniony link przy połączeniu | Serwer odmawia dalszego dostępu | `access.test.ts` |
| 11 | Próba dostępu do innej sesji | Backend odmawia odczytu i zapisu | `access.test.ts` |
| 12 | Niedostępne AI | Historia i widok przekazania nadal działają | `handover.test.ts` |
| 13 | Brak internetu, sieć SMS działa | Świadek przygotuje i ręcznie wyśle SMS; UI pokazuje, czy centrala odebrała | |
| 14 | SMS niedoręczony lub błędny | Wpis nie oznaczony jako dostarczony | |
| 15 | Nieznany identyfikator sesji w SMS | Ręczna weryfikacja, bez dopisania do innej akcji | |

## Co zmierzyć

- Czas odnalezienia ostatniej obserwacji przez osobę przejmującą zdarzenie.
- Liczba pominiętych istotnych informacji w przekazaniu, według listy lekarza.
- Czy świadek odróżnia wpis zapisany lokalnie od odebranego przez centralę.
- Czy ponowienia i przerwy w połączeniu powodują utratę lub duplikację danych.

Wynik ma charakter demonstracyjny: podać liczbę uczestników, przypadków i sposób pomiaru.
Nie przedstawiać go jako dowodu skrócenia akcji ratunkowej ani poprawy przeżywalności.

## Warunek ukończenia MVP (sekcja 17)

Drugi członek zespołu przechodzi scenariusz od początku: otwiera sesję, przesyła obserwację,
otrzymuje zatwierdzoną instrukcję, potwierdza czynność i odczytuje historię w widoku przekazania.
Jeśli zgłoszenie obejmuje pracę bez internetu — także utrata połączenia, lokalny zapis,
ponowne otwarcie strony i synchronizacja bez utraty ani duplikacji wpisu.
