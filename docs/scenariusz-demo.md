# Scenariusz demonstracyjny

Pokaz na fikcyjnym zdarzeniu. Treść medyczną w `apps/api/src/scenario/demoScenario.ts` zatwierdza lekarz z zespołu. Ten dokument opisuje obsługę pokazu, nie jest źródłem poleceń medycznych.

Film do zgłoszenia ma osobny [scenariusz z czasami, działaniami na ekranie i pełnym komentarzem głosowym](scenariusz-filmu-demo.md), roboczo na około 2 minuty 30 sekund.

## Przygotowanie

1. Ustaw własne `DISPATCHER_PASSWORD` i `SESSION_SECRET` w `.env`.
2. Uruchom `npm run demo`. Jeden serwer podaje zbudowaną aplikację i API na `http://localhost:5174`; baza pokazu to `data/presentation.sqlite`.
3. Otwórz stronę główną i kliknij „Zobacz działające demo”. Zaloguj się jako `dyspozytor` hasłem z konfiguracji.
4. Kliknij „Rozpocznij pokaz”. Nowa próba tworzy osobne zdarzenie i przydziela konto `ratownik`. Poprzednia historia pozostaje dostępna w panelu.
5. Przeprowadź całą próbę przed wystąpieniem. Lekarz sprawdza treści pytań, poleceń i granice scenariusza. Nie wpisuj danych prawdziwych pacjentów.

## Sposób prowadzenia prezentacji

Najpierw problem i konkretna zmiana: informacje rozproszone w rozmowach zastępujemy wspólną historią zdarzenia. Potem natychmiast pokazujemy dowód na ekranie. Wstęp trwa około 45-60 sekund, a reszta czasu służy demonstracji. Gotowy wstęp jest w sekcji 7 przewodnika. Nie zaczynamy od technologii i nie omawiamy każdej funkcji.

## Pokaz, około 3 minut

| Czas | Co powiedzieć | Co zrobić |
|---|---|---|
| 0:00-0:20 | „Pomoc została wezwana. Problemem jest to, co dzieje się w czasie oczekiwania: polecenia, odpowiedzi i informacje, które trzeba przekazać na miejscu.” | Pokaż stronę główną, przejdź do przygotowanego demo. |
| 0:20-0:50 | „Świadek otwiera prywatny link bez zakładania konta. Dyspozytor widzi jego odpowiedzi.” | Na telefonie dołącz, wybierz Obserwacje, zapisz odpowiedzi i krótką fikcyjną notatkę. Pokaż jej odbiór w centrali. |
| 0:50-1:20 | „Na ekran trafia dopiero polecenie zatwierdzone przez dyspozytora. Odpowiedź dotyczy jego konkretnej wersji.” | W centrali wybierz Polecenia i zatwierdź pierwsze. Na telefonie wybierz Czynność, następnie Wykonane. Pokaż wynik w centrali. |
| 1:20-2:10 | „Zasięg znika. Świadek zachowuje pobrane polecenia i zapisuje wpis na telefonie. Centrala jeszcze go nie ma.” | Kliknij Wstrzymaj transmisję. W Obserwacjach zapisz inną notatkę. Pokaż niewysłany wpis i brak nowej notatki w centrali. Przywróć transmisję i zaczekaj na potwierdzenie odbioru. |
| 2:10-2:40 | „Czas zapisu i czas odbioru to dwie różne informacje. Historia nie udaje ciągłego połączenia.” | Otwórz Historię lub Przekazanie. Wskaż oba czasy, odpowiedzi, trudności i brakujące informacje. |
| 2:40-3:00 | „Ratownik przejmuje uporządkowaną historię zamiast odtwarzać wszystko od początku. Raport działa bez modelu językowego.” | Pokaż raport. Jeśli czas pozwala, na drugim koncie `ratownik` otwórz pełne przekazanie i potwierdź przejęcie. |

Przycisk przerwy w demo zatrzymuje rzeczywiste zapytania telefonu, pozostawiając centralę online. To kontrolowana symulacja, nie test utraty zasięgu fizycznego urządzenia. Aktualizacja centrali może zająć około 2 sekund. Przycisk nie zatrzymuje sesji otwartej na innym urządzeniu lub w osobnej karcie, więc podczas tej próby pozostaw otwarty tylko telefon wewnątrz demo.

## Wariant 60-sekundowy

Przygotuj wcześniej połączony telefon. Zapisz obserwację, zatwierdź polecenie, odpowiedz Wykonane, wstrzymaj transmisję i zapisz drugi wpis. Pokaż lokalną kolejkę, przywróć transmisję i otwórz Przekazanie. Nie pomijaj różnicy między zapisaniem na urządzeniu a odebraniem w centrali.

## Prawdziwy telefon i praca offline

Link „Otwórz osobno” prowadzi do tej samej sesji świadka. Na osobnym telefonie użyj dostępnego z niego adresu HTTPS i wcześniej otwórz sesję online, aby pobrać aplikację i polecenia. Dopiero potem wyłącz połączenie, dodaj wpis i ponownie otwórz stronę. Po odzyskaniu internetu wpis powinien uzyskać potwierdzenie odbioru, z osobnym czasem serwera.

`localhost` na telefonie wskazuje telefon, nie laptop. Samo udostępnienie serwera przez `--host 0.0.0.0` umożliwia dostęp w sieci lokalnej, ale zwykły adres HTTP nie zapewnia pełnej pracy PWA offline. Podczas przerwy świadek nie otrzymuje nowych poleceń, a centrala nie otrzymuje nowych wpisów. SMS w tym pokazie jest symulowany.

## Do zatwierdzenia przez lekarza

- Sytuacja wyjściowa, pytania i odpowiedzi, które świadek może podać bez diagnozowania.
- Treści i kolejność poleceń oraz właściwy moment ich zatwierdzenia.
- Instrukcje powiązane z pakietem, jeśli zespół włączy go do pokazu.
- Sytuacje wymagające bezpośredniego kontaktu z prowadzącym akcję.
- Informacje wymagane przy przekazaniu i dopuszczalne stwierdzenia podczas prezentacji.
