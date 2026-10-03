// Lista pól, których nie otrzymano lub oznaczonych „nie wiem”. Bez dopowiadania odpowiedzi (sekcja 9).
import type { FieldState, MissingInformationItem, Observation, ObservationField } from '@do-przyjazdu/shared';

function byObservedOrder(a: Observation, b: Observation): number {
  const t = a.times.deviceTime.localeCompare(b.times.deviceTime);
  return t !== 0 ? t : a.deviceSequence - b.deviceSequence;
}

export function fieldStates(fields: ObservationField[], observations: Observation[]): FieldState[] {
  const witness = observations.filter((o) => o.source === 'witness-observation').sort(byObservedOrder);
  return fields.map((field) => {
    const state: FieldState = { fieldKey: field.key, label: field.label, latest: null, lastKnown: null };
    for (const o of witness) {
      const answer = o.answers.find((a) => a.fieldKey === field.key);
      if (!answer) continue;
      const entry = { value: answer.value, entryId: o.entryId, times: o.times };
      state.latest = entry;
      if (answer.value.known) state.lastKnown = entry;
    }
    return state;
  });
}

export function missingInformation(states: FieldState[]): MissingInformationItem[] {
  return states.flatMap((s): MissingInformationItem[] => {
    if (!s.latest) return [{ fieldKey: s.fieldKey, label: s.label, reason: 'not-asked' }];
    if (!s.latest.value.known) return [{ fieldKey: s.fieldKey, label: s.label, reason: 'unknown' }];
    return [];
  });
}
