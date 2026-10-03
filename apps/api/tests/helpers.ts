import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { loadConfig, type Config } from '../src/config.js';
import { openDatabase, type Db } from '../src/db/client.js';
import { migrate } from '../src/db/migrate.js';
import { seedDemo } from '../src/db/seedDemo.js';

export interface TestEnv {
  db: Db;
  config: Config;
  base: string;
  server: Server;
  witnessToken: string;
  incidentId: string;
  close(): Promise<void>;
}

export async function startTestEnv(overrides: Record<string, string> = {}): Promise<TestEnv> {
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_PATH: ':memory:',
    DISPATCHER_PASSWORD: 'test-haslo',
    SESSION_SECRET: 'test-sekret',
    ANTHROPIC_API_KEY: '',
    ...overrides,
  });
  const db = openDatabase(':memory:');
  migrate(db);
  const seeded = seedDemo(db, config);
  const server = createApp(db, config).listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address() as AddressInfo;
  return {
    db,
    config,
    server,
    base: `http://127.0.0.1:${port}/api`,
    witnessToken: seeded.witnessPath.slice('/w/'.length),
    incidentId: seeded.incidentId,
    close: () => new Promise((r) => server.close(() => r())),
  };
}

export async function login(env: TestEnv, userId: string): Promise<string> {
  const res = await fetch(`${env.base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId, password: 'test-haslo' }),
  });
  if (res.status !== 200) throw new Error(`login ${res.status}`);
  return res.headers.get('set-cookie')!.split(';')[0]!;
}

export function staffFetch(env: TestEnv, cookie: string, path: string, init: { method?: string; body?: unknown } = {}) {
  return fetch(`${env.base}${path}`, {
    method: init.method ?? 'GET',
    headers: { cookie, 'content-type': 'application/json' },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
}

export function witnessFetch(env: TestEnv, token: string, path: string, init: { method?: string; body?: unknown } = {}) {
  return fetch(`${env.base}/witness${path}`, {
    method: init.method ?? 'GET',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
}

let seq = 0;
export function envelope(kind: string, payload: unknown, extra: Record<string, unknown> = {}) {
  return { entryId: randomUUID(), deviceId: 'test-device', deviceSequence: ++seq, deviceTime: new Date().toISOString(), kind, payload, ...extra };
}

/** Zatwierdza pierwszą instrukcję zdarzenia i zwraca ją. */
export async function approveFirst(env: TestEnv, cookie: string) {
  const panel = await (await staffFetch(env, cookie, `/incidents/${env.incidentId}`)).json();
  const first = panel.instructions[0];
  const res = await staffFetch(env, cookie, `/instructions/${first.id}/approve`, { method: 'POST', body: { version: first.version } });
  if (res.status !== 200) throw new Error(`approve ${res.status}`);
  return res.json();
}
