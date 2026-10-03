// Wersjonowanie instrukcji i ocena, czy potwierdzenie dotyczy aktualnej wersji (reguła 5).
import { instructionOutcome, type Acknowledgement, type Instruction, type InstructionOutcome } from '@do-przyjazdu/shared';
import { get, run, transaction, type Db } from '../db/client.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { newId, nowIso } from '../lib/ids.js';
import { instructionFromRow } from './records.js';

/** Instrukcje widoczne dla świadka: najnowsza zatwierdzona wersja każdej niewycofanej instrukcji. */
export function witnessVisibleInstructions(all: Instruction[]): Instruction[] {
  const latest = new Map<string, Instruction>();
  for (const i of all) {
    if (i.status !== 'approved') continue;
    const prev = latest.get(i.id);
    if (!prev || prev.version < i.version) latest.set(i.id, i);
  }
  return [...latest.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function outcomes(visible: Instruction[], acks: Acknowledgement[]): InstructionOutcome[] {
  return visible.map((i) => instructionOutcome(i, acks));
}

function latestVersionRow(db: Db, id: string, incidentId: string) {
  return get<Record<string, any>>(
    db,
    'SELECT * FROM instructions WHERE id = $id AND incident_id = $incidentId ORDER BY version DESC LIMIT 1',
    { id, incidentId },
  );
}

export function createDraft(
  db: Db,
  incidentId: string,
  authorId: string,
  input: { text: string; illustrationUrl?: string | null; packageId?: string | null; sortOrder?: number | null },
): Instruction {
  const id = newId('ins');
  const maxOrder = get<{ m: number | null }>(db, 'SELECT MAX(sort_order) AS m FROM instructions WHERE incident_id = $incidentId', {
    incidentId,
  });
  const sortOrder = input.sortOrder ?? (maxOrder?.m ?? 0) + 10;
  run(
    db,
    `INSERT INTO instructions (id, version, incident_id, text, illustration_url, author_id, status, created_at, sort_order, package_id)
     VALUES ($id, 1, $incidentId, $text, $illustration, $authorId, 'draft', $at, $sortOrder, $packageId)`,
    {
      id,
      incidentId,
      text: input.text,
      illustration: input.illustrationUrl ?? null,
      authorId,
      at: nowIso(),
      sortOrder,
      packageId: input.packageId ?? null,
    },
  );
  return instructionFromRow(latestVersionRow(db, id, incidentId)!);
}

/** Zmiana treści tworzy nową wersję w stanie szkicu. Starsze wersje zostają bez zmian. */
export function editInstruction(db: Db, incidentId: string, id: string, authorId: string, text: string): Instruction {
  const latest = latestVersionRow(db, id, incidentId);
  if (!latest) throw notFound('Nie ma takiej instrukcji.');
  run(
    db,
    `INSERT INTO instructions (id, version, incident_id, text, illustration_url, author_id, status, created_at, sort_order, package_id)
     VALUES ($id, $version, $incidentId, $text, $illustration, $authorId, 'draft', $at, $sortOrder, $packageId)`,
    {
      id,
      version: latest.version + 1,
      incidentId,
      text,
      illustration: latest.illustration_url,
      authorId,
      at: nowIso(),
      sortOrder: latest.sort_order,
      packageId: latest.package_id,
    },
  );
  return instructionFromRow(latestVersionRow(db, id, incidentId)!);
}

/** Zatwierdzić można tylko najnowszą wersję, będącą szkicem. Autor i czas zapisane. */
export function approveInstruction(db: Db, incidentId: string, id: string, version: number, approverId: string): Instruction {
  const latest = latestVersionRow(db, id, incidentId);
  if (!latest) throw notFound('Nie ma takiej instrukcji.');
  if (latest.version !== version) throw conflict(`Istnieje nowsza wersja (v${latest.version}). Zatwierdź najnowszą.`);
  if (latest.status !== 'draft') throw badRequest('Ta wersja nie jest szkicem.');
  run(
    db,
    `UPDATE instructions SET status = 'approved', approved_by_id = $approverId, approved_at = $at
     WHERE id = $id AND version = $version`,
    { approverId, at: nowIso(), id, version },
  );
  return instructionFromRow(latestVersionRow(db, id, incidentId)!);
}

/** Wycofanie dotyczy wszystkich wersji. Rekordy zostają w historii ze statusem i czasem wycofania. */
export function withdrawInstruction(db: Db, incidentId: string, id: string): number {
  if (!latestVersionRow(db, id, incidentId)) throw notFound('Nie ma takiej instrukcji.');
  return transaction(db, () =>
    run(
      db,
      `UPDATE instructions SET status = 'withdrawn', withdrawn_at = $at
       WHERE id = $id AND incident_id = $incidentId AND status != 'withdrawn'`,
      { at: nowIso(), id, incidentId },
    ),
  );
}

/** Czy świadek mógł zobaczyć tę wersję — tylko wtedy przyjmujemy odpowiedź (sekcja 8). */
export function wasShownToWitness(db: Db, incidentId: string, id: string, version: number): boolean {
  return Boolean(
    get(db, 'SELECT 1 AS ok FROM instructions WHERE id = $id AND version = $version AND incident_id = $incidentId AND approved_at IS NOT NULL', {
      id,
      version,
      incidentId,
    }),
  );
}
