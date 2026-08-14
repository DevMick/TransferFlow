import { zValidator } from '@hono/zod-validator';
import { createPaymentSchema } from '@transferflow/shared';
import { Hono } from 'hono';
import { type AuthEnv, requireAuth } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { payment } from '../db/schema.js';
import { sendPaymentNotificationEmail } from '../services/email.service.js';
import { desc, eq } from 'drizzle-orm';

export const paymentsRouter = new Hono<AuthEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const user = c.get('user');
    const rows = await db
      .select()
      .from(payment)
      .where(eq(payment.userId, user.id))
      .orderBy(desc(payment.createdAt));

    return c.json({ payments: rows });
  })
  .post('/', zValidator('json', createPaymentSchema), async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');

    const [row] = await db
      .insert(payment)
      .values({
        userId: user.id,
        recipient: input.recipient,
        payerName: input.payerName,
        beneficiaryName: input.beneficiaryName,
        amount: input.amount.toFixed(2),
        iban: input.iban,
        companyName: input.companyName,
        subject: input.subject,
        senderName: input.senderName,
        language: input.language,
      })
      .returning();

    // Envoyer l'email de notification
    if (row && input.recipient) {
      try {
        await sendPaymentNotificationEmail({
          recipientEmail: input.recipient,
          payerName: input.payerName,
          beneficiaryName: input.beneficiaryName,
          amount: input.amount.toString(),
          iban: input.iban,
          subject: input.subject,
          senderName: input.senderName,
          language: input.language,
        });
      } catch (err) {
        console.error('Erreur lors de l\'envoi de l\'email de paiement:', err);
      }
    }

    return c.json({ payment: row });
  });
