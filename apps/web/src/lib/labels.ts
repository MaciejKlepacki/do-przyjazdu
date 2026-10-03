import type {
  AcknowledgementResult,
  DeliveryChannel,
  EquipmentItem,
  IncidentStatus,
  InformationSource,
  InstructionOutcomeState,
  MaybeKnown,
  ObservationField,
  SmsFallbackStatus,
} from '@do-przyjazdu/shared';

export const ACK_LABEL: Record<AcknowledgementResult, string> = {
  done: 'Wykonane',
  'cannot-do': 'Nie mogę wykonać',
  'needs-clarification': 'Potrzebuję wyjaśnienia',
};

export const OUTCOME_LABEL: Record<InstructionOutcomeState, string> = {
  awaiting: 'Bez odpowiedzi',
  ...ACK_LABEL,
};

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  open: 'Otwarte',
  'handed-over': 'Przekazane ratownikowi',
  closed: 'Zamknięte',
};

export const SOURCE_LABEL: Record<InformationSource, string> = {
  'witness-observation': 'Obserwacja świadka',
  'device-measurement': 'Pomiar urządzenia',
  'dispatcher-assessment': 'Ocena prowadzącego',
  simulated: 'Symulacja',
};

export const CHANNEL_LABEL: Record<DeliveryChannel, string> = {
  https: 'internet',
  'sms-inbound': 'SMS',
  'demo-seed': 'dane demo',
};

export const EQUIPMENT_STATE_LABEL: Record<EquipmentItem['state'], string> = {
  'declared-available': 'Dostępne na miejscu',
  delivered: 'Dostarczone',
  unavailable: 'Niedostępne',
};

export const SMS_STATUS_LABEL: Record<SmsFallbackStatus, string> = {
  prepared: 'Przygotowano',
  'sms-app-opened': 'Otwarto aplikację SMS',
  'declared-sent': 'Wysłano z telefonu (wg świadka)',
  'received-by-center': 'Odebrano przez centralę',
  'read-by-lead': 'Przeczytano przez prowadzącego',
};

/** Tekst odpowiedzi. „Nie wiem” pokazujemy jako brak danych, nigdy jako wartość. */
export function answerText(field: ObservationField | undefined, value: MaybeKnown<string | number | string[]>): string {
  if (!value.known) return value.reason === 'unknown' ? 'nie wiem' : 'nie zapytano';
  const label = (v: string) => field?.options?.find((o) => o.value === v)?.label ?? v;
  if (Array.isArray(value.value)) return value.value.map(label).join(', ') || '-';
  return typeof value.value === 'number' ? `${value.value}${field?.unit ? ' ' + field.unit : ''}` : label(value.value);
}

export const ROLE_LABEL: Record<'dispatcher' | 'responder', string> = {
  dispatcher: 'Dyspozytor',
  responder: 'Ratownik',
};
