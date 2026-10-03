// Utworzenie zdarzenia z polami formularza i szkicami instrukcji ze scenariusza.
import { run, transaction, type Db } from '../db/client.js';
import { incidentId as newIncidentId, nowIso } from '../lib/ids.js';
import { SCENARIO_AUTHOR_ID, SCENARIO_FIELDS, SCENARIO_INSTRUCTIONS } from '../scenario/demoScenario.js';
import { createDraft } from './instructionVersions.js';

export function createIncident(
  db: Db,
  input: { description: string; leadDispatcherId: string; isDemo: boolean; id?: string },
): string {
  const id = input.id ?? newIncidentId();
  transaction(db, () => {
    run(
      db,
      `INSERT INTO incidents (id, description, status, lead_dispatcher_id, created_at, is_demo)
       VALUES ($id, $description, 'open', $lead, $at, $demo)`,
      { id, description: input.description, lead: input.leadDispatcherId, at: nowIso(), demo: input.isDemo ? 1 : 0 },
    );
    SCENARIO_FIELDS.forEach((f, i) => {
      run(
        db,
        `INSERT INTO observation_fields (incident_id, field_key, label, kind, options_json, unit, sort_order)
         VALUES ($id, $key, $label, $kind, $options, $unit, $order)`,
        { id, key: f.key, label: f.label, kind: f.kind, options: f.options ? JSON.stringify(f.options) : null, unit: f.unit ?? null, order: i },
      );
    });
    SCENARIO_INSTRUCTIONS.forEach((ins, i) => {
      createDraft(db, id, SCENARIO_AUTHOR_ID, { text: ins.text, packageId: ins.packageId, sortOrder: (i + 1) * 10 });
    });
  });
  return id;
}
