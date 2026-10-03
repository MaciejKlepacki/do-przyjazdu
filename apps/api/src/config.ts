// Odczyt i walidacja zmiennych środowiskowych z .env.example.
// DEMO_MODE=true musi być widoczne w odpowiedziach API, żeby UI oznaczyło symulację.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const ROOT_ENV = fileURLToPath(new URL('../../../.env', import.meta.url));

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_PATH: z.string().min(1).default('./data/do-przyjazdu.sqlite'),
  DEMO_MODE: bool.default('true'),
  DISPATCHER_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  WITNESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(720),
  /** Po ilu sekundach ciszy telefonu świadka panel pokazuje przerwę w kontakcie. */
  CONTACT_GAP_SECONDS: z.coerce.number().int().positive().default(30),
  ANTHROPIC_API_KEY: z.string().default(''),
  AI_MODEL: z.string().default('claude-opus-5-5'),
  SMS_INBOUND_SECRET: z.string().default(''),
  /** Numer, na który świadek wysyła SMS. Pusty = kanał tylko symulowany. */
  SMS_NUMBER: z.string().default(''),
  /** Stały token świadka dla demo (np. wydrukowany QR). Pusty = losowy przy każdym seedzie. */
  DEMO_WITNESS_TOKEN: z.string().default(''),
  PUBLIC_BASE_URL: z.string().default('http://localhost:5173'),
});

export type Config = z.infer<typeof schema>;

const INSECURE = new Set(['zmien-mnie', 'zmien-mnie-tez', '']);

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (env === process.env && env.NODE_ENV !== 'test' && existsSync(ROOT_ENV)) {
    process.loadEnvFile(ROOT_ENV);
  }
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Błędna konfiguracja (.env):\n${issues}`);
  }
  const config = parsed.data;
  const weak = INSECURE.has(config.DISPATCHER_PASSWORD) || INSECURE.has(config.SESSION_SECRET);
  if (weak && config.NODE_ENV === 'production') {
    throw new Error('DISPATCHER_PASSWORD i SESSION_SECRET mają wartości domyślne. Ustaw własne przed uruchomieniem produkcyjnym.');
  }
  if (weak && config.NODE_ENV === 'development') {
    console.warn('[config] Uwaga: domyślne DISPATCHER_PASSWORD / SESSION_SECRET - tylko do lokalnych prób.');
  }
  return config;
}

export function aiAvailable(config: Config): boolean {
  return config.ANTHROPIC_API_KEY.trim().length > 0;
}
