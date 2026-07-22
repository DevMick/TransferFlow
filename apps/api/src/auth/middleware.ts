import { createMiddleware } from 'hono/factory';
import { auth } from './index.js';

type SessionUser = (typeof auth)['$Infer']['Session']['user'];
type SessionData = (typeof auth)['$Infer']['Session']['session'];

export type AuthEnv = {
  Variables: {
    user: SessionUser;
    session: SessionData;
  };
};

/** Rejects the request with 401 unless a valid Better-Auth session is present. */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  c.set('session', session.session);
  await next();
});
