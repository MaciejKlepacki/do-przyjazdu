# Do przyjazdu

Prototyp: prowadzenie świadka przez instrukcje dyspozytora podczas oczekiwania na ratowników
i przekazanie historii zdarzenia zespołowi, który dociera na miejsce.

Koncepcja, zakres i granice: [DO_PRZYJAZDU.md](./DO_PRZYJAZDU.md).

**Status:** szkielet repozytorium. Kod nie jest jeszcze zaimplementowany. Prototyp nie jest
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

Przed każdą próbą pokazu: `npm run demo:reset`.

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
