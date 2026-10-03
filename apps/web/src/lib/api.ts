// Klient HTTP. Każde żądanie świadka niesie token sesji; panel korzysta z sesji dyspozytora.
// Zapis zwraca jawne potwierdzenie odbioru — UI rozróżnia zapis lokalny od odbioru w centrali.

/** Odpowiedź serwera z błędem — połączenie działało. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Brak połączenia z serwerem — nie wiadomo, czy żądanie dotarło. */
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
  const headers: Record<string, string> = {};
  const method = opts.method ?? 'GET';
  if (method !== 'GET') headers['content-type'] = 'application/json';
  if (opts.witnessToken) headers.authorization = `Bearer ${opts.witnessToken}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10_000);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      signal: controller.signal,
      ...(method !== 'GET' ? { body: JSON.stringify(opts.body ?? {}) } : {}),
    });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Odpowiedź spoza API (np. strona błędu proxy) — traktujemy jak brak połączenia.
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
