// Checklista z sekcji 14, część synchronizacyjna:
// - ponowiona wysyłka: wpis występuje tylko raz
// - potwierdzenie starszej wersji nie potwierdza nowszej
// - czas urządzenia i czas odbioru zapisane oddzielnie
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { all } from '../src/db/client.js';
import { approveFirst, envelope, login, staffFetch, startTestEnv, witnessFetch, type TestEnv } from './helpers.js';

let env: TestEnv;
let cookie: string;
before(async () => {
  env = await startTestEnv();
  cookie = await login(env, 'dyspozytor');
});
after(() => env.close());

test('ponowiona wysyłka: wpis występuje tylko raz, z pierwotnym czasem odbioru', async () => {
  const entry = envelope('observation', { answers: [{ fieldKey: 'breathing', value: { known: true, value: 'yes' } }], freeText: null });
  const first = await (await witnessFetch(env, env.witnessToken, '/sync', { method: 'POST', body: { entries: [entry] } })).json();
  const second = await (await witnessFetch(env, env.witnessToken, '/sync', { method: 'POST', body: { entries: [entry, entry] } })).json();
  assert.equal(first.items[0].accepted, true);
  assert.equal(first.items[0].duplicate, false);
  assert.equal(second.items[0].duplicate, true);
  assert.equal(second.items[0].receivedTime, first.items[0].receivedTime);
  const rows = all(env.db, 'SELECT * FROM observations WHERE entry_id = $id', { id: entry.entryId });
  assert.equal(rows.length, 1);
});

test('czas urządzenia i czas odbioru zapisane oddzielnie (zegar telefonu może być błędny)', async () => {
  const deviceTime = '2020-01-01T08:00:00.000Z';
  const entry = envelope('situation-change', { text: 'Zaczął padać śnieg' }, { deviceTime });
  await witnessFetch(env, env.witnessToken, '/sync', { method: 'POST', body: { entries: [entry] } });
  const [row] = all<{ device_time: string; received_time: string }>(env.db, 'SELECT * FROM situation_change_reports WHERE entry_id = $id', {
    id: entry.entryId,
  });
  assert.equal(row!.device_time, deviceTime);
  assert.notEqual(row!.received_time, deviceTime);
  assert.ok(row!.received_time > '2025-01-01');
});

test('nowa wersja instrukcji: potwierdzenie starszej nie potwierdza nowszej', async () => {
  const v1 = await approveFirst(env, cookie);
  const ack = envelope('acknowledgement', { instructionId: v1.id, instructionVersion: 1, result: 'done', comment: null });
  const res = await (await witnessFetch(env, env.witnessToken, '/sync', { method: 'POST', body: { entries: [ack] } })).json();
  assert.equal(res.items[0].accepted, true);

  let panel = await (await staffFetch(env, cookie, `/incidents/${env.incidentId}`)).json();
  assert.equal(panel.instructionOutcomes.find((o: any) => o.instructionId === v1.id).state, 'done');

  const v2 = await (await staffFetch(env, cookie, `/instructions/${v1.id}`, { method: 'PATCH', body: { text: 'Nowa treść' } })).json();
  assert.equal(v2.version, 2);
  await staffFetch(env, cookie, `/instructions/${v1.id}/approve`, { method: 'POST', body: { version: 2 } });

  panel = await (await staffFetch(env, cookie, `/incidents/${env.incidentId}`)).json();
  const outcome = panel.instructionOutcomes.find((o: any) => o.instructionId === v1.id);
  assert.equal(outcome.currentVersion, 2);
  assert.equal(outcome.state, 'awaiting');
  assert.equal(outcome.olderVersionAcks.length, 1);
  // Starsza wersja zostaje w historii.
  assert.equal(panel.instructions.filter((i: any) => i.id === v1.id).length, 2);

  const session = await (await witnessFetch(env, env.witnessToken, '/session')).json();
  assert.equal(session.instructions.find((i: any) => i.id === v1.id).version, 2);
});

test('odpowiedź do szkicu, którego świadek nie widział, jest odrzucana', async () => {
  const panel = await (await staffFetch(env, cookie, `/incidents/${env.incidentId}`)).json();
  const draft = panel.instructions.find((i: any) => i.status === 'draft' && i.version === 1);
  const ack = envelope('acknowledgement', { instructionId: draft.id, instructionVersion: 1, result: 'done', comment: null });
  const res = await (await witnessFetch(env, env.witnessToken, '/sync', { method: 'POST', body: { entries: [ack] } })).json();
  assert.equal(res.items[0].accepted, false);
});
