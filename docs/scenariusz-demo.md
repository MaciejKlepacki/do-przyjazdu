# Scenariusz demonstracyjny

Właściciel: lekarz w zespole (sekcja 8 i 15 dokumentu). Dane fikcyjne, uczestnicy odgrywają sytuację.

## Do uzupełnienia przez lekarza

1. **Sytuacja wyjściowa** — co widzi świadek w chwili otwarcia linku.
2. **Pytania formularza obserwacji** — treść, typ odpowiedzi, opcje. Przy każdym dostępne „nie wiem”.
   Pytania nie mogą wymagać diagnozy.
3. **Instrukcje** — kolejność, pełny tekst, ewentualna ilustracja, moment zatwierdzenia przez dyspozytora.
4. **Instrukcje do pakietu z drona** — osobny zestaw, powiązany z identyfikatorem pakietu.
5. **Oczekiwane reakcje systemu** — co powinno pojawić się w panelu po każdym kroku.
6. **Przypadki poza zakresem aplikacji** — sytuacje wymagające bezpośredniego kontaktu z prowadzącym akcję.
7. **Lista informacji istotnych przy przekazaniu** — podstawa pomiaru „liczba pominiętych informacji” (sekcja 14).

Treść z tego pliku jest źródłem dla `apps/api/src/db/seedDemo.ts`.

## Przebieg pokazu, ok. 3 minut

| Czas | Krok | Co udowadniamy |
|---|---|---|
| 0:00–0:20 | Przedstawienie sytuacji oczekiwania na pomoc | Konkretny użytkownik i moment użycia |
| 0:20–0:50 | Otwarcie sesji i zapis obserwacji | Ten sam wpis pojawia się w centrali |
| 0:50–1:20 | Zatwierdzenie instrukcji i potwierdzenie wykonania | Prowadzący widzi rezultat polecenia |
| 1:20–1:40 | Dostawa pakietu i kolejna instrukcja | Wyposażenie powiązane z działaniem |
| 1:40–2:20 | Utrata internetu, lokalny wpis, powrót połączenia | Rozróżnienie zapisu lokalnego od odbioru |
| 2:20–3:00 | Widok przekazania | Ratownik dostaje uporządkowaną historię |

Wariant 60-sekundowy: obserwacja → instrukcja → utrata internetu → synchronizacja → przekazanie.

## Zestaw

Telefon świadka, laptop dyspozytora, rekwizyt pakietu z identyfikatorem, możliwość wyłączenia
internetu w telefonie, `npm run demo:reset` przed każdą próbą.
