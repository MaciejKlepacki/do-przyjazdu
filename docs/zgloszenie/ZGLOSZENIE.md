# Zgłoszenie HackYeah 2026: Do przyjazdu

Gotowe teksty i pliki do formularza. Wersje PL i EN, wybierz język formularza.

| Pole | Co wkleić / wgrać |
|---|---|
| 1. Problem | Tekst z sekcji „Problem” |
| 2. Solution | Tekst z sekcji „Solution” |
| 3. Cover image | [`cover.png`](cover.png), 3840 × 2160, 16:9 |
| 4. Demo | Film nagrany według sekcji „Demo: scenariusz nagrania” |
| 5. Presentation | [`prezentacja.pdf`](prezentacja.pdf), 9 slajdów 16:9 |

---

## 1. Problem

**Jedno zdanie:** Pomoc została wezwana, ale do przyjazdu ratowników mija czas, w którym polecenia, odpowiedzi i obserwacje istnieją tylko w kolejnych rozmowach i łatwo je zgubić.

**PL**

W górach na ratowników czeka się długo: teren, pogoda i noc potrafią wydłużyć oczekiwanie do wielu godzin. W tym czasie świadek przy poszkodowanym dostaje polecenia od dyspozytora, stan poszkodowanego się zmienia, pojawiają się nowe informacje. Wszystko to żyje w rozmowach telefonicznych.

- Świadek wykonuje polecenia z pamięci, w stresie i przy słabym zasięgu.
- Dyspozytor nie wie na pewno, czy polecenie wykonano i czy nowa informacja w ogóle do niego dotarła.
- Ratownik docierający na miejsce odtwarza przebieg zdarzenia od zera.

Gdy znika internet albo zdarzenie przejmuje kolejna osoba, część tej historii przepada.

**EN**

In the mountains, help can take hours to arrive: terrain, weather and darkness all slow rescuers down. Meanwhile, the witness next to the injured person receives instructions from the dispatcher, the patient's condition changes and new information appears. All of it lives only in phone calls.

- The witness follows instructions from memory, under stress, with weak signal.
- The dispatcher cannot be sure an instruction was carried out, or that a new observation actually arrived.
- The rescuer arriving on scene has to reconstruct the whole story from scratch.

When the connection drops or the incident is handed over, part of that history is lost.

---

## 2. Solution

**Jedno zdanie:** Do przyjazdu łączy świadka, dyspozytora i ratownika w jednej historii zdarzenia, która przetrwa utratę zasięgu i trafia do ratownika jako gotowy raport.

**PL**

Do przyjazdu to wspólna historia zdarzenia od wezwania pomocy do przyjazdu ratowników.

- **Świadek** otwiera prywatny link, bez zakładania konta. Widzi jedno zatwierdzone polecenie naraz i odpowiada jednym dotknięciem: „Wykonane”, „Nie mogę wykonać” albo „Nie wiem”. Zapisuje też krótkie obserwacje.
- **Dyspozytor** zatwierdza każde polecenie, zanim trafi do świadka. Widzi rezultaty, nowe obserwacje i to, które informacje faktycznie dotarły do centrali.
- **Ratownik** dostaje uporządkowany raport: co się wydarzyło, co wykonano i czego nadal nie wiemy.

Aplikacja działa bez internetu. Telefon zachowuje pobrane instrukcje i kolejkę nowych wpisów, a po powrocie połączenia wysyła je bez duplikatów. Każdy wpis ma dwa czasy: zapisu na telefonie i odbioru w centrali. Odpowiedź jest przypisana do konkretnej wersji polecenia, a „Nie wiem” zostaje zapisane jako brak danych. Raport działa bez AI. Opcjonalny model tylko proponuje szkic podsumowania z odnośnikami do wpisów.

Zbudowaliśmy działający prototyp: PWA dla świadka (React, Service Worker, IndexedDB), panel centrali i widok przekazania (Express, SQLite) oraz tryb demo z symulowaną przerwą w łączności. Treści medyczne scenariusza weryfikuje lekarz z naszego zespołu. Prototyp działa na fikcyjnych danych, nie wzywa pomocy i nie jest połączony ze służbami.

**EN**

Do przyjazdu ("Until they arrive") is a shared incident history covering the time from the emergency call until rescuers arrive.

- **The witness** opens a private link, with no account needed. They see one dispatcher-approved instruction at a time and answer with a single tap: "Done", "Can't do it" or "Don't know". They can also add short observations.
- **The dispatcher** approves every instruction before the witness sees it. They see outcomes, new observations, and which information actually reached the centre.
- **The rescuer** gets a structured handover: what happened, what was done and what is still unknown.

It works offline. The phone keeps the instructions it already downloaded and queues new entries, then syncs them without duplicates when the connection returns. Every entry carries two timestamps: when it was recorded on the device and when the server received it. Answers are tied to a specific version of an instruction, and "Don't know" stays recorded as missing data. The report works without AI. An optional model only drafts a summary that links back to the entries.

We built a working prototype: a PWA for the witness (React, Service Worker, IndexedDB), a dispatcher panel and handover view (Express, SQLite), and a demo mode with a simulated connection drop. The medical content of the scenario is reviewed by our team's physician. The prototype uses fictional data, does not call emergency services and is not connected to them.

---

## 3. Cover image

[`cover.png`](cover.png): 3840 × 2160 px, 16:9. Jeśli formularz wymaga mniejszego pliku albo innego formatu, wyrenderuj ponownie z pierwszego slajdu `slides.html`.

---

## 4. Demo: scenariusz nagrania (Mac, około 2:15)

Film opowiada jedną historię. Świadek zapisuje obserwację, dyspozytor zatwierdza polecenie, zasięg znika, wpis czeka na telefonie, zasięg wraca, a ratownik dostaje raport. Każdy efekt na ekranie pochodzi z prawdziwych danych, nic nie jest animacją „na pokaz”.

### Przygotowanie (10 minut, przed nagraniem)

1. **Serwer.** Uruchom demo tak jak wcześniej (`npm run demo` z ustawionymi `DISPATCHER_PASSWORD` i `SESSION_SECRET`). Polecenie samo przebudowuje aplikację. Jeśli serwer już działa, w przeglądarce zrób twarde odświeżenie **⌘⇧R**, żeby service worker nie podał starej wersji.
2. **Chrome:**
   - Zaloguj się na `http://localhost:5174/dispatcher` jako `dyspozytor`. Logowanie zostaje poza kadrem.
   - **Karta 1:** `http://localhost:5174/` (strona główna).
   - **Karta 2:** `http://localhost:5174/demo`. Jeśli widać poprzednią próbę, kliknij na dole „Nowa próba pokazu”. Ma być widoczny ekran startowy z przyciskiem „Rozpocznij pokaz”.
   - **Karta 3:** strona główna przewinięta na sam dół, do sekcji „Przerwij połączenie. Zachowaj historię.”
   - Ukryj pasek zakładek (**⌘⇧B**). Włącz pełny ekran (**⌃⌘F**). Ustaw powiększenie **80%** (**⌘−** dwa razy) we wszystkich kartach. Przy 80% telefon i centrala mieszczą się razem na ekranie MacBooka.
3. **Mac:** włącz tryb Skupienie / Nie przeszkadzać, zamknij Slacka i Messengera, schowaj Dock.
4. **Teksty do wklejenia:** skopiuj je wcześniej do notatki, żeby nie pisać na nagraniu:
   - notatka 1: `Czekamy przy rozwidleniu szlaku.`
   - notatka 2: `Widać światło na szlaku. Nadal czekamy przy rozwidleniu.`
5. **Próba generalna.** Przejdź cały scenariusz raz bez nagrywania, potem kliknij „Nowa próba pokazu”.

### Nagrywanie

- **⌘⇧5**, wybierz „Nagraj cały ekran”. W „Opcjach” wybierz mikrofon (MacBook albo słuchawki) i zaznacz **„Pokaż kliknięcia myszy”**. Zatrzymanie nagrania: **⌘⌃Esc** albo ikona na pasku menu.
- Mów spokojnie, a po każdym kliknięciu odczekaj, aż efekt pojawi się na ekranie. **Nie mów o odbiorze, dopóki go nie widać.** Centrala odświeża się co około 2 sekundy.
- Jeśli wolisz, nagraj sam obraz, a głos dograj osobno w iMovie. Tekst lektora jest w tabeli poniżej.
- Kursorem wskazuj element, o którym właśnie mówisz.

### Ujęcia krok po kroku

| # | Czas | Co klikasz | Co mówisz |
|---|---|---|---|
| 1 | 0:00–0:12 | **Karta 1.** Odśwież (**⌘R**), żeby zagrała animacja hasła. Nic nie klikaj. | „Pomoc została wezwana. Ratownicy są w drodze. W górach to może trwać godzinę, a czasem całą noc. Co dzieje się w tym czasie?” |
| 2 | 0:12–0:22 | Powoli przewiń do ilustracji, kliknij **„Odtwórz”** i pozwól jej przejść 1–2 etapy. | „Do przyjazdu to jedna wspólna historia zdarzenia. Świadek, dyspozytor i ratownik widzą to samo, nawet gdy znika zasięg.” |
| 3 | 0:22–0:30 | **Karta 2.** Kliknij **„Rozpocznij pokaz”**. | „To działająca aplikacja. Po lewej telefon świadka, po prawej centrala.” |
| 4 | 0:30–0:52 | Telefon: **„Tak, dołączam do ZD-…”**, potem zakładka **„Obserwacje”**. Przy „Co macie przy sobie?” kliknij **„Nie wiem”**, przy „Jaka jest teraz pogoda?” kliknij **„Mgła”**. Przewiń w telefonie do „Coś jeszcze?”, wklej notatkę 1 i kliknij **„Zapisz obserwację”**. Poczekaj, aż notatka pojawi się po prawej. | „Świadek dołącza z linku, bez zakładania konta. Odpowiada na proste pytania, a jeśli czegoś nie wie, wybiera «Nie wiem» i tak to zostaje zapisane. Nikt tego nie zgaduje. Wpis od razu trafia do centrali.” |
| 5 | 0:52–1:12 | Centrala: zakładka **„Polecenia”**, przy pierwszym poleceniu **„Zatwierdź i wyślij v1”**. Telefon: zakładka **„Czynność”**, poczekaj na polecenie i kliknij **„Wykonane”**. Poczekaj na zielone **„Otrzymano w centrali”** i licznik **1/1**. | „Dyspozytor zatwierdza polecenie i dopiero wtedy świadek je widzi. Świadek klika «Wykonane». Centrala wie, że polecenie wykonano, i wie, której wersji to dotyczy.” |
| 6 | 1:12–1:38 | Kliknij **„Wstrzymaj transmisję”** pod telefonem. Telefon: **„Obserwacje”**, wklej notatkę 2, **„Zapisz obserwację”**. Centrala: zakładka **„Sytuacja”**. Wskaż pomarańczowy pasek **„1 wpis czeka”**. **Odczekaj 3 sekundy.** | „A teraz znika zasięg. Świadek nadal ma instrukcje i zapisuje kolejną obserwację. Telefon mówi wprost: jeden wpis czeka. Centrala jeszcze go nie ma i nie udajemy, że ma.” |
| 7 | 1:38–1:55 | Kliknij **„Przywróć transmisję”**. Poczekaj na zielony pasek **„Odbiór potwierdzony”** i **„2 obserwacje”**. Wskaż pod nową notatką „zapisano … · odebrano …”. | „Zasięg wraca. Wpis dociera do centrali raz, bez duplikatów. Każdy wpis ma dwa czasy: kiedy go zapisano i kiedy dotarł.” |
| 8 | 1:55–2:10 | Centrala: zakładka **„Przekazanie”**. Wszystkie 5 etapów u góry ma teraz zielone ✓. Powoli przewiń raport. | „Ratownik na miejscu dostaje raport: co się wydarzyło, co wykonano i czego nie wiemy. Raport powstaje bez AI. Model może najwyżej zaproponować szkic podsumowania.” |
| 9 | 2:10–2:20 | **Karta 3**: „Przerwij połączenie. Zachowaj historię.” Zostań na tym ujęciu 2 sekundy. | „Do przyjazdu. Pomoc jest w drodze. Historia zostaje. Pokazaliśmy prototyp na fikcyjnych danych. Nie wzywa pomocy i nie łączy się ze służbami.” |

### Jeśli coś pójdzie nie tak

- **Polecenie nie pojawia się na telefonie:** poczekaj 3–5 sekund, telefon pobiera polecenia cyklicznie. Upewnij się, że transmisja nie jest wstrzymana.
- **Nie widać przycisku „Zapisz obserwację”:** przewiń wewnątrz telefonu, nie całą stronę.
- **„Wstrzymaj transmisję” działa tylko dla telefonu osadzonego w demo.** Osobna karta świadka nie jest wstrzymywana.
- **Chcesz zacząć od nowa:** kliknij na dole „Nowa próba pokazu”. Każda próba tworzy nowe fikcyjne zdarzenie.

### Montaż (QuickTime albo iMovie, 5 minut)

- QuickTime: **⌘T**, żeby przyciąć początek i koniec. iMovie: wytnij czekanie na odświeżenie, ale **zostaw widoczny moment „1 wpis czeka” i zmianę na „Odbiór potwierdzony”**. To kluczowy dowód.
- Eksport: 1080p, MP4/MOV. Sprawdź, czy statusy są czytelne po obejrzeniu na pełnym ekranie.
- Wersja 60–90 s, jeśli formularz ma limit: ujęcia 1 → 3 → 4 → 5 → 6 → 7 → 8, bez ujęcia 2 i ze skróconymi kwestiami.

---

## 5. Presentation

[`prezentacja.pdf`](prezentacja.pdf): 9 slajdów 16:9.

1. Okładka: „Pomoc jest w drodze. Historia zostaje.”
2. Problem: czas między wezwaniem a przyjazdem
3. Rozwiązanie: jedna historia, trzy perspektywy
4. Prototyp: dyspozytor zatwierdza, świadek wykonuje
5. Ciągłość: zasięg znika, wpis zostaje
6. Przekazanie: raport dla ratownika
7. Zasady projektowe i stos technologiczny
8. Co dalej: TOPR, pilotaż, integracje
9. Zamknięcie

Źródło: [`slides.html`](slides.html). Po edycji otwórz plik w Chrome, wybierz **⌘P**, „Zapisz jako PDF”, Marginesy: brak, zaznacz „Grafika w tle”. Zrzuty ekranu w `img/` pochodzą z działającej aplikacji na fikcyjnym zdarzeniu.
