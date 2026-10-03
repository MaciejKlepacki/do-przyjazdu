import type { Acknowledgement, AcknowledgementResult } from '../model/acknowledgement.js';

export type InstructionOutcomeState = 'awaiting' | AcknowledgementResult;

type AckLike = Pick<Acknowledgement, 'entryId' | 'instructionId' | 'instructionVersion' | 'result' | 'deviceSequence' | 'times'>;

export interface InstructionOutcome {
  instructionId: string;
  currentVersion: number;
  state: InstructionOutcomeState;
  /** Ostatnia odpowiedź dotycząca bieżącej wersji. */
  latest: AckLike | null;
  /** Odpowiedzi do starszych wersji: zostają w historii, ale nie potwierdzają bieżącej (reguła 5). */
  olderVersionAcks: AckLike[];
}

function ackOrder(a: AckLike, b: AckLike): number {
  const byTime = a.times.deviceTime.localeCompare(b.times.deviceTime);
  return byTime !== 0 ? byTime : a.deviceSequence - b.deviceSequence;
}

/** Reguły 4 i 5: odpowiedź liczy się tylko dla wersji, której dotyczy. */
export function instructionOutcome(
  instruction: { id: string; version: number },
  acks: readonly AckLike[],
): InstructionOutcome {
  const own = acks.filter((a) => a.instructionId === instruction.id).slice().sort(ackOrder);
  const current = own.filter((a) => a.instructionVersion === instruction.version);
  const latest = current.at(-1) ?? null;
  return {
    instructionId: instruction.id,
    currentVersion: instruction.version,
    state: latest ? latest.result : 'awaiting',
    latest,
    olderVersionAcks: own.filter((a) => a.instructionVersion < instruction.version),
  };
}
