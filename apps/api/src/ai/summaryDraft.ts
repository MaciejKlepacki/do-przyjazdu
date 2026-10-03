// Opcjonalny szkic podsumowania (sekcja 9).
// Wejście: wyłącznie wpisy osi czasu. Wyjście: tekst + cited_entry_ids.
// Model nie zmienia statusów, nie zatwierdza decyzji i nie dopisuje faktów.
// Brak klucza API => brak szkicu; widok przekazania działa dalej.
import Anthropic from '@anthropic-ai/sdk';
import type { AiSummaryDraft, AiSummarySentence, TimelineEvent } from '@do-przyjazdu/shared';
import type { Config } from '../config.js';
import { run, type Db } from '../db/client.js';
import { HttpError } from '../lib/errors.js';
import { newId, nowIso } from '../lib/ids.js';
import { loadLatestAiDraft } from '../services/records.js';
import { buildTimeline } from '../services/timeline.js';
import { checkSentences } from './guardrails.js';

const SYSTEM = `Przygotowujesz szkic krótkiego podsumowania przekazania dla ratownika docierającego na miejsce.
Zasady bezwzględne:
- Opisuj wyłącznie to, co jest we wpisach. Nie dodawaj faktów, przypuszczeń, rozpoznań ani zaleceń leczenia.
- Każde zdanie musi wskazywać identyfikatory wpisów (pole "id"), na których się opiera.
- Odpowiedź „nie wiem” oznacza brak informacji - tak ją opisz, nie zgaduj wartości.
- Przy obserwacjach podawaj czas odbioru; zaznacz, jeśli informacja jest stara albo był okres bez kontaktu.
- Pisz po polsku, rzeczowo, maksymalnie 8 zdań.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    sentences: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, entryIds: { type: 'array', items: { type: 'string' } } },
        required: ['text', 'entryIds'],
        additionalProperties: false,
      },
    },
  },
  required: ['sentences'],
  additionalProperties: false,
} as const;

/** Zwięzła postać osi czasu dla modelu - bez danych dostępowych. */
function timelineForModel(events: TimelineEvent[]) {
  return events.map((e) => {
    const base = { id: e.id, type: e.type, serverTime: e.at };
    switch (e.type) {
      case 'observation':
        return { ...base, deviceTime: e.data.times.deviceTime, source: e.data.source, answers: e.data.answers, note: e.data.freeText };
      case 'instruction-approved':
      case 'instruction-withdrawn':
        return { ...base, instructionId: e.data.id, version: e.data.version, text: e.data.text };
      case 'acknowledgement':
        return { ...base, instructionId: e.data.instructionId, version: e.data.instructionVersion, result: e.data.result, comment: e.data.comment };
      case 'equipment':
        return { ...base, name: e.data.name, state: e.data.state, packageId: e.data.packageId };
      case 'situation-change-report':
        return { ...base, text: e.data.text, reviewed: Boolean(e.data.reviewedAt) };
      case 'sms-received':
        return { ...base, text: e.data.rawText };
      case 'contact-gap':
        return { ...base, from: e.data.from, to: e.data.to };
      default:
        return { ...base, data: e.data };
    }
  });
}

export async function generateSummaryDraft(db: Db, config: Config, incidentId: string): Promise<AiSummaryDraft> {
  if (!config.ANTHROPIC_API_KEY) throw new HttpError(503, 'ai-unavailable', 'AI nie jest skonfigurowane. Widok przekazania działa bez niego.');
  const events = buildTimeline(db, incidentId, config.CONTACT_GAP_SECONDS);
  if (events.length === 0) throw new HttpError(400, 'empty', 'Brak wpisów do podsumowania.');

  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, timeout: 60_000, maxRetries: 1 });
  let sentences: AiSummarySentence[];
  try {
    const response = await client.beta.messages.create({
      model: config.AI_MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Wpisy osi czasu (JSON):\n${JSON.stringify(timelineForModel(events))}` }],
    } as Parameters<typeof client.beta.messages.create>[0] & { stream?: false });
    if (response.stop_reason === 'refusal') throw new HttpError(502, 'ai-refused', 'Model odmówił przygotowania szkicu.');
    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    sentences = (JSON.parse(text) as { sentences: AiSummarySentence[] }).sentences;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof Anthropic.APIError) throw new HttpError(502, 'ai-error', `Usługa AI niedostępna (${err.status ?? 'sieć'}).`);
    throw new HttpError(502, 'ai-error', 'Nie udało się odczytać odpowiedzi AI.');
  }

  const { accepted, rejectedCount } = checkSentences(sentences, new Set(events.map((e) => e.id)));
  const cited = [...new Set(accepted.flatMap((s) => s.entryIds))];
  run(
    db,
    `INSERT INTO ai_summary_drafts (id, incident_id, text, cited_entry_ids, generated_at, sentences_json, rejected_count)
     VALUES ($id, $incidentId, $text, $cited, $at, $sentences, $rejected)`,
    {
      id: newId('ai'),
      incidentId,
      text: accepted.map((s) => s.text).join(' '),
      cited: JSON.stringify(cited),
      at: nowIso(),
      sentences: JSON.stringify(accepted),
      rejected: rejectedCount,
    },
  );
  return loadLatestAiDraft(db, incidentId)!;
}
