import { randomBytes, randomUUID } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Krótki identyfikator zdarzenia, czytelny w SMS-ie i przez telefon, np. ZD-7K3Q. */
export function incidentId(): string {
  const bytes = randomBytes(4);
  return 'ZD-' + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
