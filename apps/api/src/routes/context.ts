import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { can, type Action } from '../auth/roles.js';
import type { Config } from '../config.js';
import { get, type Db } from '../db/client.js';
import { forbidden, notFound, unauthorized } from '../lib/errors.js';

export interface Ctx {
  db: Db;
  config: Config;
}

/** Obsługa błędów także w handlerach asynchronicznych (Express 4). */
export const h =
  (fn: (req: Request, res: Response) => unknown): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      Promise.resolve(fn(req, res)).catch(next);
    } catch (err) {
      next(err);
    }
  };

/** Backend weryfikuje rolę przy każdym odczycie i zapisie (sekcja 11). */
export function authorize(ctx: Ctx, req: Request, action: Action, incidentId: string): void {
  if (!req.actor) throw unauthorized();
  if (!get(ctx.db, 'SELECT 1 AS ok FROM incidents WHERE id = $id', { id: incidentId })) throw notFound('Nie ma takiego zdarzenia.');
  if (!can(ctx.db, req.actor, action, incidentId)) throw forbidden();
}

export function staffId(req: Request): string {
  if (req.actor?.kind !== 'staff') throw unauthorized();
  return req.actor.userId;
}

export function param(req: Request, name: string): string {
  return String(req.params[name] ?? '');
}
