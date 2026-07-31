import { boolean, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Better-Auth tables
// These mirror the schema Better-Auth expects for the Drizzle adapter. You can
// regenerate them from your auth config with: pnpm --filter @transferflow/api
// auth:generate
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// Domain tables
// ---------------------------------------------------------------------------

export const transferStatus = pgEnum('transfer_status', [
  'initiated',
  'rejected',
]);

export const transfer = pgTable('transfer', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  
  // Détails de la transaction
  senderBank: text('sender_bank'),
  transactionReference: text('transaction_reference'),
  executionDate: timestamp('execution_date'),
  status: text('status').notNull().default('Initié'),
  
  // Informations du donneur d'ordre
  senderAccountName: text('sender_account_name'),
  senderAccountNumber: text('sender_account_number'),
  
  // Bénéficiaire
  beneficiaryName: text('beneficiary_name'),
  beneficiaryEmail: text('beneficiary_email'),
  iban: text('iban'),
  bicSwift: text('bic_swift'),
  
  // Montant
  amount: numeric('amount', { precision: 19, scale: 4 }),
  currency: text('currency').default('EUR'),

  // Langue des documents (email + PDF)
  language: text('language').default('fr'),
  
  // Rejet
  rejectionFee: numeric('rejection_fee', { precision: 19, scale: 4 }),
  rejectionFeeCurrency: text('rejection_fee_currency'),
  rejectionReason: text('rejection_reason'),
  
  // Anciens champs (maintenus pour compatibilité)
  bankName: text('bank_name'),
  reference: text('reference'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  rejectedAt: timestamp('rejected_at'),
});

export const bank = pgTable('bank', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  country: text('country').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const currency = pgTable('currency', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const establishment = pgTable('establishment', {
  id: uuid('id').primaryKey().defaultRandom(),
  logoPath: text('logo_path'),
  nomEtablissement: text('nom_etablissement').notNull(),
  formeJuridique: text('forme_juridique'),
  adresseRue: text('adresse_rue'),
  codePostal: text('code_postal'),
  ville: text('ville'),
  pays: text('pays'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TransferRow = typeof transfer.$inferSelect;
export type NewTransferRow = typeof transfer.$inferInsert;
export type BankRow = typeof bank.$inferSelect;
export type NewBankRow = typeof bank.$inferInsert;
export type CurrencyRow = typeof currency.$inferSelect;
export type NewCurrencyRow = typeof currency.$inferInsert;
export type EstablishmentRow = typeof establishment.$inferSelect;
export type NewEstablishmentRow = typeof establishment.$inferInsert;
