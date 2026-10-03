import type { Author, Timestamp } from './common.js';

/**
 * Świadek widzi instrukcję dopiero w stanie `approved` (sekcja 8).
 * Model AI nie może zmieniać tego stanu (sekcja 9).
 */
export type InstructionStatus = 'draft' | 'approved' | 'withdrawn';

/** Obiekt „Instrukcja” z sekcji 11. Wersjonowana — potwierdzenie dotyczy konkretnej wersji. */
export interface Instruction {
  id: string;
  incidentId: string;
  /** Rośnie przy każdej zmianie treści. Reguła synchronizacji 4 i 5. */
  version: number;
  /** Jedna czynność na ekranie, duży tekst (sekcja 7). */
  text: string;
  /** Opcjonalna ilustracja przygotowana dla scenariusza. */
  illustrationUrl: string | null;
  authorId: string;
  approvedBy: Author | null;
  status: InstructionStatus;
  approvedAt: Timestamp | null;
  withdrawnAt: Timestamp | null;
  createdAt: Timestamp;
}
