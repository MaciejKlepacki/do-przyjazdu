// Przyjęcie wpisu dokładnie raz po entry_id. Ponowienie zwraca pierwotny received_time.
import { get, type Db } from '../db/client.js';

export interface ExistingEntry {
  incidentId: string;
  receivedTime: string;
}

/** Identyfikatory wpisów są unikalne między rodzajami (UUID z urządzenia), więc szukamy we wszystkich. */
export function findExistingEntry(db: Db, entryId: string): ExistingEntry | null {
  const row = get<{ incident_id: string; received_time: string }>(
    db,
    `SELECT incident_id, received_time FROM observations WHERE entry_id = $entryId
     UNION ALL SELECT incident_id, received_time FROM acknowledgements WHERE entry_id = $entryId
     UNION ALL SELECT incident_id, received_time FROM situation_change_reports WHERE entry_id = $entryId
     LIMIT 1`,
    { entryId },
  );
  return row ? { incidentId: row.incident_id, receivedTime: row.received_time } : null;
}
