import { z } from 'zod';

export const createPaymentSchema = z.object({
  recipient: z.string().min(1, 'Destinataire requis'),
  payerName: z.string().min(1, 'Nom du payeur requis'),
  beneficiaryName: z.string().min(1, 'Bénéficiaire requis'),
  amount: z.coerce.number().positive('Montant doit être positif'),
  iban: z.string().min(1, 'IBAN requis'),
  companyName: z.string().min(1, "Nom de l'entreprise requis"),
  subject: z.string().default('Notification de paiement en attente'),
  senderName: z.string().default('Vinted Pro'),
  language: z.enum(['fr', 'nl']).default('fr'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
