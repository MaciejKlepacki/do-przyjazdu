// Sprawdzenie szkicu przed pokazaniem: każde zdanie ma odnośnik do istniejącego wpisu,
// brak nowych faktów, brak treści diagnostycznych i zaleceń leczenia.
import type { AiSummarySentence } from '@do-przyjazdu/shared';

/** Słowa wskazujące na rozpoznanie lub zalecenie - takie zdania odrzucamy (sekcje 6 i 9). */
const FORBIDDEN = [
  /diagnoz/i,
  /rozpozna(nie|no|ję)/i,
  /prawdopodobnie (ma|jest|doszło)/i,
  /podejrzewa/i,
  /zaleca(m|my|ne)/i,
  /należy (podać|zastosować|wykonać)/i,
  /poda(ć|j|no) (lek|leki)/i,
  /\b(mg|ml)\b/i,
];

export interface GuardrailResult {
  accepted: AiSummarySentence[];
  rejectedCount: number;
}

export function checkSentences(sentences: AiSummarySentence[], knownEntryIds: ReadonlySet<string>): GuardrailResult {
  const accepted: AiSummarySentence[] = [];
  let rejectedCount = 0;
  for (const s of sentences) {
    const text = s.text.trim();
    const ids = [...new Set(s.entryIds)];
    const cited = ids.length > 0 && ids.every((id) => knownEntryIds.has(id));
    const safe = !FORBIDDEN.some((re) => re.test(text));
    if (text && cited && safe) accepted.push({ text, entryIds: ids });
    else rejectedCount++;
  }
  return { accepted, rejectedCount };
}
