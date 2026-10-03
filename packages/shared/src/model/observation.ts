import type { Author, DeliveryChannel, DualTimestamps, InformationSource, MaybeKnown } from './common.js';

/** Pole formularza obserwacji. Treść ustala lekarz dla scenariusza (sekcja 6.3). */
export interface ObservationField {
  key: string;
  label: string;
  /** Formularz nie zmusza świadka do diagnozy - tylko do opisu tego, co widzi. */
  kind: 'single-choice' | 'multi-choice' | 'short-text' | 'number';
  options?: Array<{ value: string; label: string }>;
  unit?: string;
  /** „nie wiem” musi być zawsze dostępne. */
  allowsUnknown: true;
}

export interface ObservationAnswer {
  fieldKey: string;
  value: MaybeKnown<string | number | string[]>;
}

/** Obiekt „Obserwacja” z sekcji 11. */
export interface Observation {
  /** ID wpisu nadane na urządzeniu - klucz idempotencji (reguła 1 i 2). */
  entryId: string;
  incidentId: string;
  author: Author;
  source: InformationSource;
  channel: DeliveryChannel;
  answers: ObservationAnswer[];
  /** Dodatkowa swobodna uwaga świadka. Oryginał zachowywany bez zmian (sekcja 9). */
  freeText: string | null;
  /** Numer kolejności na urządzeniu (reguła 1). */
  deviceSequence: number;
  times: DualTimestamps;
}
