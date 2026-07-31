import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db/index.js';
import { bank, currency } from '../db/schema.js';

/**
 * Reference data routes (banks, currencies)
 */
const referenceRouter = new Hono()
  .get('/banks', async (c) => {
    const banks = await db.select().from(bank).orderBy(bank.name);
    return c.json({ banks });
  })
  .get('/currencies', async (c) => {
    const currencies = await db
      .select()
      .from(currency)
      .where(eq(currency.isActive, true))
      .orderBy(currency.code);
    return c.json({ currencies });
  });

export { referenceRouter };
