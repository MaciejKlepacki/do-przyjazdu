// Przyjmowanie wpisów z telefonu świadka (reguły 1-5 z sekcji 10).
// Każdy wpis ma dwa czasy: urządzenia (niepewny) i odbioru przez serwer.
import type { SyncResultItem, WitnessEnvelope } from '@do-przyjazdu/shared';
import { z } from 'zod';
import { run, transaction, type Db } from '../db/client.js';
import { nowIso } from '../lib/ids.js';
import { findExistingEntry } from './idempotency.js';
import { wasShownToWitness } from './instructionVersions.js';
import { loadFields, loadIncident } from './records.js';

const entryBase = {
  entryId: z.string().regex(/^[A-Za-z0-9_-]{8,100}$/, 'Nieprawidłowy identyfikator wpisu'),
  deviceId: z.string().min(1).max(100),
  deviceSequence: z.number().int().nonnegative(),
  deviceTime: z.string().datetime({ offset: true }),
};

const answerValue = z.union([
  z.object({ known: z.literal(true), value: z.union([z.string().max(300), z.number(), z.array(z.string().max(100)).max(20)]) }),
  z.object({ known: z.literal(false), reason: z.enum(['unknown', 'not-asked']) }),
]);

export const envelopeSchema = z.discriminatedUnion('kind', [
  z.object({
    ...entryBase,
    kind: z.literal('observation'),
    payload: z.object({
      answers: z.array(z.object({ fieldKey: z.string().max(100), value: answerValue })).max(50),
      freeText: z.string().max(1000).nullable(),
    }),
  }),
  z.object({
    ...entryBase,
    kind: z.literal('acknowledgement'),
    payload: z.object({
      instructionId: z.string().max(100),
      instructionVersion: z.number().int().positive(),
      result: z.enum(['done', 'cannot-do', 'needs-clarification']),
      comment: z.string().max(500).nullable(),
    }),
  }),
  z.object({
    ...entryBase,
    kind: z.literal('situation-change'),
    payload: z.object({ text: z.string().trim().min(1).max(500) }),
  }),
]);

class EntryRejected extends Error {}

function validateObservation(db: Db, incidentId: string, env: Extract<WitnessEnvelope, { kind: 'observation' }>): void {
  const fields = new Map(loadFields(db, incidentId).map((f) => [f.key, f]));
  const { answers, freeText } = env.payload;
  if (answers.length === 0 && !freeText?.trim()) throw new EntryRejected('Pusta obserwacja.');
  for (const a of answers) {
    const field = fields.get(a.fieldKey);
    if (!field) throw new EntryRejected(`Nieznane pole: ${a.fieldKey}`);
    if (!a.value.known || !field.options) continue;
    const allowed = new Set(field.options.map((o) => o.value));
    const values = Array.isArray(a.value.value) ? a.value.value : [String(a.value.value)];
    if (values.some((v) => !allowed.has(v))) throw new EntryRejected(`Niedozwolona odpowiedź w polu: ${field.label}`);
  }
}

/** Przyjmuje jeden wpis. Ponowienie tego samego entryId zwraca pierwotny czas odbioru (reguła 2). */
export function acceptEnvelope(db: Db, incidentId: string, raw: unknown): SyncResultItem {
  const entryId = typeof raw === 'object' && raw && 'entryId' in raw ? String((raw as { entryId: unknown }).entryId) : '';
  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return { entryId, accepted: false, duplicate: false, receivedTime: null, error: parsed.error.issues[0]?.message ?? 'Nieprawidłowy wpis.' };
  }
  const env = parsed.data as WitnessEnvelope;

  return transaction(db, () => {
    const existing = findExistingEntry(db, env.entryId);
    if (existing) {
      if (existing.incidentId !== incidentId) {
        return { entryId: env.entryId, accepted: false, duplicate: false, receivedTime: null, error: 'Wpis należy do innej sesji.' };
      }
      return { entryId: env.entryId, accepted: true, duplicate: true, receivedTime: existing.receivedTime, error: null };
    }
    try {
      if (loadIncident(db, incidentId).status === 'closed') throw new EntryRejected('Zdarzenie zostało zamknięte.');
      const receivedTime = nowIso();
      const common = {
        entryId: env.entryId,
        incidentId,
        deviceId: env.deviceId,
        seq: env.deviceSequence,
        deviceTime: env.deviceTime,
        receivedTime,
      };
      if (env.kind === 'observation') {
        validateObservation(db, incidentId, env);
        run(
          db,
          `INSERT INTO observations (entry_id, incident_id, author_kind, source, channel, answers_json, free_text, device_id, device_sequence, device_time, received_time)
           VALUES ($entryId, $incidentId, 'witness', 'witness-observation', 'https', $answers, $freeText, $deviceId, $seq, $deviceTime, $receivedTime)`,
          { ...common, answers: JSON.stringify(env.payload.answers), freeText: env.payload.freeText?.trim() || null },
        );
      } else if (env.kind === 'acknowledgement') {
        const { instructionId, instructionVersion, result, comment } = env.payload;
        if (!wasShownToWitness(db, incidentId, instructionId, instructionVersion)) {
          throw new EntryRejected('Ta wersja instrukcji nie została udostępniona w tej sesji.');
        }
        run(
          db,
          `INSERT INTO acknowledgements (entry_id, incident_id, instruction_id, instruction_version, result, comment, channel, device_id, device_sequence, device_time, received_time)
           VALUES ($entryId, $incidentId, $instructionId, $instructionVersion, $result, $comment, 'https', $deviceId, $seq, $deviceTime, $receivedTime)`,
          { ...common, instructionId, instructionVersion, result, comment: comment?.trim() || null },
        );
      } else {
        run(
          db,
          `INSERT INTO situation_change_reports (entry_id, incident_id, text, channel, device_sequence, device_time, received_time)
           VALUES ($entryId, $incidentId, $text, 'https', $seq, $deviceTime, $receivedTime)`,
          { entryId: common.entryId, incidentId, text: env.payload.text, seq: common.seq, deviceTime: common.deviceTime, receivedTime },
        );
      }
      return { entryId: env.entryId, accepted: true, duplicate: false, receivedTime, error: null };
    } catch (err) {
      if (err instanceof EntryRejected) {
        return { entryId: env.entryId, accepted: false, duplicate: false, receivedTime: null, error: err.message };
      }
      throw err;
    }
  });
}
