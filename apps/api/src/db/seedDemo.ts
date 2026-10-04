// Wstawia jedno fikcyjne zdarzenie ze scenariusza lekarza (DO_PRZYJAZDU.md, sekcja 8).
// Wszystkie dane fikcyjne, incidents.is_demo = 1.
import { fileURLToPath } from 'node:url';
import { DEMO_STAFF, ensureStaffAccounts } from '../auth/dispatcher.js';
import { issue } from '../auth/witnessToken.js';
import type { Config } from '../config.js';
import { nowIso } from '../lib/ids.js';
import { DEMO_INCIDENT_DESCRIPTION } from '../scenario/demoScenario.js';
import { createIncident } from '../services/incidentSetup.js';
import { get, run, type Db } from './client.js';

export const DEMO_INCIDENT_ID = 'ZD-DEMO';

export function seedDemo(db: Db, config: Config): { incidentId: string; witnessPath: string } {
  ensureStaffAccounts(db, config);
  const dispatcher = DEMO_STAFF.find((s) => s.role === 'dispatcher')!;
  const responder = DEMO_STAFF.find((s) => s.role === 'responder')!;
  if (get(db, 'SELECT 1 AS ok FROM incidents WHERE id = $id', { id: DEMO_INCIDENT_ID })) {
    throw new Error(`Zdarzenie ${DEMO_INCIDENT_ID} już istnieje. Użyj: npm run demo:reset`);
  }
  createIncident(db, { id: DEMO_INCIDENT_ID, description: DEMO_INCIDENT_DESCRIPTION, leadDispatcherId: dispatcher.id, isDemo: true });
  run(
    db,
    'INSERT INTO incident_responders (incident_id, responder_id, assigned_at, assigned_by_id) VALUES ($id, $responder, $at, $by)',
    { id: DEMO_INCIDENT_ID, responder: responder.id, at: nowIso(), by: dispatcher.id },
  );
  const link = issue(db, DEMO_INCIDENT_ID, config.WITNESS_TOKEN_TTL_MINUTES, config.DEMO_WITNESS_TOKEN || undefined);
  return { incidentId: DEMO_INCIDENT_ID, witnessPath: `/w/${link.token}` };
}

export function printSeedResult(config: Config, result: { incidentId: string; witnessPath: string }): void {
  console.log(`Zdarzenie demo: ${result.incidentId}`);
  console.log(`Link świadka:   ${config.PUBLIC_BASE_URL}${result.witnessPath}`);
  console.log(`Panel:          ${config.PUBLIC_BASE_URL}/dispatcher  (konta: dyspozytor / ratownik, hasło z DISPATCHER_PASSWORD)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { loadConfig } = await import('../config.js');
  const { openDatabase } = await import('./client.js');
  const { migrate } = await import('./migrate.js');
  const config = loadConfig();
  const db = openDatabase(config.DATABASE_PATH);
  migrate(db);
  printSeedResult(config, seedDemo(db, config));
}
