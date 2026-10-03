# Przewodnik po Do przyjazdu

Stan opisany 3 października 2026. Przewodnik dotyczy kodu tego repozytorium i lokalnego demo, a nie wdrożonego systemu ratunkowego.

## 1. Co właściwie budujemy

Do przyjazdu porządkuje czas od wezwania pomocy do przybycia ratowników. Świadek otwiera prywatny link, odpowiada na pytania i wykonuje polecenia zatwierdzone przez dyspozytora. Dyspozytor otrzymuje historię odpowiedzi i zgłoszeń. Ratownik na miejscu dostaje raport tego, co wiadomo, co zrobiono i czego nadal brakuje.

Zdanie do zapamiętania: „Polecenia dyspozytora, odpowiedzi świadka i jedna historia, która dociera do ratownika”.

Najważniejszy moment pokazu: zapisujesz wpis bez połączenia. Telefon pokazuje, że ma go lokalnie, centrala jeszcze go nie widzi. Dopiero po powrocie połączenia pojawia się potwierdzenie odbioru. To najłatwiejszy sposób pokazania wartości projektu.

## 2. Marka i sposób przedstawiania

### Zasada prezentacji

Każda sekunda ma pracować na zrozumienie problemu i wartości rozwiązania. Kolejność: konkretna sytuacja, problem obecnego sposobu działania, zmiana wprowadzana przez Do przyjazdu, dowód w działającym demo i korzyść dla użytkownika. Technologie wyjaśniamy dopiero przy pytaniach.

Pokazujemy porównanie przed i po: bez wspólnej historii informacje trzeba odtwarzać z rozmów; z Do przyjazdu polecenia, odpowiedzi i zmiany pozostają zapisane i trafiają do raportu. Nie twierdzimy, że wcześniej nie istniały podobne narzędzia, ani nie podajemy niezmierzonych efektów. Dowodem jest przepływ pokazany na ekranie.

Wstęp powinien trwać około 45-60 sekund. Resztę czasu przeznaczamy na najważniejsze momenty: zatwierdzone polecenie, odpowiedź świadka, zapis przy przerwie, odbiór po powrocie transmisji i przekazanie historii ratownikowi. Każdy klik powinien pokazywać zmianę, o której właśnie mówimy.

Nazwa pozostaje „Do przyjazdu”. Jest zrozumiała po polsku i wskazuje konkretny moment użycia. Zmiana nazwy wymaga decyzji zespołu; na ten pokaz nie jest konieczna.

Hasło: „Pomoc jest w drodze. Kontakt zostaje”. Kontakt oznacza ciągłość współpracy i zachowaną historię. Nie oznacza stałego połączenia z centralą bez internetu. Na stronie wyjaśniamy tę granicę.

Znak to linia łącząca dwa punkty. Pomarańczowy punkt oznacza początek na miejscu zdarzenia, jasny punkt przekazanie dalej. Ciemna zieleń, jasne tło i pomarańczowy akcent tworzą wspólną identyfikację strony, panelu i PWA. Plik wektorowy: `apps/web/public/brand-symbol.svg`.

Gotowy krótki opis:

„Do przyjazdu pomaga zachować ciągłość informacji od wezwania pomocy do przejęcia zdarzenia na miejscu. Świadek otrzymuje polecenia zatwierdzone przez dyspozytora i zapisuje swoje odpowiedzi. Przy przerwie w internecie pobrane instrukcje i wpisy pozostają na telefonie, a po odzyskaniu połączenia kolejka trafia do centrali. Ratownik dostaje uporządkowaną historię, wyniki czynności i listę informacji, których wciąż brakuje”.

## 3. Użytkownicy i ich uprawnienia

| Osoba | Jak wchodzi | Co może zrobić |
|---|---|---|
| Świadek | Prywatny link `/w/:token`, bez konta | Odczytać zatwierdzone instrukcje swojej sesji, dodać obserwację, odpowiedzieć na polecenie, zgłosić zmianę. |
| Dyspozytor | Konto panelu | Prowadzić własne zdarzenia, zatwierdzać i wycofywać instrukcje, tworzyć nowe wersje, przeglądać zgłoszenia, zapisać wyposażenie i przydzielić ratownika. |
| Ratownik | Konto panelu i przydział | Odczytać przydzielone zdarzenie, historię i raport oraz potwierdzić przejęcie. Nie zarządza poleceniami. |

Konta `dyspozytor` i `ratownik` są kontami demonstracyjnymi. W prototypie korzystają z jednego hasła z konfiguracji. Role i przydziały sprawdza serwer, nie tylko widoczność przycisków.

## 4. Ekrany

- `/`: strona marki, problem, trzy role, wyjaśnienie pracy offline, wejście do demo.
- `/demo`: pokaz telefonu i centrali obok siebie, licznik czasu i etapy przepływu. Każda nowa próba tworzy osobne fikcyjne zdarzenie.
- `/w/:token`: właściwa aplikacja świadka. Czynność, Obserwacje i Moje wpisy. To ten sam komponent, który działa wewnątrz demo.
- `/dispatcher`: lista dostępnych zdarzeń i wejście do panelu.
- `/dispatcher/:id`: pełny panel danego zdarzenia, instrukcje, historia, obserwacje, wyposażenie i zgłoszenia.
- `/handover/:id`: pełny raport przekazania i potwierdzenie przejęcia przez przydzielonego ratownika.

„Odczyt raportu” w etapach demo oznacza otwarcie zakładki. Faktyczne przejęcie to osobna czynność ratownika na jego koncie, zapisywana na serwerze.

## 5. Uruchomienie bez niespodzianek

Wymagany jest Node.js obsługujący `node:sqlite`; lokalne próby wykonano na Node 24. Docker nie jest potrzebny.

Z katalogu DoPrzyjazdu:

```bash
npm ci
```

Jeśli nie masz jeszcze `.env`, skopiuj wzór. Nie nadpisuj istniejącej konfiguracji:

```bash
cp .env.example .env
```

Wpisz własne `DISPATCHER_PASSWORD` i `SESSION_SECRET`. Nie zapisuj ich w repozytorium i nie pokazuj podczas prezentacji.

```bash
npm run demo
```

Otwórz `http://localhost:5174`, kliknij „Zobacz działające demo” i zaloguj się jako `dyspozytor`. Hasło pochodzi z Twojej konfiguracji.

Polecenie sprawdza dostępność portu, buduje frontend, uruchamia migracje, przygotowuje konta i fikcyjne zdarzenie początkowe, a potem podaje aplikację i API jednym serwerem. Korzysta z osobnej bazy `data/presentation.sqlite`. Nie usuwa historii poprzednich prób. Nie korzysta z klucza modelu ani z prawdziwego numeru SMS.

Zajęty port:

```bash
npm run demo -- --port 5175
```

Wtedy otwórz `http://localhost:5175`. Nie zatrzymuj innych serwerów, żeby zwolnić port.

Tryb programistyczny jest osobny: `npm run dev` uruchamia API na 3000 i Vite na 5173. Wcześniej wykonaj migracje i seed standardowej bazy. Do prezentacji offline używaj zbudowanej aplikacji, a nie Vite dev.

## 6. Prezentacja krok po kroku

1. Pokaż hasło na stronie i wyjaśnij czas oczekiwania na pomoc. Nie zaczynaj od listy technologii.
2. Otwórz demo i kliknij „Rozpocznij pokaz”. Po lewej jest aplikacja świadka, po prawej centrala. To nie są obrazki ani zapisany film.
3. Kliknij „Tak, dołączam”. Zwróć uwagę na identyfikator zdarzenia.
4. W Obserwacjach wybierz odpowiedzi i dopisz fikcyjną notatkę, np. „Czekamy przy rozwidleniu szlaku”. Zapisz. Po około 2 sekundach pokaż tę samą notatkę w centrali.
5. W centrali otwórz Polecenia i zatwierdź pierwszą instrukcję ze scenariusza. Na telefonie wróć do Czynności. Wybierz Wykonane. Pokaż rezultat w centrali.
6. Kliknij Wstrzymaj transmisję. Dodaj kolejną fikcyjną obserwację. Pokaż licznik niewysłanych wpisów. Nowego wpisu nie powinno być jeszcze w centrali.
7. Kliknij Przywróć transmisję. Zaczekaj, aż licznik spadnie do zera i telefon pokaże potwierdzenie. W centrali pojawi się nowy wpis.
8. Otwórz Historię lub Przekazanie. Wskaż czas zapisu na telefonie i osobny czas odbioru przez serwer. Wskaż brakujące informacje i nierozwiązane trudności.
9. Jeśli pokazujesz faktyczne przejęcie, przejdź do pełnego raportu jako przydzielony `ratownik` i potwierdź je. Dwie karty tego samego profilu współdzielą logowanie panelu; do dwóch kont jednocześnie użyj osobnych profili przeglądarki lub drugiego urządzenia.

Nie musisz czekać na komunikat centrali o przerwie w kontakcie, aby pokazać lokalną kolejkę. Ten komunikat pojawia się po progu ciszy, domyślnie 30 sekund. Kolejka jest widoczna od razu po lokalnym zapisie.

Warianty czasowe i dokładne kwestie: `docs/scenariusz-demo.md`.

## 7. Gotowe wypowiedzi

### Wstęp, około 45-60 sekund

Wyobraźcie sobie wypadek na szlaku. Pomoc została wezwana, ratownicy są w drodze. Świadek dostaje polecenia, wykonuje je i zgłasza zmiany. Ale gdy znika zasięg albo zdarzenie przejmuje kolejna osoba, łatwo stracić część tej historii.

Do przyjazdu to zmienia. Świadek widzi polecenie zatwierdzone przez dyspozytora i zapisuje odpowiedź. Dyspozytor widzi, co dotarło do centrali. Gdy nie ma internetu, telefon zachowuje pobrane instrukcje i nowe wpisy. Po odzyskaniu połączenia wysyła kolejkę.

Ratownik na miejscu otrzymuje historię: co zaobserwowano, co wykonano i czego nadal nie wiadomo.

Teraz pokażemy tę zmianę: przerwiemy transmisję, zapiszemy wpis na telefonie i przywrócimy połączenie. Zobaczycie, jak wpis dociera do centrali i pojawia się w raporcie przekazania.

### Wypowiedź z demonstracją, około 3 minut

„Pomoc została wezwana, ale ratownicy jeszcze nie dotarli. W tym czasie świadek wykonuje polecenia, obserwuje sytuację i próbuje przekazać, co się zmieniło. Gdy przyjeżdża kolejna osoba, część tej historii trzeba odtwarzać od początku.

Do przyjazdu zachowuje tę historię. Po lewej mamy telefon świadka. Otwiera prywatny link bez zakładania konta. Po prawej dyspozytor widzi ten sam przypadek. Zapiszę krótką obserwację. Widać już, że dotarła do centrali.

Teraz dyspozytor zatwierdza polecenie. Świadek nie dostaje szkicu ani automatycznej porady. Dostaje zatwierdzoną wersję i może odpowiedzieć: wykonane, nie mogę albo potrzebuję wyjaśnienia. W centrali widać rezultat konkretnego polecenia.

Wstrzymam teraz transmisję telefonu. Zapiszę kolejny wpis. Telefon zachował go lokalnie, ale centrala jeszcze go nie ma. To ważne: lokalny zapis nie jest potwierdzeniem odbioru. Przywracam transmisję. Kolejka trafia na serwer i dopiero wtedy aplikacja potwierdza odbiór.

W raporcie widzimy oba czasy, ostatnie obserwacje, wykonane czynności i informacje, których nadal brakuje. Ratownik na miejscu może przejąć uporządkowaną historię. Ten raport powstaje ze zapisanych danych i działa bez modelu językowego.

Pokazujemy prototyp na fikcyjnym zdarzeniu. Nie wzywa on pomocy i nie jest zintegrowany ze służbami. Jego wartością jest ciągłość informacji w czasie oczekiwania i przy przekazaniu”.

## 8. Architektura prostymi słowami

Repozytorium jest monorepo: trzy części rozwijane razem przez npm workspaces.

| Część | Rola | Najważniejsze pliki |
|---|---|---|
| `apps/web` | Interfejs React i PWA w przeglądarce | `src/routes.tsx`, `src/witness/WitnessApp.tsx`, `src/demo/DemoStudio.tsx` |
| `apps/api` | Serwer Express, dostęp, walidacja, logika i trwała baza SQLite | `src/app.ts`, `src/routes`, `src/services`, `src/db` |
| `packages/shared` | Wspólne definicje danych i reguły wyników instrukcji | `src/model`, `src/api/types.ts`, `src/sync` |

React odpowiada za ekran. TypeScript opisuje kształt danych i sprawdza kod przed uruchomieniem, ale nie zastępuje walidacji danych otrzymanych z sieci. Vite buduje pliki przeglądarki. Express obsługuje żądania HTTP. SQLite przechowuje historię na dysku serwera. IndexedDB przechowuje sesję i kolejkę w przeglądarce świadka.

Panel odświeża dane przez odpytywanie API, w demo co 2 sekundy. Telefon synchronizuje się co 5 sekund oraz po dodaniu wpisu, odzyskaniu internetu i powrocie do widocznej aplikacji. Nie używamy WebSocketów i nie zakładamy, że telefon będzie niezawodnie pracował w tle.

W zbudowanej aplikacji jeden serwer podaje stronę i `/api`. W trybie dev Vite przekazuje żądania `/api` do osobnego serwera na 3000.

## 9. Co dzieje się po zapisaniu obserwacji

1. Formularz tworzy dane odpowiedzi. „Nie wiem” jest jawnym brakiem wiedzy, nie odpowiedzią „nie”.
2. `offline/queue.ts` nadaje wpisowi `entryId`, identyfikator urządzenia, numer kolejności i czas telefonu.
3. Wpis trafia do IndexedDB ze statusem `queued`. Dopiero udany zapis pozwala pokazać komunikat „Zapisano na telefonie”. Przy błędzie pamięci formularz pokazuje błąd i zachowuje wpisywaną treść.
4. `offline/sync.ts` pobiera aktualną sesję i wysyła oczekujące wpisy do `/api/witness/sync`.
5. Serwer sprawdza token, typ wpisu, rozmiary danych i reguły danej sesji. Wpis otrzymuje osobny `receivedTime`.
6. Odpowiedź API zawiera wynik dla każdego wpisu. Dopiero zaakceptowany wpis zmienia lokalny status na `received-by-server`.
7. Centrala pobiera aktualne dane i pokazuje wpis. Przy błędzie sieci lokalna kolejka pozostaje do ponowienia.

Statusy lokalne: `queued` oznacza oczekiwanie, `sending` próbę wysłania, `received-by-server` potwierdzony odbiór, `rejected` odmowę przyjęcia z podanym powodem. Błąd sieci nie jest tym samym co odrzucenie przez serwer.

## 10. Co chroni przed duplikatami

Każdy wpis ma identyfikator nadany przed wysłaniem. Jeżeli serwer zapisał wpis, ale telefon nie odebrał odpowiedzi, telefon wyśle ten sam identyfikator ponownie. Serwer znajdzie istniejący wpis i zwróci jego pierwotny czas odbioru. Nie utworzy drugiej kopii.

To nazywa się idempotencją. Możesz powiedzieć: „Ponawiamy wysyłkę, ale zachowujemy ten sam identyfikator, więc wpis w historii pozostaje jeden”.

Na jednym ekranie równoległe próby synchronizacji tej samej sesji korzystają z jednej trwającej operacji. Różne sesje mają osobne operacje. Ostateczną ochronę przy równoległych kartach daje reguła serwera i transakcje SQLite.

## 11. Instrukcje i ich wersje

Nowe zdarzenie otrzymuje pytania i szkice instrukcji ze scenariusza. Szkic nie jest widoczny dla świadka. Zatwierdzenie wskazuje osobę, czas i konkretną wersję.

Zmiana treści tworzy nową wersję. Odpowiedź świadka zawiera identyfikator instrukcji i numer wersji. „Wykonane” dla wersji 1 pozostaje w historii, ale nie ustawia wersji 2 jako wykonanej. Nowa zatwierdzona wersja oczekuje na własną odpowiedź. Wycofane instrukcje nie są dalej udostępniane w aktualnie pobranej sesji.

Bez internetu telefon dysponuje tylko ostatnio pobranym zestawem. Nie otrzyma nowej wersji ani informacji o wycofaniu, dopóki nie odzyska kontaktu. Nie obiecuj aktualności poleceń przy braku połączenia.

## 12. Dwa czasy i braki informacji

`deviceTime` to czas zapisu według telefonu. `receivedTime` to czas przyjęcia przez serwer. Mogą się różnić z powodu kolejki offline lub błędnego zegara telefonu. Nie wolno interpretować czasu odbioru jako chwili wystąpienia zdarzenia.

W modelu rozróżniamy odpowiedź znaną, odpowiedź „nie wiem” i brak odpowiedzi. Raport pokazuje brakujące informacje, zamiast je uzupełniać domysłem. Poprzednia znana odpowiedź może pozostać dostępna historycznie, ale nie zastępuje nowszego „nie wiem”.

W prototypie wybór najnowszych odpowiedzi i wyników wykorzystuje czas urządzenia i numer kolejności. Skrajne rozbieżności zegarów między kilkoma urządzeniami wymagają dopracowania przed użyciem operacyjnym. Sam fakt przechowywania dwóch czasów nie rozwiązuje wszystkich konfliktów.

## 13. Offline: dwie różne pamięci

Service Worker zachowuje pliki potrzebne do otwarcia interfejsu: HTML, JavaScript, CSS, fonty i ikony. Nie przechowuje odpowiedzi API jako aktualnych danych.

IndexedDB zachowuje pobraną sesję, zatwierdzone polecenia i lokalne wpisy. Dzięki temu aplikacja może otworzyć się ponownie i pokazać wcześniejsze dane przy niedostępnym serwerze.

Warunki: aplikacja musi być wcześniej pobrana, przeglądarka musi umożliwiać trwały zapis, a PWA musi działać na bezpiecznym źródle. Na tym samym komputerze `localhost` pozwala na lokalną próbę. Osobny telefon wymaga dostępnego z niego HTTPS. Tryb Vite dev i zwykły adres HTTP w sieci lokalnej nie są równoważne pełnemu demo PWA.

Nie gwarantujemy zachowania danych po wyczyszczeniu pamięci strony, usunięciu aplikacji, utracie urządzenia lub usunięciu danych przez przeglądarkę. „Wyczyść dane z telefonu” usuwa lokalne dane danej sesji, nie usuwa historii odebranej przez serwer.

## 14. Jak powstaje raport

`services/handoverReport.ts` łączy zapisane dane: ostatnie obserwacje, aktualnie zatwierdzone instrukcje, wyniki odpowiedzi, wyposażenie, nierozwiązane trudności, zgłoszenia bez przeglądu, braki i przerwy w kontakcie. Dołącza pełną oś czasu i istniejące potwierdzenie przejęcia.

To raport wyliczany z historii. Nie jest zamrożonym zrzutem wszystkich pól w chwili przejęcia. Samo przejęcie ma odrębny zapis z ratownikiem i czasem oraz zmienia status zdarzenia na `handed-over`. Zamknięcie zdarzenia jest osobną zmianą statusu.

## 15. SMS, wyposażenie i opcjonalny model

SMS: telefon może przygotować tekst wiadomości i otworzyć aplikację Wiadomości. Użytkownik wysyła ją sam. Deklaracja wysłania nie jest potwierdzeniem operatora. W demo odbiór SMS jest symulowany i oznaczony. Wiadomości nierozpoznanej sesji trafiają do ręcznej weryfikacji, a nie do automatycznego przypisania.

Wyposażenie: dyspozytor może zapisać stan i identyfikator pakietu. Instrukcja może mieć powiązanie z tym identyfikatorem. Nie ma sterowania dronem ani automatycznej telemetrii dostawy.

Opcjonalny model: istnieje ścieżka przygotowania szkicu podsumowania z osi czasu. Zdania mają wskazywać wpisy źródłowe, a proste reguły odrzucają część treści diagnostycznych. Szkic jest osobnym obiektem i nie zmienia historii ani statusów. Te reguły nie dowodzą prawdziwości każdego zdania i nie są gwarancją braku błędów modelu. W `npm run demo` model jest wyłączony, więc pokaz nie zależy od klucza, kosztu i dostępności tej usługi. Wywołań zewnętrznego modelu nie zweryfikowano w tym etapie.

## 16. Bezpieczeństwo i jego granice

Link świadka zawiera losowy token przypisany do jednego zdarzenia. Baza przechowuje jego skrót. Serwer sprawdza ważność i unieważnienie. Osoba posiadająca link może uzyskać dostęp, dlatego link jest prywatny. Domyślna ważność to 720 minut. Unieważnienie nie usuwa już pobranych danych z offline'owego telefonu; blokuje kolejne żądania do serwera.

Panel używa hasła z hashem scrypt i podpisanej sesji w ciasteczku `httpOnly`. Sesja ma termin ważności. W trybie produkcyjnym ciasteczko jest `Secure`, dlatego hosting wymaga HTTPS. Uprawnienia zależą od roli, prowadzącego i przydziału.

Serwer waliduje dane przez Zod, ogranicza ciało JSON do 256 KB, a pojedynczą synchronizację do 200 wpisów. Teksty mają limity długości. API nie cache'uje odpowiedzi; polityka referrera ogranicza przekazywanie adresu prywatnego linku dalej.

To nadal prototyp. Wspólne hasło kont demo, brak pełnego zarządzania kontami, brak limitowania prób logowania i kosztownych wywołań oraz brak pełnych procedur ochrony danych nie wystarczają do realnego wdrożenia. SQLite potrzebuje trwałego dysku i kopii zapasowych. Nie przedstawiaj tego jako gotowego systemu dla służb.

## 17. Najważniejsze żądania API

Wszystkie poniższe adresy mają prefiks `/api`.

| Żądanie | Znaczenie |
|---|---|
| `POST /auth/login`, `GET /auth/me` | Logowanie i sprawdzenie sesji panelu. |
| `POST /incidents` | Utworzenie zdarzenia i roboczego scenariusza. |
| `POST /incidents/:id/witness-links` | Wydanie prywatnego linku. |
| `GET /witness/session` | Pobranie sesji oraz zatwierdzonych poleceń; token w nagłówku Authorization. |
| `POST /witness/sync` | Wysłanie lokalnej kolejki i wyniki odbioru poszczególnych wpisów. |
| `GET /incidents/:id` | Dane pełnego panelu zdarzenia. |
| `PATCH /instructions/:id` | Utworzenie nowej wersji treści. |
| `POST /instructions/:id/approve` | Zatwierdzenie konkretnej wersji. |
| `GET /incidents/:id/timeline` | Historia zdarzenia. |
| `GET /incidents/:id/handover` | Wyliczony raport. |
| `POST /incidents/:id/handover` | Potwierdzenie przejęcia przez ratownika. |

## 18. Jakie dane są w bazie

SQLite ma między innymi tabele zdarzeń, kont, przydziałów, dostępu świadka, pól obserwacji, obserwacji, wersji instrukcji, potwierdzeń, wyposażenia, zgłoszeń zmian, wiadomości SMS, przerw w kontakcie, przekazań i szkiców podsumowania. Schemat jest w `apps/api/src/db/migrations`.

IndexedDB ma trzy magazyny: `meta` z identyfikatorem i kolejnością urządzenia, `sessions` z pobraną sesją oraz `entries` z lokalną historią i statusem odbioru. Baza przeglądarki i baza serwera mają inne zadania, więc nie są zamiennikami.

## 19. Pytania, które mogą paść

**Co jest tu nowe?** Łączymy zatwierdzone polecenia, odpowiedzi konkretnej wersji, widoczny stan lokalnego zapisu i odbioru oraz przekazanie historii. Nie twierdzimy, że żadna inna aplikacja nie ma podobnych funkcji; to wymaga osobnego porównania i rozmów ze służbami.

**Czy bez internetu dyspozytor wie, co się dzieje?** Nie. Telefon przechowuje wpisy, a centrala widzi ostatni kontakt. Nowe dane pojawiają się po powrocie połączenia.

**Czy to zastępuje 112 albo rozmowę z ratownikiem?** Nie. Prototyp nie wzywa pomocy. Dotyczy czasu po zgłoszeniu i współpracy z prowadzącym.

**Kto odpowiada za treść poleceń?** Scenariusz zatwierdza lekarz z zespołu, a polecenie do świadka zatwierdza prowadzący. Obecna treść jest robocza.

**Czy model podejmuje decyzje?** Nie. Podstawowy raport nie korzysta z modelu. Opcjonalny szkic nie zmienia danych i wymaga kontroli człowieka.

**Dlaczego SQLite?** Umożliwia prosty pokaz na jednym serwerze bez dodatkowej usługi bazodanowej. Skalowanie i wymagania operacyjne byłyby osobnym etapem, a nie obietnicą prototypu.

**Czy można pokazać drona?** Można zapisać dostarczenie pakietu i powiązać polecenie z pakietem. System nie steruje dronem.

**Czy to się sprzeda?** Potencjalnym kierunkiem jest narzędzie organizacyjne dla zespołów prowadzących i przekazujących akcje. Kupującego, finansowanie, cenę i warunki integracji trzeba ustalić z użytkownikami. Nie mamy potwierdzonego modelu biznesowego ani mierzalnego skrócenia czasu akcji.

**Co jest największą niewiadomą?** Czy taki przepływ pasuje do procedur służb i czy świadek potrafi obsłużyć go pod presją. To wymaga sprawdzenia scenariusza i testów z użytkownikami.

## 20. Co sprawdzić przed wystąpieniem

- Cały przepływ od nowej próby do raportu, na urządzeniu i przeglądarce używanych na scenie.
- Odpowiedź „nie wiem” i obecność brakujących informacji w raporcie.
- Wykonanie konkretnej wersji polecenia oraz powrót kolejki offline.
- Jeśli pokazujesz fizyczny telefon: HTTPS, wcześniejsze pobranie sesji i ponowne otwarcie offline.
- Scenariusz medyczny i właściwy brief kategorii z zespołem.
- Brak sekretów, prawdziwych danych pacjentów i obietnic niewykonanych integracji.

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

W repozytorium nie ma skonfigurowanego linta. Testy dotyczą logiki, dostępu i transmisji; nie dowodzą bezpieczeństwa medycznego ani niezawodności wszystkich telefonów. W istniejącym zestawie zależności pozostają zgłoszenia audytu wymagające osobnego przeglądu i aktualizacji.

## 21. Gdy coś nie działa podczas demo

**Port zajęty:** uruchom pokaz na innym porcie. Nie zatrzymuj cudzego procesu.

**Nie mogę się zalogować:** sprawdź konto i lokalne hasło w konfiguracji. Po zmianie sekretu sesji zaloguj się ponownie.

**Nowego wpisu nie widać w centrali:** sprawdź stan transmisji, lokalny status i zaczekaj na następne odświeżenie. „Zapisano na telefonie” nie oznacza „odebrano”.

**Polecenie nie pojawia się na telefonie:** sprawdź, czy jest zatwierdzone, czy nie jest wycofane i czy telefon ma połączenie.

**Błąd po zmianie buildu:** użyj „Wczytaj ponownie”. Wpisy zapisane w IndexedDB pozostają w pamięci, ale niezapisany tekst formularza może zniknąć. Nie przebudowuj aplikacji w środku wystąpienia.

**Offline po raz pierwszy nie otwiera strony:** aplikacja i sesja muszą wcześniej zostać pobrane. Sprawdź HTTPS i warunki PWA. Nie czyść pamięci przeglądarki podczas próby.

**Ratownik nie może przejąć:** sprawdź przydział, konto, status zdarzenia i czy przejęcie nie zostało już potwierdzone.
