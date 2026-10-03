// Połączenie SQLite (wbudowany node:sqlite), WAL, foreign_keys = ON.
// Jeden serwer z trwałym dyskiem wystarcza dla demonstracji (sekcja 11).
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

export type Db = DatabaseSync;
export type Params = Record<string, SQLInputValue>;
export type Row = Record<string, SQLInputValue>;

export function openDatabase(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  return db;
}

export function all<T = Row>(db: Db, sql: string, params: Params = {}): T[] {
  return db.prepare(sql).all(params) as T[];
}

export function get<T = Row>(db: Db, sql: string, params: Params = {}): T | undefined {
  return db.prepare(sql).get(params) as T | undefined;
}

export function run(db: Db, sql: string, params: Params = {}): number {
  return Number(db.prepare(sql).run(params).changes);
}

/** Transakcja: wszystko albo nic. Zagnieżdżenia nie są potrzebne w prototypie. */
export function transaction<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
