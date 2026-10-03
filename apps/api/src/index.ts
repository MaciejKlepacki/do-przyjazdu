// Punkt wejścia serwera. Uruchamia migracje, potem nasłuchuje.
import { ensureStaffAccounts } from './auth/dispatcher.js';
import { createApp } from './app.js';
import { aiAvailable, loadConfig } from './config.js';
import { openDatabase } from './db/client.js';
import { migrate } from './db/migrate.js';

const config = loadConfig();
const db = openDatabase(config.DATABASE_PATH);
const applied = migrate(db);
if (applied.length) console.log(`[db] migracje: ${applied.join(', ')}`);
ensureStaffAccounts(db, config);

createApp(db, config).listen(config.PORT, () => {
  console.log(`[api] http://localhost:${config.PORT}  demo=${config.DEMO_MODE}  ai=${aiAvailable(config) ? 'tak' : 'nie'}`);
});
