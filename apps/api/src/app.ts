// Montaż tras i middleware.
// Kolejność: config -> db -> auth -> routes.
// Backend weryfikuje rolę przy każdym odczycie i zapisie (sekcja 11).
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express, { Router, type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { requireStaff } from './auth/dispatcher.js';
import type { Config } from './config.js';
import type { Db } from './db/client.js';
import { HttpError } from './lib/errors.js';
import { acknowledgementRoutes } from './routes/acknowledgements.js';
import { authRoutes } from './routes/auth.js';
import type { Ctx } from './routes/context.js';
import { equipmentRoutes } from './routes/equipment.js';
import { handoverRoutes } from './routes/handover.js';
import { incidentRoutes } from './routes/incidents.js';
import { instructionRoutes, witnessInstructionRoutes } from './routes/instructions.js';
import { observationRoutes, witnessObservationRoutes } from './routes/observations.js';
import { situationReviewRoutes, witnessSituationRoutes } from './routes/situationChanges.js';
import { smsRoutes } from './routes/smsInbound.js';
import { syncRoutes } from './routes/sync.js';
import { timelineRoutes } from './routes/timeline.js';
import { requireWitness, witnessLinkRoutes, witnessRoutes } from './routes/witnessAccess.js';

const WEB_DIST = fileURLToPath(new URL('../../web/dist/', import.meta.url));

/** Zapisy panelu wymagają JSON - formularz z obcej strony nie przejdzie bez preflight CORS. */
function requireJsonForWrites(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.is('application/json')) return next();
  res.status(415).json({ error: 'unsupported-media-type', message: 'Wymagany Content-Type: application/json.' });
}

export function createApp(db: Db, config: Config) {
  const ctx: Ctx = { db, config };
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Link świadka zawiera token w ścieżce - nie wysyłamy go dalej w nagłówku Referer.
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  const api = Router();
  api.use(express.json({ limit: '256kb' }));
  api.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  api.get('/health', (_req, res) => res.json({ ok: true, demoMode: config.DEMO_MODE }));
  api.get('/config', (_req, res) => res.json({ demoMode: config.DEMO_MODE }));
  api.use(authRoutes(ctx));

  const witness = Router();
  witness.use(requireWitness(ctx));
  witness.use(witnessRoutes(ctx));
  witness.use(syncRoutes(ctx));
  witness.use(witnessObservationRoutes(ctx));
  witness.use(acknowledgementRoutes(ctx));
  witness.use(witnessSituationRoutes(ctx));
  witness.use(witnessInstructionRoutes(ctx));
  api.use('/witness', witness);

  api.use(requireJsonForWrites);
  api.use(smsRoutes(ctx));

  const staff = Router();
  staff.use(requireStaff(db, config));
  staff.use(incidentRoutes(ctx));
  staff.use(witnessLinkRoutes(ctx));
  staff.use(observationRoutes(ctx));
  staff.use(instructionRoutes(ctx));
  staff.use(equipmentRoutes(ctx));
  staff.use(situationReviewRoutes(ctx));
  staff.use(handoverRoutes(ctx));
  staff.use(timelineRoutes(ctx));
  api.use(staff);

  app.use('/api', api);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'not-found', message: 'Nie ma takiego zasobu.' }));

  // Produkcyjnie jeden serwer podaje też zbudowany frontend (jedno źródło, HTTPS przed nim).
  if (existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST, { index: false }));
    app.get('*', (_req, res) => res.sendFile(WEB_DIST + 'index.html'));
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.code, message: err.message });
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'bad-request', message: err.issues[0]?.message ?? 'Nieprawidłowe dane.' });
    }
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'bad-request', message: 'Nieprawidłowy JSON.' });
    console.error(err);
    res.status(500).json({ error: 'internal', message: 'Błąd serwera.' });
  });
  return app;
}
