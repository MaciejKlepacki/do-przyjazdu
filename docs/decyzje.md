# Dziennik decyzji

Jedna pozycja na decyzję: data, wybór, powód, co trzeba sprawdzić.

## 2026-10-03 — struktura repozytorium

Monorepo na workspace'ach npm: `apps/api`, `apps/web`, `packages/shared`.
Powód: model danych i reguły synchronizacji muszą być identyczne po obu stronach, bo rozróżnienie
czasu urządzenia i czasu serwera oraz wersji instrukcji jest sednem prototypu.

## 2026-10-03 — stos

React + TypeScript (Vite, PWA), Node.js + Express, SQLite przez better-sqlite3.
Powód: sekcja 11 dokumentu. Aktualizacje panelu przez odpytywanie, bez WebSocketów.
Do sprawdzenia: zachowanie IndexedDB i Service Workera na realnych telefonach zespołu.

## 2026-10-03 — SQLite przez wbudowany `node:sqlite`

Zamiast better-sqlite3. Powód: brak kompilacji natywnej (Node 26 w zespole), to samo synchroniczne API.
Wymaga Node ≥ 22.13.

## 2026-10-03 — jeden serwer w produkcji

API podaje też zbudowany frontend (`apps/web/dist`) — jedno źródło, jeden certyfikat HTTPS, cookie
panelu bez CORS. W dev Vite proxuje `/api` na port 3000.

## 2026-10-03 — treść scenariusza roboczego

Pola formularza i instrukcje w `apps/api/src/scenario/demoScenario.ts` napisał zespół techniczny jako
wypełniacz, żeby przepływ działał od początku do końca. Do zastąpienia/zatwierdzenia przez lekarza.

## 2026-10-03 — przerwy w kontakcie

Telefon odpytuje serwer co 5 s. Cisza dłuższa niż `CONTACT_GAP_SECONDS` (30 s) jest zapisywana jako
okres bez kontaktu i pokazywana w panelu oraz przy przekazaniu.

## Do rozstrzygnięcia

- Hosting z HTTPS i trwałym dyskiem na czas pokazu.
- Czy kanał SMS wchodzi do zgłoszenia, czy zostaje tylko jako symulacja oznaczona w UI.
- Czy demo obejmuje Apple Watch (wymaga osobnej integracji natywnej — sekcja 12).
