# Do przyjazdu

Prototyp: prowadzenie świadka przez instrukcje dyspozytora podczas oczekiwania na ratowników
i przekazanie historii zdarzenia zespołowi, który dociera na miejsce.

Koncepcja, zakres i granice: [DO_PRZYJAZDU.md](./DO_PRZYJAZDU.md).

**Status:** działający prototyp MVP (sekcja 6): telefon świadka z pracą offline, panel dyspozytora,
widok przekazania, symulowany kanał SMS, opcjonalny szkic AI. Treść scenariusza w
`apps/api/src/scenario/demoScenario.ts` jest **robocza** i czeka na lekarza. Prototyp nie jest
narzędziem ratunkowym, nie integruje się z TOPR ani z numerami alarmowymi, a dane w demo są fikcyjne.

## Struktura

```text
apps/
  api/      Node.js + SQLite: sesje, uprawnienia, historia, synchronizacja
  web/      React + TS (PWA): telefon świadka, panel dyspozytora, widok przekazania
packages/
  shared/   wspólny model danych i reguły synchronizacji
docs/       scenariusz demo, checklista sprawdzeń, decyzje, pytania do TOPR
```

Mapowanie katalogów na sekcje dokumentu: [docs/architektura.md](./docs/architektura.md).

## Uruchomienie

```bash
npm install
cp .env.example .env        # ustaw DISPATCHER_PASSWORD i SESSION_SECRET
npm run db:migrate
npm run db:seed             # jedno fikcyjne zdarzenie ze scenariusza
npm run dev                 # API + frontend
```

`npm run dev` uruchamia API (port 3000) i Vite (port 5173). Seed wypisuje link świadka i adres panelu.
Konta panelu: `dyspozytor` i `ratownik`, hasło z `DISPATCHER_PASSWORD`.

Przed każdą próbą pokazu: `npm run demo:reset` (nowy link świadka, chyba że ustawiono `DEMO_WITNESS_TOKEN`),
a na telefonie „Moje wpisy → Wyczyść dane z telefonu”.

**Praca offline wymaga buildu produkcyjnego i HTTPS** (Service Worker nie działa w trybie dev ani po
zwykłym HTTP na adresie IP). Jeden serwer podaje API i frontend:

```bash
npm run build && npm start   # http://localhost:3000; przed telefonem postaw HTTPS (np. tunel lub reverse proxy)
```

Testy (checklista z sekcji 14): `npm test`.

## Zasady, które obowiązują w kodzie

Pochodzą z sekcji 8–10 dokumentu i nie są kwestią gustu:

- świadek widzi instrukcję dopiero po jej zatwierdzeniu przez dyspozytora;
- każdy wpis ma czas urządzenia i czas odbioru przez serwer, zapisane oddzielnie;
- odpowiedź dotyczy konkretnej wersji instrukcji; potwierdzenie starszej nie potwierdza nowszej;
- wpisu nie usuwa się — poprawka to nowy wpis z własnym autorem i czasem;
- „nie wiem” zostaje brakiem danych, nie jest zamieniane na wartość;
- interfejs rozróżnia „zapisano na urządzeniu” i „otrzymano w centrali”;
- widok przekazania powstaje bez AI; szkic AI jest osobnym obiektem z odnośnikami do wpisów;
- AI nie zmienia statusów, nie zatwierdza decyzji i nie dopisuje faktów do historii;
- SMS to zwykła wiadomość tekstowa wysyłana ręcznie przez świadka, bez gwarancji doręczenia.

## Podział pracy

Sekcja 15 dokumentu: telefon świadka i synchronizacja / panel i przekazanie / backend i uruchomienie demo /
scenariusz medyczny. Kolejność realizacji i kryteria obcięcia zakresu — tam samo.
