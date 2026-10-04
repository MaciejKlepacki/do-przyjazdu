import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createApp } from '../apps/api/src/app.js';
import { loadConfig } from '../apps/api/src/config.js';
import { get, openDatabase } from '../apps/api/src/db/client.js';
import { migrate } from '../apps/api/src/db/migrate.js';
import { seedDemo } from '../apps/api/src/db/seedDemo.js';
import { ensureStaffAccounts } from '../apps/api/src/auth/dispatcher.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const { values } = parseArgs({ options: { port: { type: 'string', default: '5174' }, host: { type: 'string', default: '127.0.0.1' } } });
const port = Number(values.port);
const LOCAL_DEMO_PASSWORD = 'hackyeah';

// Bez pliku .env lokalny pokaz startuje od razu z domyślnym hasłem. Tylko na adresie lokalnym.
function applyLocalDefaults(): string | undefined {
  const envFile = resolve(root, '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  if (!['127.0.0.1', 'localhost', '::1'].includes(values.host!)) return undefined;
  process.env.SESSION_SECRET ||= randomBytes(32).toString('hex');
  if (process.env.DISPATCHER_PASSWORD) return undefined;
  process.env.DISPATCHER_PASSWORD = LOCAL_DEMO_PASSWORD;
  return LOCAL_DEMO_PASSWORD;
}

async function checkPort(): Promise<void> {
  const probe = createServer();
  await new Promise<void>((resolve, reject) => {
    probe.once('error', () => reject(new Error(`Port ${port} jest zajęty lub niedostępny. Użyj innego: npm run demo -- --port 5175`)));
    probe.listen(port, values.host, () => probe.close(() => resolve()));
  });
}

async function main() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Podaj poprawny port, np. npm run demo -- --port 5175');
  await checkPort();
  if (process.env.NODE_ENV !== 'test') process.env.NODE_ENV = 'development';
  const defaultPassword = applyLocalDefaults();
  const config = loadConfig();
  config.DEMO_MODE = true;
  config.DATABASE_PATH = resolve(root, 'data/presentation.sqlite');
  config.PUBLIC_BASE_URL = `http://localhost:${port}`;
  config.ANTHROPIC_API_KEY = '';
  config.SMS_INBOUND_SECRET = '';
  config.SMS_NUMBER = '';

  const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
  if (build.status !== 0) process.exit(build.status ?? 1);
  const db = openDatabase(config.DATABASE_PATH);
  migrate(db);
  ensureStaffAccounts(db, config);
  if (!get(db, 'SELECT id FROM incidents WHERE id = $id', { id: 'ZD-DEMO' })) seedDemo(db, config);
  const server = createApp(db, config).listen(port, values.host, () => {
    console.log(`Demo: ${config.PUBLIC_BASE_URL}`);
    console.log(defaultPassword
      ? `Logowanie: konto "Dyspozytor (demo)", hasło: ${defaultPassword}. Własne hasło ustawisz w .env (DISPATCHER_PASSWORD).`
      : 'Zaloguj się jako dyspozytor hasłem z DISPATCHER_PASSWORD. Każda próba tworzy osobne fikcyjne zdarzenie.');
    console.log('Ten serwer korzysta z osobnej bazy data/presentation.sqlite. SMS jest symulowany, podsumowanie AI jest wyłączone.');
    console.log('Telefon przez sieć lokalną wymaga hosta 0.0.0.0; pełna praca PWA wymaga HTTPS.');
  });
  const stop = () => server.close(() => { db.close(); process.exit(0); });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "Nie udało się uruchomić pokazu.");
  process.exitCode = 1;
});
