// POST /witness/acknowledgements   wykonane / niewykonalne / wymaga wyjaśnienia
// Odpowiedź zawsze wskazuje instruction_id + instruction_version (reguła 4).
import { Router } from 'express';
import type { Ctx } from './context.js';
import { singleWitnessEntry } from './observations.js';

export function acknowledgementRoutes(ctx: Ctx): Router {
  const r = Router();
  r.post('/acknowledgements', singleWitnessEntry(ctx, 'acknowledgement'));
  return r;
}
