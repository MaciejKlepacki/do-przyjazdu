// - unieważniony link: serwer odmawia dalszego dostępu
// - próba dostępu do innej sesji: odmowa odczytu i zapisu
// - panel bez uwierzytelnienia: odmowa
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { issue } from '../src/auth/witnessToken.js';
import { createIncident } from '../src/services/incidentSetup.js';
import { envelope, login, staffFetch, startTestEnv, witnessFetch, type TestEnv } from './helpers.js';

let env: TestEnv;
let cookie: string;
before(async () => {
  env = await startTestEnv();
  cookie = await login(env, 'dyspozytor');
});
after(() => env.close());

test('unieważniony link: serwer odmawia dalszego dostępu', async () => {
  const created = await (await staffFetch(env, cookie, `/incidents/${env.incidentId}/witness-links`, { method: 'POST', body: {} })).json();
  assert.equal((await witnessFetch(env, created.token, '/session')).status, 200);
  assert.equal((await staffFetch(env, cookie, `/witness-links/${created.id}`, { method: 'DELETE', body: {} })).status, 200);
  const denied = await witnessFetch(env, created.token, '/session');
  assert.equal(denied.status, 401);
  assert.equal((await denied.json()).error, 'witness-revoked');
  const write = await witnessFetch(env, created.token, '/sync', { method: 'POST', body: { entries: [envelope('situation-change', { text: 'x' })] } });
  assert.equal(write.status, 401);
});

test('próba dostępu do innej sesji: odmowa odczytu i zapisu', async () => {
  // Inne zdarzenie, prowadzone przez innego dyspozytora.
  const otherId = createIncident(env.db, { description: 'Inne zdarzenie', leadDispatcherId: 'inny-dyspozytor', isDemo: true });
  const otherLink = issue(env.db, otherId, 60);

  // Dyspozytor nieprowadzący: odmowa odczytu i zapisu.
  assert.equal((await staffFetch(env, cookie, `/incidents/${otherId}`)).status, 403);
  assert.equal((await staffFetch(env, cookie, `/incidents/${otherId}/instructions`, { method: 'POST', body: { text: 'x' } })).status, 403);

  // Świadek zdarzenia A nie potwierdzi instrukcji zdarzenia B.
  const other = await (await witnessFetch(env, otherLink.token, '/session')).json();
  assert.equal(other.incident.id, otherId);
  const panelOther = env.db.prepare("SELECT id FROM instructions WHERE incident_id = $id LIMIT 1").get({ id: otherId }) as { id: string };
  env.db.prepare("UPDATE instructions SET status = 'approved', approved_at = '2026-01-01T00:00:00Z' WHERE id = $id").run({ id: panelOther.id });
  const ack = envelope('acknowledgement', { instructionId: panelOther.id, instructionVersion: 1, result: 'done', comment: null });
  const res = await (await witnessFetch(env, env.witnessToken, '/sync', { method: 'POST', body: { entries: [ack] } })).json();
  assert.equal(res.items[0].accepted, false);

  // Wpis z identyfikatorem należącym do innej sesji nie zostaje „przejęty”.
  const entry = envelope('situation-change', { text: 'z sesji B' });
  await witnessFetch(env, otherLink.token, '/sync', { method: 'POST', body: { entries: [entry] } });
  const replay = await (await witnessFetch(env, env.witnessToken, '/sync', { method: 'POST', body: { entries: [entry] } })).json();
  assert.equal(replay.items[0].accepted, false);

  // Token świadka nie otwiera panelu.
  const viaToken = await fetch(`${env.base}/incidents/${env.incidentId}`, { headers: { authorization: `Bearer ${env.witnessToken}` } });
  assert.equal(viaToken.status, 401);
});

test('panel bez uwierzytelnienia: odmowa', async () => {
  assert.equal((await fetch(`${env.base}/incidents`)).status, 401);
  assert.equal((await fetch(`${env.base}/incidents/${env.incidentId}/handover`)).status, 401);
  const badLogin = await fetch(`${env.base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'dyspozytor', password: 'zle' }),
  });
  assert.equal(badLogin.status, 401);
});

test('ratownik widzi tylko przydzielone zdarzenie i nie zarządza instrukcjami', async () => {
  const responder = await login(env, 'ratownik');
  assert.equal((await staffFetch(env, responder, `/incidents/${env.incidentId}/handover`)).status, 200);
  const otherId = createIncident(env.db, { description: 'Nieprzydzielone', leadDispatcherId: 'dyspozytor', isDemo: true });
  assert.equal((await staffFetch(env, responder, `/incidents/${otherId}/handover`)).status, 403);
  assert.equal((await staffFetch(env, responder, `/incidents/${env.incidentId}/instructions`, { method: 'POST', body: { text: 'x' } })).status, 403);
});

test('SMS z nieznaną sesją trafia do ręcznej weryfikacji', async () => {
  const sms = await (
    await staffFetch(env, cookie, '/sms/simulate', { method: 'POST', body: { text: 'DP ZD-NIEMA #abc Pomocy' } })
  ).json();
  assert.equal(sms.needsManualReview, true);
  assert.equal(sms.linkedIncidentId, null);
  const known = await (
    await staffFetch(env, cookie, '/sms/simulate', { method: 'POST', body: { text: `DP ${env.incidentId} #entry-123 Zimno GPS:49.2,20.0` } })
  ).json();
  assert.equal(known.needsManualReview, false);
  assert.equal(known.linkedEntryId, 'entry-123');
  assert.equal(known.isSimulated, true);
});
