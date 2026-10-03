import type { RequestActor } from './auth/roles.js';

declare global {
  namespace Express {
    interface Request {
      actor?: RequestActor;
    }
  }
}

export {};
