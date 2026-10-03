// Wykonuje pliki z db/migrations w kolejności nazw i zapisuje je w tabeli schema_migrations.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { get, run, transaction, type Db } from './client.js';

const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations/', import.meta.url));

export function migrate(db: Db): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const name of files) {
    if (get(db, 'SELECT name FROM schema_migrations WHERE name = $name', { name })) continue;
    const sql = readFileSync(MIGRATIONS_DIR + name, 'utf8');
    transaction(db, () => {
      db.exec(sql);
      run(db, 'INSERT INTO schema_migrations (name, applied_at) VALUES ($name, $at)', {
        name,
        at: new Date().toISOString(),
      });
    });
    applied.push(name);
  }
  return applied;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { loadConfig } = await import('../config.js');
  const { openDatabase } = await import('./client.js');
  const config = loadConfig();
  const db = openDatabase(config.DATABASE_PATH);
  const applied = migrate(db);
  console.log(applied.length ? `Zastosowano: ${applied.join(', ')}` : 'Baza aktualna.');
}
