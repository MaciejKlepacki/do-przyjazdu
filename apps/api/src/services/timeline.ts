// Chronologiczny przebieg zdarzenia z wszystkich tabel. Nic nie jest usuwane ani scalane.
import type { TimelineEvent } from '@do-przyjazdu/shared';
import type { Db } from '../db/client.js';
import { contactStatus } from './contactWindow.js';
import {
  loadAcknowledgements,
  loadEquipment,
  loadHandover,
  loadInstructions,
  loadObservations,
  loadSituationReports,
  loadSms,
  loadStatusChanges,
} from './records.js';

export function buildTimeline(db: Db, incidentId: string, gapThresholdSeconds: number): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const o of loadObservations(db, incidentId)) {
    events.push({ id: o.entryId, type: 'observation', at: o.times.receivedTime!, data: o });
  }
  const withdrawals = new Map<string, TimelineEvent>();
  for (const i of loadInstructions(db, incidentId)) {
    if (i.approvedAt) events.push({ id: `${i.id}@v${i.version}`, type: 'instruction-approved', at: i.approvedAt, data: i });
    if (i.withdrawnAt && i.approvedAt) {
      // Jedno wycofanie obejmuje wszystkie wersje — pokazujemy je raz, z najwyższą wersją.
      withdrawals.set(`${i.id}|${i.withdrawnAt}`, {
        id: `${i.id}@withdrawn@${i.withdrawnAt}`,
        type: 'instruction-withdrawn',
        at: i.withdrawnAt,
        data: i,
      });
    }
  }
  events.push(...withdrawals.values());
  for (const a of loadAcknowledgements(db, incidentId)) {
    events.push({ id: a.entryId, type: 'acknowledgement', at: a.times.receivedTime!, data: a });
  }
  for (const e of loadEquipment(db, incidentId)) {
    events.push({ id: e.id, type: 'equipment', at: e.times.receivedTime!, data: e });
  }
  for (const s of loadStatusChanges(db, incidentId)) {
    events.push({ id: s.id, type: 'status-change', at: s.at, data: { from: s.from, to: s.to, byUserId: s.byUserId } });
  }
  for (const r of loadSituationReports(db, incidentId)) {
    events.push({ id: r.entryId, type: 'situation-change-report', at: r.times.receivedTime!, data: r });
  }
  for (const s of loadSms(db, incidentId)) {
    events.push({ id: s.id, type: 'sms-received', at: s.receivedTime, data: s });
  }
  for (const g of contactStatus(db, incidentId, gapThresholdSeconds).gaps) {
    events.push({ id: `gap@${g.from}`, type: 'contact-gap', at: g.from, data: g });
  }
  const handover = loadHandover(db, incidentId);
  if (handover) events.push({ id: handover.id, type: 'handover', at: handover.acceptedAt, data: handover });
  return events.sort((a, b) => a.at.localeCompare(b.at));
}
