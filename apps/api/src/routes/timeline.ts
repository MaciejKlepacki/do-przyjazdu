// GET /incidents/:id/timeline   chronologiczny przebieg: obserwacje, instrukcje,
// potwierdzenia, wyposażenie, zgłoszenia, SMS-y, przerwy w kontakcie, zmiany statusu
import { Router } from 'express';
import { buildTimeline } from '../services/timeline.js';
import { authorize, h, param, type Ctx } from './context.js';

export function timelineRoutes(ctx: Ctx): Router {
  const r = Router();
  r.get(
    '/incidents/:id/timeline',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:read', id);
      res.json(buildTimeline(ctx.db, id, ctx.config.CONTACT_GAP_SECONDS));
    }),
  );
  return r;
}
