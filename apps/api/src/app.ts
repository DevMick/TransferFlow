import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth/index.js';
import { env } from './env.js';
import { errorHandler } from './middleware/error.js';
import { rateLimit } from './middleware/rate-limit.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { establishmentsRouter } from './routes/establishments.js';
import { referenceRouter } from './routes/reference.js';
import { transfersRouter } from './routes/transfers.js';

const allowedOrigins = [env.BETTER_AUTH_URL, 'http://localhost:5173', 'http://localhost:5174'];

/**
 * The Hono application. The `routes` const below is intentionally the result of
 * a single method chain — its inferred type (`AppType`) is what powers the
 * end-to-end type-safe RPC client on the web app.
 */
const app = new Hono()
  .use('*', logger())
  .use('*', errorHandler)
  .use('*', rateLimit({ limit: 100, windowMs: 15 * 60 * 1000 }))
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

const routes = app
  .route('/api/users', authRouter)
  .route('/api/transfers', transfersRouter)
  .route('/api/dashboard', dashboardRouter)
  .route('/api/reference', referenceRouter)
  .route('/api/establishments', establishmentsRouter);

export type AppType = typeof routes;
export { routes };
export default app;
