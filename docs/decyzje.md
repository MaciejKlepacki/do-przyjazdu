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

## Do rozstrzygnięcia

- Hosting z HTTPS i trwałym dyskiem na czas pokazu.
- Czy kanał SMS wchodzi do zgłoszenia, czy zostaje tylko jako symulacja oznaczona w UI.
- Czy demo obejmuje Apple Watch (wymaga osobnej integracji natywnej — sekcja 12).
