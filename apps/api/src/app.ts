import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth/index.js';
import { env } from './env.js';
import { transfersRouter } from './routes/transfers.js';

const allowedOrigins = [env.BETTER_AUTH_URL, 'http://localhost:5173'];

/**
 * The Hono application. The `routes` const below is intentionally the result of
 * a single method chain — its inferred type (`AppType`) is what powers the
 * end-to-end type-safe RPC client on the web app.
 */
const app = new Hono()
  .use('*', logger())
  .use(
    '/api/*',
    cors({
      origin: allowedOrigins,
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  .get('/health', (c) =>
    c.json({
      status: 'ok',
      service: 'transferflow-api',
      timestamp: new Date().toISOString(),
    }),
  )
  // Better-Auth mounts all of its own endpoints under /api/auth/*
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

const routes = app.route('/api/transfers', transfersRouter);

export type AppType = typeof routes;
export { routes };
export default app;
