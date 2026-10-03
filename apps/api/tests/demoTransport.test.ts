import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { pauseWitnessTransport } from '../../web/src/demo/transport.js';
import { api, NetworkError } from '../../web/src/lib/api.js';
import { startTestEnv } from './helpers.js';

test('przerwa demo blokuje żądania świadka, centrala działa, wznowienie dociera do API', async () => {
  const env = await startTestEnv();
  const originalFetch = globalThis.fetch;
  let sent = 0;
  globalThis.fetch = (input, init) => {
    sent++;
    return originalFetch(new URL(String(input), env.base), init);
  };
  try {
    pauseWitnessTransport(env.witnessToken, true);
    await assert.rejects(api('/witness/session', { witnessToken: env.witnessToken }), NetworkError);
    assert.equal(sent, 0);
    const health = await api<{ ok: boolean }>('/health');
    assert.equal(health.ok, true);
    assert.equal(sent, 1);
    pauseWitnessTransport(env.witnessToken, false);
    const session = await api<{ incident: { id: string } }>('/witness/session', { witnessToken: env.witnessToken });
    assert.equal(session.incident.id, env.incidentId);
    assert.equal(sent, 2);
  } finally {
    pauseWitnessTransport(env.witnessToken, false);
    globalThis.fetch = originalFetch;
    await env.close();
  }
});

test('wstrzymanie transmisji przerywa także pobieranie niepełnej odpowiedzi', async () => {
  let notify = () => {};
  const headersSent = new Promise<void>(resolve => { notify = resolve; });
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.write('{"ok":');
    notify();
    const timer = setTimeout(() => res.end('true}'), 1000);
    res.once('close', () => clearTimeout(timer));
  }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const port = (server.address() as AddressInfo).port;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => originalFetch(new URL(String(input), `http://127.0.0.1:${port}`), init);
  const token = 'witness-demo-fixture';
  try {
    const pending = api('/slow-response', { witnessToken: token });
    const rejected = assert.rejects(pending, NetworkError);
    await headersSent;
    pauseWitnessTransport(token, true);
    await rejected;
  } finally {
    pauseWitnessTransport(token, false);
    globalThis.fetch = originalFetch;
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
