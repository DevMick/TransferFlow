import { z } from 'zod';

/**
 * Domain schemas for money transfers. Shared between the API (validation +
 * Drizzle) and the web app (form validation + typed responses).
 */

export const transferStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export type TransferStatus = z.infer<typeof transferStatusSchema>;

export const currencySchema = z
  .string()
  .length(3, 'A currency is a 3-letter ISO 4217 code')
  .transform((v) => v.toUpperCase());

/** Payload accepted when creating a new transfer. */
export const createTransferSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required').max(120),
  recipientIban: z
    .string()
    .min(15, 'IBAN looks too short')
    .max(34, 'IBAN looks too long')
    .regex(/^[A-Z]{2}[0-9A-Z]+$/i, 'Invalid IBAN format'),
  amount: z.coerce
    .number()
    .positive('Amount must be greater than zero')
    .max(1_000_000, 'Amount exceeds the allowed limit'),
  currency: currencySchema.default('EUR'),
  reference: z.string().max(140).optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

/** A transfer as returned by the API. */
export const transferSchema = createTransferSchema.extend({
  id: z.string().uuid(),
  status: transferStatusSchema,
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Transfer = z.infer<typeof transferSchema>;

export const listTransfersQuerySchema = z.object({
  status: transferStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListTransfersQuery = z.infer<typeof listTransfersQuerySchema>;
