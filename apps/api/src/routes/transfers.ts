import { zValidator } from '@hono/zod-validator';
import { createTransferSchema, listTransfersQuerySchema } from '@transferflow/shared';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { type AuthEnv, requireAuth } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { transfer } from '../db/schema.js';

/**
 * Transfers API. Every route requires an authenticated session and is scoped to
 * the current user. Exported as a standalone router so its types flow into the
 * Hono RPC client on the web side.
 */
export const transfersRouter = new Hono<AuthEnv>()
  .use('*', requireAuth)
  .get('/', zValidator('query', listTransfersQuerySchema), async (c) => {
    const user = c.get('user');
    const { status, limit, offset } = c.req.valid('query');

    const rows = await db
      .select()
      .from(transfer)
      .where(
        status
          ? and(eq(transfer.userId, user.id), eq(transfer.status, status))
          : eq(transfer.userId, user.id),
      )
      .orderBy(desc(transfer.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({ transfers: rows });
  })
  .post('/', zValidator('json', createTransferSchema), async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');

    const [row] = await db
      .insert(transfer)
      .values({
        userId: user.id,
        recipientName: input.recipientName,
        recipientIban: input.recipientIban,
        amount: input.amount.toFixed(2),
        currency: input.currency,
        reference: input.reference,
      })
      .returning();

    return c.json({ transfer: row }, 201);
  })
  .get('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const [row] = await db
      .select()
      .from(transfer)
      .where(and(eq(transfer.id, id), eq(transfer.userId, user.id)))
      .limit(1);

    if (!row) {
      return c.json({ error: 'Transfer not found' }, 404);
    }

    return c.json({ transfer: row });
  });
