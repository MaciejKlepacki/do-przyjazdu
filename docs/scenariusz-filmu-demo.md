# Film demo do zgłoszenia

Robocza długość: około 2 minuty 30 sekund. Długość dopasujemy do limitu konkretnego zgłoszenia, jeśli zostanie podany. Nagranie pokazuje działający prototyp na fikcyjnych danych, z komentarzem głosowym.

Jedna historia prowadzi cały film: pomoc jest w drodze, świadek zapisuje informacje, transmisja zostaje przerwana, wpis czeka na telefonie, a po wznowieniu trafia do wspólnego raportu. Najpierw pokazujemy problem, potem naszą zmianę i jej dowód na ekranie.

## Przygotowanie nagrania

1. Użyj działającego serwera demo na `http://localhost:5174`. Jeśli nie jest uruchomiony, skonfiguruj własne `DISPATCHER_PASSWORD` i `SESSION_SECRET` zgodnie z przewodnikiem, a następnie uruchom:

   ```bash
   npm run demo
   ```

2. Zaloguj się jako `dyspozytor` przed nagraniem. Przygotuj stronę główną w jednej karcie, a `/demo` w drugiej. W demo kliknij „Rozpocznij pokaz” lub „Nowa próba pokazu”, a na telefonie dołącz do zdarzenia. Każde podejście zaczynaj od nowej próby.
3. Lekarz z zespołu sprawdza robocze treści scenariusza przed pokazem, w tym pierwsze polecenie używane w nagraniu. Fikcyjne odpowiedzi do tej próby: w pytaniu „Co macie przy sobie?” wybierz „Nie wiem”, a w pytaniu „Jaka jest teraz pogoda?” wybierz „Mgła”. Pozostałe pytania pomiń. Nie wpisuj danych prawdziwych pacjentów.
4. Pierwsza notatka: „Czekamy przy rozwidleniu szlaku.” Notatka podczas przerwy: „Widać światło na szlaku. Nadal czekamy przy rozwidleniu.” Miej obie przygotowane do wpisania.
5. Nagrywaj w poziomie, docelowo 1920 × 1080. Dopasuj okno i powiększenie strony tak, żeby czytelnie pokazać telefon oraz centralę. Podczas próby sprawdź, gdzie trzeba przewinąć formularz do przycisku zapisu.
6. Przeprowadź cały przepływ przed nagraniem. Obserwacje, zatwierdzone polecenie, odpowiedź, kolejka i raport muszą pojawić się w przewidzianej kolejności. Centrala odświeża dane co około 2 sekundy; telefon może potrzebować kilku sekund na pobranie polecenia.
7. Podczas próby z „Wstrzymaj transmisję” używaj tylko telefonu osadzonego w demo. Przycisk steruje zapytaniami tego widoku. Osobna karta świadka lub drugi telefon nie są nim wstrzymywane.

Przy pierwszym ujęciu odśwież stronę główną: hasło pojawia się w dwóch frazach, a linia ilustracji rysuje się przez około 2 sekundy. Komentarz zaczynaj od razu. W demo ruch licznika, oznaczenie ukończonego etapu i pojawienie się nowej notatki wynikają z rzeczywistych danych. Zostaw krótką pauzę przy odebranym wpisie. Animacje nie czekają na koniec wypowiedzi i nie sterują transmisją.

## Scenariusz obrazu i głosu

Przedziały obejmują komentarz i krótkie pauzy na odczytanie efektu. Jeśli kliknięcie zajmie dłużej, zaczekaj na wynik. Nie mów o odbiorze wpisu, dopóki nie pojawi się potwierdzenie.

| Czas | Obraz i działanie | Komentarz |
|---|---|---|
| 0:00-0:15 | Strona główna. Pokaż nazwę i hasło „Pomoc jest w drodze. Kontakt zostaje.” | „Pomoc została wezwana. Ratownicy są w drodze. W czasie oczekiwania pojawiają się polecenia, odpowiedzi i nowe informacje. Przy przekazaniu zdarzenia tę historię łatwo zgubić, szczególnie gdy znika zasięg.” |
| 0:15-0:30 | Przejdź do przygotowanego `/demo`. Na ekranie telefon i centrala. | „Do przyjazdu porządkuje ten czas. Świadek, dyspozytor i ratownik korzystają z jednej historii zdarzenia. Zamiast odtwarzać wszystko z kolejnych rozmów, widzą, co zapisano, co wykonano i czego nadal nie wiadomo.” |
| 0:30-0:50 | Telefon: „Obserwacje”. Przewiń do „Co macie przy sobie?” i wybierz „Nie wiem”, a przy „Jaka jest teraz pogoda?” wybierz „Mgła”. Wpisz pierwszą notatkę i kliknij „Zapisz obserwację”. Centrala: „Sytuacja”. Zaczekaj na odbiór i pokaż notatkę. | „Po lewej działa telefon świadka, po prawej centrala. Świadek podaje obserwację. Może też wybrać «Nie wiem». Po zapisaniu odpowiedź pojawia się u dyspozytora. Widzimy potwierdzenie odbioru, więc wiemy, że wpis dotarł.” |
| 0:50-1:10 | Centrala: „Polecenia”, przy pierwszym poleceniu kliknij „Zatwierdź i wyślij v1”. Telefon: „Czynność”, zaczekaj na pobranie i wybierz „Wykonane”. Zaczekaj na „Otrzymano w centrali” i licznik wykonania 1/1, zanim wstrzymasz transmisję. | „Dyspozytor zatwierdza polecenie. Dopiero wtedy trafia ono do świadka. Świadek odpowiada «Wykonane», a centrala widzi rezultat. Potwierdzenie jest przypisane do konkretnej wersji polecenia, dzięki czemu późniejsza zmiana treści nie zmienia znaczenia wcześniejszej odpowiedzi.” |
| 1:10-1:40 | Kliknij „Wstrzymaj transmisję”. Telefon: „Obserwacje”, wpisz drugą notatkę i zapisz. Centrala: „Sytuacja”. Pokaż lokalny wpis oczekujący i brak drugiej notatki w centrali. Zostaw ten stan na ekranie na kilka sekund. | „Teraz wstrzymujemy transmisję telefonu. Świadek nadal widzi pobrane instrukcje i zapisuje kolejną obserwację. Wpis zostaje na urządzeniu i czeka na wysłanie. Centrala jeszcze go nie ma. To rozróżnienie jest kluczowe: lokalny zapis nie oznacza, że dyspozytor już otrzymał informację.” |
| 1:40-1:55 | Kliknij „Przywróć transmisję”. Zaczekaj na odbiór. Wskaż drugą notatkę i osobne czasy pod nią. | „Przywracamy transmisję. Kolejka zostaje wysłana, a nowa notatka pojawia się w centrali. Zachowujemy dwa czasy: zapis na telefonie i odbiór przez serwer. Historia pokazuje, kiedy informacja została zapisana, a kiedy dotarła dalej.” |
| 1:55-2:15 | Centrala: „Przekazanie”. Pokaż odpowiedzi, wykonane polecenie, notatkę zapisaną podczas przerwy oraz liczbę pól bez znanej odpowiedzi. | „Na końcu ratownik ma raport: obserwacje, zatwierdzone polecenia, ich rezultaty i brakujące informacje. Jest w nim także wpis zapisany podczas przerwy. Kolejna osoba otrzymuje uporządkowaną historię, zamiast zaczynać od pytań o wszystko, co wydarzyło się wcześniej.” |
| 2:15-2:30 | Krótka pauza na raporcie. Powrót na stronę główną i znak marki. | „Pokazaliśmy działający prototyp na fikcyjnym zdarzeniu. Nie wzywa pomocy i nie jest połączony ze służbami. Do przyjazdu. Pomoc jest w drodze. Kontakt zostaje.” |

## Pełny tekst do nagrania głosu

Pomoc została wezwana. Ratownicy są w drodze. W czasie oczekiwania pojawiają się polecenia, odpowiedzi i nowe informacje. Przy przekazaniu zdarzenia tę historię łatwo zgubić, szczególnie gdy znika zasięg.

Do przyjazdu porządkuje ten czas. Świadek, dyspozytor i ratownik korzystają z jednej historii zdarzenia. Zamiast odtwarzać wszystko z kolejnych rozmów, widzą, co zapisano, co wykonano i czego nadal nie wiadomo.

Po lewej działa telefon świadka, po prawej centrala. Świadek podaje obserwację. Może też wybrać „Nie wiem”. Po zapisaniu odpowiedź pojawia się u dyspozytora. Widzimy potwierdzenie odbioru, więc wiemy, że wpis dotarł.

Dyspozytor zatwierdza polecenie. Dopiero wtedy trafia ono do świadka. Świadek odpowiada „Wykonane”, a centrala widzi rezultat. Potwierdzenie jest przypisane do konkretnej wersji polecenia, dzięki czemu późniejsza zmiana treści nie zmienia znaczenia wcześniejszej odpowiedzi.

Teraz wstrzymujemy transmisję telefonu. Świadek nadal widzi pobrane instrukcje i zapisuje kolejną obserwację. Wpis zostaje na urządzeniu i czeka na wysłanie. Centrala jeszcze go nie ma. To rozróżnienie jest kluczowe: lokalny zapis nie oznacza, że dyspozytor już otrzymał informację.

Przywracamy transmisję. Kolejka zostaje wysłana, a nowa notatka pojawia się w centrali. Zachowujemy dwa czasy: zapis na telefonie i odbiór przez serwer. Historia pokazuje, kiedy informacja została zapisana, a kiedy dotarła dalej.

Na końcu ratownik ma raport: obserwacje, zatwierdzone polecenia, ich rezultaty i brakujące informacje. Jest w nim także wpis zapisany podczas przerwy. Kolejna osoba otrzymuje uporządkowaną historię, zamiast zaczynać od pytań o wszystko, co wydarzyło się wcześniej.

Pokazaliśmy działający prototyp na fikcyjnym zdarzeniu. Nie wzywa pomocy i nie jest połączony ze służbami. Do przyjazdu. Pomoc jest w drodze. Kontakt zostaje.

## Co dokładnie udowadnia nagranie

- Wpis świadka jest odbierany przez centralę i trafia do raportu.
- Zatwierdzone polecenie pojawia się na telefonie, a odpowiedź na nie wraca do centrali.
- Kontrolowana przerwa rzeczywiście zatrzymuje zapytania osadzonego telefonu. Centrala pozostaje online.
- Wpis zapisany podczas przerwy czeka lokalnie, a po wznowieniu uzyskuje potwierdzenie odbioru.
- Czas urządzenia jest zachowany obok czasu przyjęcia przez serwer.
- Raport pokazuje również brakujące informacje.

Film w tej wersji pokazuje odczyt raportu. Potwierdzenie przejęcia zdarzenia przez przydzielonego ratownika jest osobną czynnością na jego koncie. Nie nazywamy samego otwarcia raportu przejęciem.

Oczekiwany rezultat tej próby: 2 obserwacje w centrali, wykonanie 1/1, „Mgła” jako znana odpowiedź, wyposażenie jako „nie wiem” oraz 7 pól bez znanej odpowiedzi w raporcie. Obie notatki mają czas zapisu i czas odbioru. Druga pojawia się raz. Czas odbioru drugiej notatki powinien być późniejszy od czasu jej zapisu. Przerwa w raporcie pojawia się po przekroczeniu progu braku kontaktu; przy krótkiej symulacji jej licznik może nadal wynosić 0.

W wersji 2:30 samo zatwierdzenie i wykonanie wystarczy do pokazania przepływu. Wersjonowanie wyjaśniamy głosem. Jeśli chcemy udowodnić także zmianę wersji, robimy osobne ujęcie: dyspozytor używa „Zmień treść”, zapisuje nową wersję i ponownie ją zatwierdza, a wcześniejsza odpowiedź pozostaje w historii poprzedniej wersji. Tę próbę przeprowadzamy na oddzielnym fikcyjnym zdarzeniu, z tekstem ustalonym z lekarzem.

Przerwa przyciskiem jest kontrolowaną symulacją transmisji. Prawdziwą pracę telefonu offline po wcześniejszym pobraniu aplikacji i instrukcji opisuje [scenariusz pokazu](scenariusz-demo.md#prawdziwy-telefon-i-praca-offline).

## Jeśli film ma trwać krócej

Wersja 90-sekundowa: skróć wstęp do „Pomoc została wezwana. Do jej przyjazdu trzeba zachować polecenia, odpowiedzi i nowe informacje. Do przyjazdu zbiera je we wspólnej historii.” Następnie pokaż obserwację, polecenie i odpowiedź w około 25 sekund, przerwę i powrót transmisji w około 35 sekund, a raport i zakończenie w pozostałym czasie. Usuń objaśnienie wersji polecenia. Zachowaj pauzę na niewysłanym wpisie i potwierdzeniu odbioru.

## Nagranie i montaż

- Najpierw nagraj pełny przepływ. Komentarz możesz dograć osobno według powyższego tekstu, zostawiając krótkie pauzy przy kolejce i odbiorze.
- Prowadź kursor do elementu, o którym mówisz. Przy raporcie przewiń spokojnie tylko do danych z tej próby.
- Skracaj czas wpisywania i przejścia między ekranami. Zachowaj czytelny moment zapisu podczas przerwy i rzeczywisty odbiór po jej wznowieniu.
- Logowanie przygotuj przed nagraniem. W kadrze pozostaw treść aplikacji; prywatny link świadka i dane konfiguracji pozostają poza nim.
- Głos ma być spokojny i wyraźny. Zakończ krótką pauzą przy nazwie oraz znaku marki.

## Kontrola gotowego pliku

- Tekst i statusy są czytelne po odtworzeniu filmu w docelowej rozdzielczości.
- Głos opisuje efekt, który w tej chwili widać na ekranie.
- Widać różnicę między zapisem na urządzeniu a odbiorem w centrali.
- Notatka z przerwy pojawia się w raporcie tej samej próby.
- W filmie wybrzmiewa, że pokazujemy prototyp na fikcyjnych danych.
- Długość, format i sposób przekazania filmu są zgodne z wymaganiami konkretnego zgłoszenia.

Przewodnik po całym projekcie: [przewodnik projektu](przewodnik-projektu.md).
