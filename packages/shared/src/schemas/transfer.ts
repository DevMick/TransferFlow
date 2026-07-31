import { z } from 'zod';

/**
 * Domain schemas for money transfers. Shared between the API (validation +
 * Drizzle) and the web app (form validation + typed responses).
 */

export const transferStatusSchema = z.enum(['initiated', 'rejected']);

export type TransferStatus = z.infer<typeof transferStatusSchema>;

export const currencySchema = z
  .string()
  .length(3, 'Une devise est un code ISO 4217 à 3 lettres')
  .transform((v) => v.toUpperCase());

/** Payload accepted when creating a new transfer. */
export const createTransferSchema = z.object({
  // Détails de la transaction
  senderBank: z.string().optional(),
  transactionReference: z.string().optional(),
  executionDate: z.string().datetime().optional(),
  status: z.string().default('Initié'),

  // Informations du donneur d'ordre
  senderAccountName: z.string().optional(),
  senderAccountNumber: z.string().optional(),

  // Bénéficiaire
  beneficiaryName: z.string().optional(),
  beneficiaryEmail: z.string().optional(),
  iban: z.string().optional(),
  bicSwift: z.string().optional(),

  // Montant
  amount: z.coerce.number().optional(),
  currency: z.string().default('EUR'),

  // Langue de l'email de notification
  language: z.enum(['fr', 'nl']).default('fr'),
});

/** Payload accepted when rejecting a transfer. */
export const rejectTransferSchema = z.object({
  rejectionFee: z.coerce.number().optional(),
  rejectionFeeCurrency: z.string().default('EUR'),
  rejectionReason: z.string().min(1, 'Le motif du rejet est requis'),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

/** A transfer as returned by the API. */
export const transferSchema = createTransferSchema.extend({
  id: z.string().uuid(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  rejectedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
  rejectionFee: z.coerce.number().nullable(),
  rejectionFeeCurrency: z.string().nullable(),
  // Anciens champs pour compatibilité
  bankName: z.string().optional(),
  reference: z.string().optional(),
});

export type Transfer = z.infer<typeof transferSchema>;

export const listTransfersQuerySchema = z.object({
  search: z.string().optional(),
  status: transferStatusSchema.optional(),
  period: z.enum(['all', '7d', '30d', '90d', '1y']).default('all'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  bank: z.string().optional(),
  currency: z.array(currencySchema).optional(),
  amountMin: z.coerce.number().positive().optional(),
  amountMax: z.coerce.number().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListTransfersQuery = z.infer<typeof listTransfersQuerySchema>;
