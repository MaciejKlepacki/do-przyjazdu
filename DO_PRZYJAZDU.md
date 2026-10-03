# Do przyjazdu

## 1. Pomysł w jednym zdaniu

**Do przyjazdu pomaga osobie obecnej przy poszkodowanym wykonywać instrukcje dyspozytora podczas oczekiwania na ratowników, a zespołowi ratowniczemu przekazuje historię obserwacji i wykonanych czynności.**

Dokument opisuje koncepcję i plan prototypu na HackYeah 2026. Nie potwierdza istnienia implementacji, integracji z TOPR ani skuteczności klinicznej.

| Element | Założenie |
|---|---|
| Główny użytkownik | Świadek zdarzenia lub towarzysz poszkodowanego |
| Użytkownik prowadzący | Dyspozytor lub ratownik prowadzący kontakt |
| Użytkownik przejmujący | Ratownik docierający na miejsce |
| Moment użycia | Po nawiązaniu kontaktu ze służbą ratunkową, podczas oczekiwania na pomoc |
| Główna kategoria | Sport & Healthcare; dopasowanie do pełnego briefu wymaga sprawdzenia |
| Alternatywny kierunek | Defence, jeśli nacisk zostanie położony na ciągłość działania przy utracie łączności |
| Zasób zespołu | Lekarz przygotowujący scenariusze i oceniający zachowanie prototypu |
| Podstawowe urządzenia | Telefon świadka i komputer lub telefon dyspozytora |

## 2. Skąd wynika pomysł

W transkrypcji prezentacji TOPR opisano akcje, w których:

- ratownicy docierali do poszkodowanego dopiero po dłuższym czasie;
- pogoda lub zagrożenie lawinowe ograniczały możliwość natychmiastowej ewakuacji;
- drony dostarczały wyposażenie medyczne lub survivalowe;
- osoby oczekujące na pomoc musiały przetrwać do kolejnego dnia;
- turyści obecni na miejscu uczestniczyli w zabezpieczaniu poszkodowanego.

**Wniosek projektowy:** warto usprawnić prowadzenie świadka, potwierdzanie wykonania czynności i przekazanie informacji kolejnemu ratownikowi.

**Hipoteza wymagająca rozmowy z TOPR:** informacje o stanie poszkodowanego, poleceniach i wykonanych czynnościach mogą być trudne do utrzymania w jednej aktualnej historii. Prezentacja nie potwierdza, że TOPR nie ma już narzędzia realizującego taki przepływ.

Prelegent opisał istniejące mapy, system zarządzania zdarzeniami i technologie dronowe. Projekt powinien mieć mały, konkretny zakres, który można później dołączyć do istniejącego procesu.

## 3. Problem i proponowana wartość

### Problem

Podczas oczekiwania na pomoc świadek może być zestresowany, mieć ograniczone wyposażenie i niestabilne połączenie. Dyspozytor potrzebuje wiedzieć, czy polecenie zostało zrozumiane i wykonane. Ratownik docierający na miejsce potrzebuje szybko odtworzyć dotychczasowy przebieg zdarzenia.

### Co zmienia produkt

| Potrzeba | Odpowiedź produktu |
|---|---|
| Zapamiętanie poleceń | Krótkie, zapisane instrukcje, po jednej na ekranie |
| Ustalenie, czy coś wykonano | Potwierdzenie wykonania lub zgłoszenie trudności |
| Zauważenie nowych informacji | Obserwacje zapisane z czasem i wskazaniem autora |
| Ocena aktualności sytuacji | Widoczny czas ostatniej otrzymanej aktualizacji |
| Praca podczas przerwy w internecie | Dostęp do wcześniej pobranych instrukcji i lokalny zapis odpowiedzi |
| Przejęcie poszkodowanego | Jedna uporządkowana historia zamiast odtwarzania wszystkich rozmów |

### Różnica względem istniejących rozwiązań

Aplikacja Ratunek umożliwia wezwanie pomocy i przekazanie lokalizacji. Do przyjazdu koncentruje się na dalszym etapie: prowadzeniu świadka i przekazaniu informacji podczas oczekiwania.

Wyróżnikiem ma być zamknięty przepływ:

**Polecenie → potwierdzenie lub trudność → nowa obserwacja → przegląd dyspozytora → przekazanie ratownikowi.**

Przed przedstawieniem tego jako nowości trzeba sprawdzić funkcje obecnych narzędzi ratowników.

## 4. Główny scenariusz

Scenariusz demonstracyjny jest fikcyjny i wymaga opracowania szczegółów przez lekarza.

1. Dwie osoby znajdują się na górskim szlaku. Jedna jest poszkodowana. Towarzysz nawiązał już kontakt ze służbą ratunkową.
2. Dyspozytor tworzy sesję zdarzenia i przekazuje link osobie na miejscu.
3. Świadek otwiera stronę bez zakładania konta. Potwierdza, że dołączył do właściwego zdarzenia.
4. Odpowiada na kilka krótkich pytań przygotowanych dla scenariusza, m.in. o obserwowany stan i dostępne wyposażenie.
5. Dyspozytor przegląda odpowiedzi i zatwierdza przygotowany zestaw instrukcji.
6. Świadek wykonuje czynności i oznacza ich rezultat: „wykonane”, „nie mogę wykonać” lub „potrzebuję wyjaśnienia”.
7. W scenariuszu dron dostarcza pakiet. Dyspozytor wskazuje pakiet i przekazuje instrukcje dotyczące jego użycia.
8. Świadek traci internet. Nadal widzi wcześniej pobrane instrukcje. Jego nowe odpowiedzi zostają zapisane lokalnie.
9. Po odzyskaniu połączenia zapisane odpowiedzi trafiają do centrali. Dyspozytor widzi czas ich zapisania oraz czas otrzymania.
10. Ratownik docierający na miejsce otwiera widok przekazania i przegląda historię zdarzenia.

**Istotna granica:** brak internetu uniemożliwia otrzymanie nowych poleceń i przekazanie aktualizacji na bieżąco. Produkt musi to wyraźnie pokazać obu stronom.

## 5. Użytkownicy i uprawnienia

| Rola | Może | Granica |
|---|---|---|
| Świadek | Odczytać udostępnione instrukcje, zapisać obserwacje, potwierdzić czynność | Dostęp wyłącznie do swojej sesji i informacji potrzebnych na miejscu |
| Dyspozytor | Utworzyć sesję, przeglądać dane, zatwierdzić lub wycofać instrukcje, obsłużyć zgłoszenie | Decyzje mają autora i czas |
| Ratownik przejmujący | Odczytać historię, potwierdzić przejęcie | Dostęp do przydzielonego zdarzenia |
| Lekarz w zespole projektowym | Opracować scenariusze i ocenić prototyp | Rola przy tworzeniu demo nie oznacza automatycznie uprawnień w przyszłej służbie |

W MVP jeden dyspozytor prowadzi jedno zdarzenie z jednym świadkiem. Obsługa wielu poszkodowanych i równoległych zmian dyspozytora pozostaje poza zakresem.

## 6. Zakres MVP

### Funkcje wymagane

1. **Utworzenie sesji:** identyfikator, krótki opis, prowadzący i status zdarzenia.
2. **Link dla świadka:** ograniczony do jednej sesji, możliwy do unieważnienia.
3. **Krótki formularz obserwacji:** pola i odpowiedzi ustalone dla scenariusza przez lekarza; dostępna odpowiedź „nie wiem”.
4. **Instrukcje zatwierdzane przez dyspozytora:** autor, wersja, czas zatwierdzenia i status.
5. **Potwierdzenia wykonania:** wykonane, niewykonalne, wymaga wyjaśnienia.
6. **Zgłoszenie zmiany sytuacji:** krótki opis trafiający do panelu prowadzącego.
7. **Oś czasu:** obserwacje, polecenia, potwierdzenia i zmiany statusu.
8. **Działanie po utracie internetu:** dostęp do pobranej treści i kolejka niewysłanych odpowiedzi.
9. **Widok przekazania:** najważniejsze dane, braki informacji i chronologiczny przebieg.
10. **Tryb demonstracyjny:** fikcyjne dane i wyraźne oznaczenie symulacji.

### Funkcje opcjonalne, po domknięciu MVP

- AI przygotowujące szkic podsumowania z odnośnikami do wpisów w osi czasu.
- Dodatkowy zestaw instrukcji przypisany do pakietu dostarczonego dronem.
- Odczyt wybranych danych z Apple Watch wraz z czasem pomiaru i źródłem.
- Eksport historii do prostego pliku.

### Poza zakresem hackathonu

- Automatyczne diagnozowanie i dobieranie leczenia.
- Samodzielne generowanie instrukcji medycznych przez model.
- Automatyczne powiadamianie prawdziwych służb lub deklarowana integracja z numerami alarmowymi.
- Sterowanie dronem, planowanie lotu i integracja z jego telemetrią.
- Pełny system zarządzania akcjami ratunkowymi.
- Własna łączność mesh lub komunikacja bez infrastruktury sieciowej.
- Integracja z systemami TOPR bez uzgodnionego dostępu.
- Rozbudowany świat VR i obsługa wielu przypadków medycznych.

## 7. Ekrany i interakcje

### Telefon świadka

**Ekran wejścia:** oznaczenie trybu demo, identyfikator zdarzenia i potwierdzenie dołączenia.

**Ekran bieżącej czynności:** jedna instrukcja, duży tekst, jej wersja i trzy przyciski odpowiedzi. Treść może zawierać ilustrację przygotowaną dla scenariusza.

**Ekran obserwacji:** kilka jednoznacznych pytań i możliwość podania krótkiej dodatkowej informacji. Formularz nie powinien zmuszać świadka do stawiania diagnozy.

**Stały pasek łączności:** „Połączono”, „Brak internetu” lub „Oczekiwanie na potwierdzenie wysyłki”. Widoczna liczba niewysłanych wpisów i czas ostatniej synchronizacji.

**Zgłoszenie zmiany:** łatwo dostępny przycisk. Po zapisie strona rozróżnia „zapisano na urządzeniu” i „otrzymano w centrali”.

### Panel dyspozytora

- Krótki opis zdarzenia i czas ostatniej otrzymanej aktualizacji.
- Odpowiedzi świadka z informacją o brakach i źródle.
- Lista instrukcji do zatwierdzenia, zmiany lub wycofania.
- Zgłoszenia wymagające przeglądu, z ręcznym potwierdzeniem obsługi.
- Oś czasu i przejście do widoku przekazania.

### Widok przekazania

- Ostatnie otrzymane obserwacje, z czasem ich zapisania.
- Zatwierdzone instrukcje i zgłoszone rezultaty.
- Dostępne lub dostarczone wyposażenie.
- Niewyjaśnione trudności i brakujące informacje.
- Okresy bez kontaktu.
- Przycisk potwierdzenia przejęcia zdarzenia.

Podstawowy widok powinien powstawać bez AI z uporządkowanych danych. Dzięki temu awaria modelu nie blokuje przekazania.

## 8. Zasady treści medycznych i rola lekarza

Lekarz przygotowuje jeden scenariusz, pytania, tekst instrukcji i oczekiwane reakcje systemu. Wskazuje także przypadki, których aplikacja nie potrafi obsłużyć i które wymagają bezpośredniego kontaktu z prowadzącym akcję.

W prototypie:

- świadek otrzymuje instrukcję dopiero po zatwierdzeniu jej przez dyspozytora;
- system odróżnia obserwację świadka, pomiar urządzenia i ocenę osoby prowadzącej;
- odpowiedź „nie wiem” pozostaje brakiem danych;
- brak nowych informacji nie oznacza, że stan poszkodowanego się nie zmienił;
- wpisu nie usuwa się z historii; poprawka ma własny czas i autora;
- uczestnicy demo używają fikcyjnych danych i odgrywają sytuację;
- nagłe zmiany w demo ocenia lekarz lub osoba odgrywająca dyspozytora.

Opracowanie scenariusza przez lekarza w zespole jest walidacją treści demonstracyjnych. Przed pilotażem potrzebne jest uzgodnienie procedur i odpowiedzialności z organizacją ratowniczą.

## 9. Rola AI

AI jest dodatkiem do uporządkowanej historii zdarzenia.

| Zastosowanie | Wejście | Wynik | Kontrola |
|---|---|---|---|
| Porządkowanie wypowiedzi | Tekst wpisany przez świadka | Propozycja przypisania informacji do pól | Zachowany oryginał; użytkownik sprawdza propozycję |
| Podsumowanie przekazania | Obserwacje, instrukcje i potwierdzenia | Szkic krótkiej historii | Odnośniki do wpisów; zatwierdzenie przez prowadzącego |
| Wskazanie braków | Formularz i oczekiwane pola | Lista informacji, których nie otrzymano | Bez dopowiadania odpowiedzi |

Model nie może zmieniać statusu instrukcji, zatwierdzać decyzji ani dopisywać faktów do historii. Szkic wygenerowany przez AI jest osobnym obiektem, a nie nową obserwacją.

Na hackathonie warto zacząć od podsumowania. Rozpoznawanie mowy i przetwarzanie rozmów telefonicznych zwiększają zakres i pozostają poza podstawowym MVP.

## 10. Działanie bez internetu

### Co działa

Po pierwszym poprawnym otwarciu sesji i pobraniu wymaganych zasobów telefon przechowuje:

- interfejs potrzebny do obsługi zdarzenia;
- ostatnią pobraną wersję zatwierdzonych instrukcji;
- lokalne odpowiedzi i obserwacje;
- kolejkę wpisów oczekujących na wysłanie.

### Co wymaga połączenia

- Pierwsze otwarcie linku i pobranie sesji.
- Otrzymanie nowej instrukcji lub informacji o jej wycofaniu.
- Przekazanie obserwacji przez internet i potwierdzenie jej odbioru tą drogą.
- Generowanie podsumowania przez zewnętrzną usługę AI.

### Awaryjny kanał: SMS

Jeśli świadek dodzwonił się do służb przez sieć komórkową, ale transmisja danych nie działa, aplikacja może zaproponować wysłanie krótkiego SMS-a. Udane połączenie głosowe zwiększa szansę, że SMS zadziała, ale nie gwarantuje jego doręczenia. Wiadomość może być opóźniona, a telefon może mieć zasięg pozwalający tylko na połączenia alarmowe.

**Możliwy przepływ:**

1. Świadek wybiera „Wyślij aktualizację SMS-em”.
2. Telefon otwiera systemową aplikację Wiadomości z przygotowanym, krótkim tekstem. Świadek sprawdza treść i sam wysyła wiadomość.
3. SMS trafia na numer techniczny lub urządzenie dyżurne uzgodnione z operatorem rozwiązania.
4. Odbiornik przypisuje wiadomość do sesji, zapisuje źródło i czas odbioru oraz przekazuje wpis do panelu.
5. Panel wyświetla, że wiadomość odebrano, i wymaga osobnego potwierdzenia, że prowadzący ją przeczytał.
6. Pełna historia synchronizuje się przez internet, gdy transmisja danych wróci.

W prototypie SMS może zawierać jedynie identyfikator testowego zdarzenia, krótką odpowiedź i wybrane współrzędne. Treść i lokalizację świadek sprawdza przed wysłaniem. Nie umieszczać w SMS-ie nazwiska ani zbędnych informacji medycznych. SMS należy traktować jako zwykłą wiadomość tekstową, a nie szyfrowany kanał.

**Ograniczenia:** przeglądarka nie powinna wysyłać SMS-a w tle bez wiedzy użytkownika. Numer odbiorczy, obsługa odpowiedzi, sposób powiązania z właściwą akcją i zasady przetwarzania wiadomości wymagają uzgodnienia z ratownikami. Nie zakładać, że SMS wysłany przez telefon automatycznie dotrze do panelu. W działającym produkcie potrzebny jest odbiornik SMS i odpowiednia integracja; hackathonowe demo może symulować przyjęcie wiadomości, ale musi oznaczyć symulację.

Status pokazywany użytkownikowi powinien rozróżniać: **przygotowano**, **otwarto aplikację SMS**, **wysłano z telefonu** (jeśli system udostępnia tę informację), **odebrano przez centralę**, **przeczytano przez prowadzącego**. Potwierdzenie dostarczenia SMS-a nie oznacza, że ratownik przeczytał informację ani podjął działanie.

SMS nie rozwiązuje sytuacji bez zasięgu sieci komórkowej. Wtedy aplikacja może wyświetlać pobrane wcześniej materiały i zapisywać notatki lokalnie; nie może twierdzić, że wezwała pomoc lub przekazała lokalizację.

### Reguły synchronizacji

1. Każdy lokalny wpis otrzymuje unikalny identyfikator i numer kolejności na urządzeniu.
2. Serwer przyjmuje ponowiony wpis tylko raz.
3. System zapisuje oddzielnie czas podany przez urządzenie i czas otrzymania przez serwer. Zegar telefonu może być błędny.
4. Odpowiedź świadka odnosi się do konkretnej wersji instrukcji.
5. Potwierdzenie starszej instrukcji pozostaje w historii, ale nie potwierdza wykonania nowszej wersji.
6. Aktualizacja instrukcji nie nadpisuje lokalnej historii.
7. Po odzyskaniu internetu najpierw sprawdzany jest dostęp i aktualny stan sesji, następnie synchronizowane są wpisy.
8. SMS z odbiornika jest osobnym zdarzeniem osi czasu. Nie zastępuje oryginalnego wpisu na telefonie; po późniejszej synchronizacji można je powiązać po identyfikatorze wpisu.
9. Odpowiedź SMS musi wskazywać sesję i wpis, do którego się odnosi. Nieznana lub błędna wiadomość trafia do ręcznej weryfikacji, nie do automatycznie wybranego zdarzenia.

**Wycofanie instrukcji podczas braku internetu:** urządzenie nie pozna tej zmiany do czasu ponownego połączenia. Interfejs pokazuje, kiedy treść została ostatnio pobrana. Zasady korzystania z instrukcji podczas utraty kontaktu muszą zostać określone w scenariuszu i uzgodnione przed pilotażem.

Unieważnienie linku nie usuwa automatycznie danych z urządzenia pozostającego bez połączenia. Zakończenie demo powinno obejmować wyczyszczenie lokalnej sesji. Zachowanie pamięci przeglądarki trzeba sprawdzić na rzeczywistych telefonach.

## 11. Proponowana architektura prototypu

Wybór technologii jest propozycją dla zespołu. W katalogu znajdują się materiały researchowe; dokument nie zakłada istniejącej aplikacji.

```text
Telefon świadka — aplikacja webowa / PWA
  ├─ pobrane instrukcje i lokalna historia
  ├─ API przez HTTPS ───────────────────────► Backend
  └─ aplikacja SMS, uruchomiona przez świadka
       └─ sieć komórkowa ──► uzgodniony odbiornik SMS ──► Backend

Backend
  ├─ dostęp do sesji i uprawnienia
  ├─ instrukcje, obserwacje i potwierdzenia
  ├─ trwała oś czasu i synchronizacja
  └─ opcjonalne przygotowanie szkicu przez AI
              │
              ▼
Panel dyspozytora i widok ratownika
```

### Minimalny stos

- Frontend: TypeScript i React, widoki dopasowane do telefonu oraz komputera.
- Praca lokalna: Service Worker do zasobów i IndexedDB do kolejki oraz pobranych danych.
- Backend: Node.js i API z kontrolą uprawnień po stronie serwera.
- Baza: SQLite na jednym serwerze z trwałym dyskiem, wystarczająca dla demonstracji.
- Aktualizacje panelu: odpytywanie API co kilka sekund; po zapisie jawne potwierdzenie odbioru.
- SMS: poza podstawowym MVP; do realnego odbioru potrzebny jest uzgodniony numer i odbiornik wiadomości. Link `sms:` może jedynie otworzyć aplikację SMS z przygotowaną treścią i wymaga działania świadka.
- Hosting: środowisko zapewniające HTTPS i trwałość bazy. Ostateczny wybór zależy od dostępnego środowiska zespołu.

Nie trzeba budować WebSocketów, aby pokazać wartość MVP. Nie należy polegać na działaniu strony w tle: testowany przepływ zakłada otwartą aplikację i synchronizację także po powrocie do niej.

### Minimalne obiekty danych

| Obiekt | Najważniejsze pola |
|---|---|
| Zdarzenie | ID, opis, status, prowadzący, czas utworzenia i zakończenia |
| Dostęp świadka | Zdarzenie, skrót tokenu dostępu, ważność, status unieważnienia |
| Obserwacja | ID wpisu, zdarzenie, autor, źródło, treść, czas urządzenia, czas odbioru, kolejność |
| Instrukcja | ID, zdarzenie, wersja, treść, autor, zatwierdzający, status, czas zatwierdzenia |
| Potwierdzenie | ID wpisu, instrukcja i wersja, rezultat, komentarz, oba czasy |
| Wyposażenie | Pozycja, deklarowana dostępność lub dostawa, autor i czas wpisu |
| Przekazanie | Zdarzenie, osoba przejmująca, czas, zatwierdzone podsumowanie |

### Dostęp i dane

- Panel prowadzącego wymaga uwierzytelnienia; sam adres panelu nie zapewnia uprawnień.
- Token świadka ma dostęp tylko do jednej sesji. Link świadka i dostęp dyspozytora są oddzielne.
- Backend weryfikuje rolę przy każdym odczycie i zapisie.
- Link zawiera losowy token, bez nazwiska, objawów i innych danych medycznych w adresie.
- W demo przechowywane są wyłącznie fikcyjne informacje.
- Przed użyciem z prawdziwymi danymi trzeba uzgodnić zakres dostępu, okres przechowywania i usuwanie danych z operatorem rozwiązania.

## 12. Apple Watch, Meta Quest i drony

### Apple Watch

Opcjonalne źródło wybranych pomiarów, np. tętna. Każdy pomiar ma typ, wartość, jednostkę, źródło i czas. Stary pomiar nie jest prezentowany jako bieżący.

Odczyt przez HealthKit wymaga osobnej integracji natywnej i zgód użytkownika; podstawowe demo webowe jej nie zakłada. Jeśli pokazujemy dane testowe, są oznaczone jako symulacja.

Projekt nie wyciąga rozpoznania hipotermii z temperatury nadgarstka. Dokumentacja Apple opisuje nocny pomiar temperatury nadgarstka; nie stanowi to podstawy do proponowania takiej diagnostyki.

### Meta Quest

Może posłużyć później do szkolenia z tego samego scenariusza. W podstawowym MVP wystarczają dwa telefony lub telefon i laptop. Budowanie VR ma sens dopiero po ukończeniu głównego przepływu.

### Dron

W demo dostawa pakietu jest zdarzeniem wpisanym przez dyspozytora. Można pokazać fizyczny rekwizyt z identyfikatorem pakietu. Prototyp nie komunikuje się z dronem i nie potwierdza rzeczywistej dostawy automatycznie.

## 13. Demonstracja konkursowa

### Zestaw

- Telefon świadka i laptop dyspozytora.
- Jedno fikcyjne zdarzenie przygotowane przez lekarza.
- Rekwizyt przedstawiający dostarczony pakiet.
- Możliwość wyłączenia internetu na telefonie.
- Dane demonstracyjne przywracane przed każdą próbą.

### Przebieg, około 3 minut

| Czas | Pokaz | Co udowadniamy |
|---|---|---|
| 0:00–0:20 | Krótkie przedstawienie sytuacji oczekiwania na pomoc | Konkretny użytkownik i moment użycia |
| 0:20–0:50 | Otwarcie sesji i zapis obserwacji | Ten sam wpis pojawia się w centrali |
| 0:50–1:20 | Zatwierdzenie instrukcji i potwierdzenie wykonania | Prowadzący widzi rezultat polecenia |
| 1:20–1:40 | Dodanie dostawy pakietu i kolejnej instrukcji | Wyposażenie jest powiązane z działaniem |
| 1:40–2:20 | Utrata internetu, lokalny wpis i odzyskanie połączenia | Rozróżnienie zapisu lokalnego od odbioru w centrali |
| 2:20–3:00 | Widok przekazania | Ratownik otrzymuje uporządkowaną historię |

Jeśli formularz konkursowy wymaga filmu do 60 sekund, skrócić pokaz do: obserwacja → instrukcja → utrata internetu → synchronizacja → przekazanie.

### Jedno zdanie do pitchu

> Pomoc została wezwana, ale ratownicy jeszcze nie dotarli. Do przyjazdu pomaga świadkowi wykonać polecenia dyspozytora i przekazuje przybywającemu zespołowi historię tego, co wydarzyło się podczas oczekiwania.

## 14. Sprawdzenie prototypu

Przed zgłoszeniem sprawdzić poniższe scenariusze na rzeczywistych urządzeniach.

| Sprawdzenie | Oczekiwany rezultat |
|---|---|
| Poprawna ścieżka | Obserwacja, instrukcja i potwierdzenie pojawiają się w historii |
| Brak zatwierdzenia | Świadek nie otrzymuje szkicu instrukcji |
| Odpowiedź „nie wiem” | System zachowuje brak informacji |
| Utrata internetu po pobraniu | Treść pozostaje dostępna, nowy wpis zapisuje się lokalnie |
| Zamknięcie i ponowne otwarcie strony | Lokalny wpis i pobrana sesja pozostają dostępne w testowanym środowisku |
| Odzyskanie połączenia | Kolejka zostaje wysłana, panel pokazuje czas odbioru |
| Ponowiona wysyłka | Wpis występuje tylko raz |
| Nowa wersja instrukcji | Potwierdzenie starszej wersji nie potwierdza nowszej |
| Stare dane | Panel pokazuje ich wiek i brak aktualnego kontaktu |
| Unieważniony link przy połączeniu | Serwer odmawia dalszego dostępu |
| Próba dostępu do innej sesji | Backend odmawia odczytu i zapisu |
| Niedostępne AI | Historia i podstawowy widok przekazania nadal działają |
| Brak internetu, sieć SMS działa | Świadek może przygotować i ręcznie wysłać SMS; prototyp pokazuje jasno, czy odbiornik go faktycznie odebrał |
| SMS niedoręczony lub błędny | Wpis nie jest oznaczony jako dostarczony do centrali; wymaga ponowienia lub innego kontaktu |
| Nieznany identyfikator sesji w SMS-ie | Wiadomość trafia do ręcznej weryfikacji i nie jest dopisywana do innej akcji |

### Co zmierzyć

- Czas odnalezienia ostatniej otrzymanej obserwacji przez osobę przejmującą zdarzenie.
- Liczbę pominiętych istotnych informacji w przekazaniu, według listy lekarza.
- Czy świadek odróżnia wpis zapisany lokalnie od odebranego przez centralę.
- Czy ponowienia i przerwy w połączeniu powodują utratę lub duplikację danych.

Można porównać przekazanie przez prototyp z odczytem tych samych informacji z przygotowanej chaotycznej notatki. Wynik ma charakter demonstracyjny: podać liczbę uczestników, przypadków i sposób pomiaru. Nie przedstawiać go jako dowodu skrócenia akcji ratunkowej ani poprawy przeżywalności.

## 15. Podział pracy i kolejność realizacji

| Osoba | Odpowiedzialność |
|---|---|
| Osoba techniczna 1 | Telefon świadka, lokalny zapis i synchronizacja |
| Osoba techniczna 2 | Panel dyspozytora i widok przekazania |
| Osoba techniczna 3 | Backend, dostęp, historia, integracja i uruchomienie demo |
| Lekarz | Scenariusz, pytania i instrukcje, ocena zachowania, przygotowanie demonstracji |

Podział zakłada pracę całego zespołu nad tym projektem. Jeśli część zespołu realizuje inne zgłoszenie, ograniczyć MVP i przydzielić temu projektowi konkretnego właściciela.

### Kolejność

1. Rozmowa z ratownikiem: potwierdzenie potrzeby i ograniczeń procesu.
2. Jeden scenariusz i zamknięta lista ekranów oraz danych.
3. Działająca ścieżka online od obserwacji do przekazania.
4. Trwała historia, uprawnienia i rozróżnienie wersji instrukcji.
5. Lokalny zapis i kontrolowana synchronizacja.
6. Próby na telefonach, poprawki i przygotowanie materiałów konkursowych.
7. AI lub Apple Watch tylko przy rezerwie czasu.

### Kryteria obcięcia zakresu

- Jeśli główny przepływ nie działa, usunąć AI, Watch, eksport i dodatkowe scenariusze.
- Jeśli nie uda się sprawdzić pracy bez internetu, nie obiecywać jej w zgłoszeniu. Zostawić uczciwy wariant online.
- Jeśli ratownicy mają już cały proponowany przepływ, wybrać wskazaną przez nich pojedynczą trudność, np. przekazanie historii lub obsługę pakietu.
- Jeśli nie ma możliwości konsultacji, przedstawić prototyp jako hipotezę opracowaną na podstawie prezentacji i scenariusza lekarza.

## 16. Pytania do TOPR i mentorów

1. Jak dziś przekazujecie instrukcje osobie oczekującej na ratowników?
2. Jak zapisujecie, że polecenie zostało wykonane albo było niewykonalne?
3. Co najczęściej ginie przy przekazaniu informacji ratownikowi docierającemu na miejsce?
4. Jak prowadzicie kontakt przy niestabilnym internecie i zasięgu telefonicznym?
5. Czy osoba na miejscu mogłaby realnie otworzyć stronę i obsługiwać kilka prostych przycisków?
6. Czy instrukcja użycia pakietu dostarczonego dronem jest przydatnym zakresem pierwszego pilotażu?
7. Kto powinien zatwierdzać treść i odpowiadać za prowadzenie sesji?
8. Jakie istniejące narzędzie już obsługuje część tego procesu?

## 17. Warunek ukończenia MVP

MVP jest gotowe do demonstracji, gdy drugi członek zespołu potrafi od początku przejść jeden scenariusz: otworzyć sesję, przesłać obserwację, otrzymać zatwierdzoną instrukcję, potwierdzić czynność i odczytać historię w widoku przekazania.

Jeśli zgłoszenie obejmuje działanie bez internetu, trzeba również pokazać utratę połączenia, lokalny zapis, ponowne otwarcie strony i synchronizację bez utraty ani duplikacji wpisu.

**Rezultat hackathonu:** działający prototyp procesu i sprawdzony scenariusz demonstracyjny. Kolejny krok to wspólne z ratownikami ustalenie, czy warto przeprowadzić kontrolowany pilotaż szkoleniowy.

## 18. Źródła i granice

- [Transkrypcja prezentacji TOPR](/Users/maciejklepacki/Downloads/TAURON_Arena_2_pol.txt) — przypadki oczekiwania na pomoc, transportów cargo i dostaw wyposażenia. Transkrypcja zawiera błędy rozpoznawania mowy; szczegóły operacyjne należy potwierdzić u prelegenta.
- [Research HackYeah 2026](/Users/maciejklepacki/Documents/ChatGPT/HackYeah/HACKYEAH_2026_RESEARCH.md) i [plan zespołu](/Users/maciejklepacki/Documents/ChatGPT/HackYeah/HACKYEAH_2026_PLAN_JUTRO.md) — kontekst konkursu i zespołu, przygotowany przed startem wydarzenia.
- [Kategorie HackYeah](https://hackyeah.pl/tasks-prizes) — publiczne opisy Sport & Healthcare i Defence. Dopasowanie oraz wymagane materiały trzeba sprawdzić z pełnym briefem na miejscu.
- [Fundacja GOPR: bezpieczeństwo](https://fundacja.gopr.pl/bezpieczenstwo/) — opis połączenia z ratownikiem i przekazania lokalizacji przez Ratunek; nie jest pełnym audytem funkcji aplikacji.
- [Apple: temperatura nadgarstka](https://support.apple.com/en-ie/guide/watch/-apd526d20feb/watchos) — granica proponowanego wykorzystania pomiarów.
- [Apple: konfiguracja HealthKit](https://developer.apple.com/documentation/xcode/configuring-healthkit-access) — kontekst osobnej integracji natywnej.

Przypadki medyczne, ekrany, model danych i architektura w tym dokumencie są propozycją projektu. Nie są procedurą TOPR ani uzgodnioną specyfikacją wdrożenia.
