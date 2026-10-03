// Przywraca dane demonstracyjne przed każdą próbą pokazu (sekcja 13 "Zestaw").
// Usuwa wyłącznie zdarzenia oznaczone is_demo = 1 i ich wpisy, potem wykonuje seed od nowa.
import { fileURLToPath } from 'node:url';
import type { Config } from '../config.js';
import { all, run, transaction, type Db } from './client.js';
import { printSeedResult, seedDemo } from './seedDemo.js';

const INCIDENT_TABLES = [
  'handovers',
  'ai_summary_drafts',
  'contact_gaps',
  'status_changes',
  'situation_change_reports',
  'acknowledgements',
  'equipment',
  'observations',
  'instructions',
  'observation_fields',
  'witness_access',
  'incident_responders',
];

export function resetDemo(db: Db, config: Config) {
  transaction(db, () => {
    const ids = all<{ id: string }>(db, 'SELECT id FROM incidents WHERE is_demo = 1').map((r) => r.id);
    for (const id of ids) {
      for (const table of INCIDENT_TABLES) run(db, `DELETE FROM ${table} WHERE incident_id = $id`, { id });
      run(db, 'DELETE FROM sms_inbound WHERE linked_incident_id = $id OR claimed_incident_id = $id', { id });
      run(db, 'DELETE FROM incidents WHERE id = $id', { id });
    }
    // Symulowane SMS-y z kolejki ręcznej weryfikacji też są danymi demo.
    run(db, 'DELETE FROM sms_inbound WHERE is_simulated = 1');
  });
  return seedDemo(db, config);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { loadConfig } = await import('../config.js');
  const { openDatabase } = await import('./client.js');
  const { migrate } = await import('./migrate.js');
  const config = loadConfig();
  const db = openDatabase(config.DATABASE_PATH);
  migrate(db);
  printSeedResult(config, resetDemo(db, config));
  console.log('Pamiętaj: wyczyść też dane na telefonie świadka (przycisk „Wyczyść dane z telefonu”).');
}
