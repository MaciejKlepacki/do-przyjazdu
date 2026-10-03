// POST /incidents/:id/equipment   dostępne wyposażenie lub dostawa pakietu (wpis dyspozytora)
// GET  /incidents/:id/equipment
import { Router } from 'express';
import { z } from 'zod';
import { run } from '../db/client.js';
import { newId, nowIso } from '../lib/ids.js';
import { loadEquipment } from '../services/records.js';
import { authorize, h, param, staffId, type Ctx } from './context.js';

export function equipmentRoutes(ctx: Ctx): Router {
  const r = Router();
  r.get(
    '/incidents/:id/equipment',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:read', id);
      res.json({ equipment: loadEquipment(ctx.db, id) });
    }),
  );
  r.post(
    '/incidents/:id/equipment',
    h((req, res) => {
      const id = param(req, 'id');
      authorize(ctx, req, 'incident:manage', id);
      const input = z
        .object({
          name: z.string().trim().min(1).max(120),
          state: z.enum(['declared-available', 'delivered', 'unavailable']),
          packageId: z.string().trim().max(60).nullish(),
        })
        .parse(req.body);
      const at = nowIso();
      const itemId = newId('eq');
      run(
        ctx.db,
        `INSERT INTO equipment (id, incident_id, name, state, package_id, author_kind, author_id, device_time, received_time)
         VALUES ($itemId, $id, $name, $state, $packageId, 'dispatcher', $author, $at, $at)`,
        { itemId, id, name: input.name, state: input.state, packageId: input.packageId || null, author: staffId(req), at },
      );
      res.status(201).json({ id: itemId });
    }),
  );
  return r;
}
