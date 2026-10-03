// POST /auth/login, POST /auth/logout, GET /auth/me, GET /auth/accounts
import { Router } from 'express';
import type { MeResponse } from '@do-przyjazdu/shared';
import { z } from 'zod';
import { createSessionCookie, findStaff, listStaff, requireStaff, SESSION_COOKIE, verifyPassword } from '../auth/dispatcher.js';
import { aiAvailable } from '../config.js';
import { unauthorized } from '../lib/errors.js';
import { h, type Ctx } from './context.js';

export function authRoutes(ctx: Ctx): Router {
  const r = Router();
  const secure = ctx.config.NODE_ENV === 'production';

  // Lista kont demo do wyboru na ekranie logowania (bez haseł).
  r.get('/auth/accounts', h((_req, res) => res.json(listStaff(ctx.db))));

  r.post(
    '/auth/login',
    h((req, res) => {
      const { userId, password } = z.object({ userId: z.string().min(1), password: z.string().min(1) }).parse(req.body);
      const user = findStaff(ctx.db, userId);
      if (!user || !verifyPassword(password, user.passwordHash)) throw unauthorized('Nieprawidłowe konto lub hasło.');
      const cookie = createSessionCookie(user.id, ctx.config.SESSION_SECRET);
      res.cookie(SESSION_COOKIE, cookie.value, { httpOnly: true, sameSite: 'lax', secure, maxAge: cookie.maxAgeMs, path: '/' });
      const body: MeResponse = {
        user: { id: user.id, displayName: user.displayName, role: user.role },
        demoMode: ctx.config.DEMO_MODE,
        aiAvailable: aiAvailable(ctx.config),
      };
      res.json(body);
    }),
  );

  r.post(
    '/auth/logout',
    h((_req, res) => {
      res.clearCookie(SESSION_COOKIE, { path: '/' });
      res.json({ ok: true });
    }),
  );

  r.get(
    '/auth/me',
    requireStaff(ctx.db, ctx.config),
    h((req, res) => {
      const a = req.actor!;
      if (a.kind !== 'staff') throw unauthorized();
      const body: MeResponse = {
        user: { id: a.userId, displayName: a.displayName, role: a.role },
        demoMode: ctx.config.DEMO_MODE,
        aiAvailable: aiAvailable(ctx.config),
      };
      res.json(body);
    }),
  );
  return r;
}
