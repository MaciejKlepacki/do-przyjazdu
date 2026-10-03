import type { Acknowledgement } from '../model/acknowledgement.js';
import type { Timestamp } from '../model/common.js';
import type { EquipmentItem } from '../model/equipment.js';
import type { ContactGap, FieldState, Handover, MissingInformationItem } from '../model/handover.js';
import type { Incident } from '../model/incident.js';
import type { Instruction } from '../model/instruction.js';
import type { Observation, ObservationField } from '../model/observation.js';
import type { SituationChangeReport } from '../model/situationChange.js';
import type { InboundSms } from '../model/sms.js';
import type { StaffUser } from '../model/staff.js';
import type { InstructionOutcome } from '../sync/instructionOutcome.js';

/** Odpowiedzi API współdzielone przez backend i frontend. */

export interface WitnessIncidentView {
  id: string;
  description: string;
  status: Incident['status'];
  isDemo: boolean;
}

/** Stan sesji dla telefonu świadka. Zawiera wyłącznie zatwierdzone instrukcje (sekcja 8). */
export interface WitnessSessionResponse {
  incident: WitnessIncidentView;
  fields: ObservationField[];
  /** Najnowsza zatwierdzona wersja każdej niewycofanej instrukcji. */
  instructions: Instruction[];
  equipment: EquipmentItem[];
  /** Wpisy, które centrala odebrała SMS-em (reguła 8). */
  smsReceipts: Array<{ entryId: string; receivedTime: Timestamp; readAt: Timestamp | null }>;
  sms: { number: string | null; simulated: boolean };
  demoMode: boolean;
  accessExpiresAt: Timestamp;
  serverTime: Timestamp;
}

export interface MeResponse {
  user: StaffUser;
  demoMode: boolean;
  aiAvailable: boolean;
}

export interface IncidentSummary {
  id: string;
  description: string;
  status: Incident['status'];
  isDemo: boolean;
  createdAt: Timestamp;
  lastReceivedAt: Timestamp | null;
  openReviews: number;
}

export interface WitnessLinkInfo {
  id: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  revokedAt: Timestamp | null;
  lastSeenAt: Timestamp | null;
}

export interface WitnessLinkCreated extends WitnessLinkInfo {
  /** Token pokazywany tylko raz - w bazie zostaje skrót. */
  token: string;
  path: string;
}

export interface ContactStatus {
  /** Ostatnie dowolne żądanie z telefonu świadka. */
  lastWitnessContactAt: Timestamp | null;
  /** Ostatni wpis odebrany od świadka (obserwacja, potwierdzenie, zgłoszenie, SMS). */
  lastReceivedAt: Timestamp | null;
  /** Trwająca przerwa w kontakcie, jeśli świadek nie odzywa się dłużej niż próg. */
  ongoingGapSince: Timestamp | null;
  gapThresholdSeconds: number;
  gaps: ContactGap[];
}

export interface IncidentPanelResponse {
  incident: Incident;
  contact: ContactStatus;
  witnessLinks: WitnessLinkInfo[];
  fields: ObservationField[];
  fieldStates: FieldState[];
  missingInformation: MissingInformationItem[];
  observations: Observation[];
  /** Wszystkie wersje - nic nie jest nadpisywane. */
  instructions: Instruction[];
  instructionOutcomes: InstructionOutcome[];
  acknowledgements: Acknowledgement[];
  equipment: EquipmentItem[];
  situationReports: SituationChangeReport[];
  sms: InboundSms[];
  assignedResponders: StaffUser[];
  staff: StaffUser[];
  handover: Handover | null;
  serverTime: Timestamp;
}

export interface ApiError {
  error: string;
  message: string;
}
