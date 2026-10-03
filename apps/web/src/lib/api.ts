import { trackWitnessRequest, witnessTransportPaused } from '../demo/transport';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Brak połączenia z serwerem.');
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  witnessToken?: string;
  timeoutMs?: number;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (opts.witnessToken && witnessTransportPaused(opts.witnessToken)) throw new NetworkError();
  const headers: Record<string, string> = {};
  const method = opts.method ?? 'GET';
  if (method !== 'GET') headers['content-type'] = 'application/json';
  if (opts.witnessToken) headers.authorization = `Bearer ${opts.witnessToken}`;
  const controller = new AbortController();
  const untrack = opts.witnessToken ? trackWitnessRequest(opts.witnessToken, controller) : () => undefined;
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10_000);
  let res: Response;
  let text: string;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      signal: controller.signal,
      ...(method !== 'GET' ? { body: JSON.stringify(opts.body ?? {}) } : {}),
    });
    text = await res.text();
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
    untrack();
  }
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) {
    const err = (data ?? {}) as { error?: string; message?: string };
    throw new ApiError(res.status, err.error ?? 'error', err.message ?? `Błąd ${res.status}`);
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError || err instanceof NetworkError) return err.message;
  return 'Coś poszło nie tak.';
}
