import crypto from 'node:crypto';
import sgMail from '@sendgrid/mail';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth/index.js';
import { db, schema } from './db/index.js';
import { env } from './env.js';
import { errorHandler } from './middleware/error.js';
import { rateLimit } from './middleware/rate-limit.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { establishmentsRouter } from './routes/establishments.js';
import { paymentsRouter } from './routes/payments.js';
import { referenceRouter } from './routes/reference.js';
import { transfersRouter } from './routes/transfers.js';
import { sendPaymentNotificationEmail } from './services/email.service.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const allowedOrigins = [env.BETTER_AUTH_URL, 'http://localhost:5173', 'http://localhost:5174'];

/**
 * The Hono application. The `routes` const below is intentionally the result of
 * a single method chain — its inferred type (`AppType`) is what powers the
 * end-to-end type-safe RPC client on the web app.
 */
const app = new Hono()
  .use('*', logger())
  .use('*', errorHandler)
  .use(
    '*',
    cors({
      origin: allowedOrigins,
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  .use('*', rateLimit({ limit: 100, windowMs: 15 * 60 * 1000 }))
  .get('/health', (c) =>
    c.json({
      status: 'ok',
      service: 'transferflow-api',
      timestamp: new Date().toISOString(),
    }),
  )
  // Also exposed under /api/health since Nginx only proxies the /api/* prefix to this service
  .get('/api/health', (c) =>
    c.json({
      status: 'ok',
      service: 'transferflow-api',
      timestamp: new Date().toISOString(),
    }),
  )
  // Test email endpoint
  .get('/api/test-email', async (c) => {
    try {
      await sgMail.send({
        from: {
          email: 'support@equipe-securisevinted-pro.com',
          name: 'TransferFlow Test',
        },
        to: 'mickael.andjui.21@gmail.com',
        subject: 'Test Email - Simple Message',
        text: 'Hello! This is a simple test email from TransferFlow. If you see this in your inbox, the email delivery is working correctly.',
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'TransferFlow v1.0',
          'X-MSMail-Priority': 'Normal',
          Importance: 'normal',
          Precedence: 'bulk',
          'Auto-Submitted': 'auto-generated',
          'List-Unsubscribe': '<mailto:support@equipe-securisevinted-pro.com?subject=unsubscribe>',
          'X-Originating-IP': '[216.198.79.1]',
        },
        replyTo: 'support@equipe-securisevinted-pro.com',
      });
      return c.json({
        success: true,
        message: 'Email sent successfully with ARC & DMARC p=none config',
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      return c.json({ success: false, error: String(error) }, 500);
    }
  })
  // Test payment email via Hostinger SMTP
  .get('/api/test-payment-email', async (c) => {
    try {
      await sendPaymentNotificationEmail({
        recipientEmail: 'Levisjonas77@gmail.com',
        payerName: 'Mickael Andjui',
        beneficiaryName: 'Sarah Johnson',
        amount: '150.50',
        iban: 'BE69539007547034',
        subject: 'Betalingsbericht in afwachting',
        senderName: 'Vinted Pro',
        language: 'nl',
      });

      return c.json({
        success: true,
        message: 'Payment email sent successfully via Hostinger SMTP',
      });
    } catch (error) {
      console.error('Error sending test payment email:', error);
      return c.json({ success: false, error: String(error) }, 500);
    }
  })
  // Delete user endpoint
  .delete('/api/admin/delete-user', async (c) => {
    try {
      const body = await c.req.json();
      const { email } = body;

      if (!email) {
        return c.json({ success: false, error: 'Email is required' }, 400);
      }

      // Delete user and related records
      const user = await db.query.user.findFirst({
        where: (table, { eq }) => eq(table.email, email),
      });

      if (!user) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      // Import eq from drizzle-orm
      const { eq } = await import('drizzle-orm');

      // Delete related accounts
      await db.delete(schema.account).where(eq(schema.account.userId, user.id));

      // Delete related sessions
      await db.delete(schema.session).where(eq(schema.session.userId, user.id));

      // Delete user
      await db.delete(schema.user).where(eq(schema.user.id, user.id));

      return c.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return c.json({ success: false, error: String(error) }, 500);
    }
  })
  // Create user endpoint via Better-Auth
  .post('/api/admin/create-user', async (c) => {
    try {
      const body = await c.req.json();
      const { email, password, name } = body;

      if (!email || !password || !name) {
        return c.json({ success: false, error: 'Email, password, and name are required' }, 400);
      }

      // Use Better-Auth to create user
      const result = await auth.api.signUpEmail({
        email,
        password,
        name,
      });

      if (result.error) {
        return c.json(
          { success: false, error: result.error.message || 'Failed to create user' },
          400,
        );
      }

      return c.json({ success: true, message: 'User created successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      return c.json({ success: false, error: String(error) }, 500);
    }
  })
  // Better-Auth mounts all of its own endpoints under /api/auth/*
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

const routes = app
  .route('/api/users', authRouter)
  .route('/api/transfers', transfersRouter)
  .route('/api/payments', paymentsRouter)
  .route('/api/dashboard', dashboardRouter)
  .route('/api/reference', referenceRouter)
  .route('/api/establishments', establishmentsRouter);

export type AppType = typeof routes;
export { routes };
export default app;
