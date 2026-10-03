/** Błąd z kodem HTTP; komunikat trafia do UI, więc bez szczegółów technicznych. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Nie znaleziono.') => new HttpError(404, 'not-found', what);
export const forbidden = (msg = 'Brak uprawnień do tego zdarzenia.') => new HttpError(403, 'forbidden', msg);
export const unauthorized = (msg = 'Wymagane zalogowanie.') => new HttpError(401, 'unauthorized', msg);
export const badRequest = (msg: string) => new HttpError(400, 'bad-request', msg);
export const conflict = (msg: string) => new HttpError(409, 'conflict', msg);
