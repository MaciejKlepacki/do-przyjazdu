// - brak zatwierdzenia: świadek nie otrzymuje szkicu instrukcji
// - odpowiedź „nie wiem” zostaje brakiem informacji
// - niedostępne AI: historia i podstawowy widok przekazania nadal działają
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { approveFirst, envelope, login, staffFetch, startTestEnv, witnessFetch, type TestEnv } from './helpers.js';

let env: TestEnv;
let cookie: string;
before(async () => {
  env = await startTestEnv();
  cookie = await login(env, 'dyspozytor');
});
after(() => env.close());

test('brak zatwierdzenia: świadek nie otrzymuje szkicu instrukcji', async () => {
  const session = await (await witnessFetch(env, env.witnessToken, '/session')).json();
  assert.equal(session.instructions.length, 0);
  const approved = await approveFirst(env, cookie);
  const after = await (await witnessFetch(env, env.witnessToken, '/session')).json();
  assert.deepEqual(after.instructions.map((i: any) => i.id), [approved.id]);
  assert.ok(after.instructions.every((i: any) => i.status === 'approved'));

  await staffFetch(env, cookie, `/instructions/${approved.id}/withdraw`, { method: 'POST', body: {} });
  const withdrawn = await (await witnessFetch(env, env.witnessToken, '/session')).json();
  assert.equal(withdrawn.instructions.length, 0);
});

test('odpowiedź „nie wiem” zostaje brakiem informacji', async () => {
  const entry = envelope('observation', {
    answers: [
      { fieldKey: 'responds', value: { known: true, value: 'yes' } },
      { fieldKey: 'breathing', value: { known: false, reason: 'unknown' } },
    ],
    freeText: null,
  });
  await witnessFetch(env, env.witnessToken, '/sync', { method: 'POST', body: { entries: [entry] } });
  const report = await (await staffFetch(env, cookie, `/incidents/${env.incidentId}/handover`)).json();
  const breathing = report.missingInformation.find((m: any) => m.fieldKey === 'breathing');
  assert.equal(breathing.reason, 'unknown');
  assert.equal(report.fieldStates.find((f: any) => f.fieldKey === 'breathing').lastKnown, null);
  assert.ok(!report.missingInformation.some((m: any) => m.fieldKey === 'responds'));
  assert.equal(report.missingInformation.find((m: any) => m.fieldKey === 'weather').reason, 'not-asked');
});

test('niedostępne AI: historia i podstawowy widok przekazania nadal działają', async () => {
  const report = await (await staffFetch(env, cookie, `/incidents/${env.incidentId}/handover`)).json();
  assert.equal(report.aiAvailable, false);
  assert.equal(report.aiDraft, null);
  assert.ok(report.timeline.length > 0);
  const ai = await staffFetch(env, cookie, `/incidents/${env.incidentId}/ai-draft`, { method: 'POST', body: {} });
  assert.equal(ai.status, 503);

  const responder = await login(env, 'ratownik');
  const accepted = await staffFetch(env, responder, `/incidents/${env.incidentId}/handover`, { method: 'POST', body: {} });
  assert.equal(accepted.status, 201);
  const body = await accepted.json();
  assert.equal(body.incident.status, 'handed-over');
  assert.ok(body.timeline.some((e: any) => e.type === 'handover'));
});
