ALTER TABLE "transfer" ALTER COLUMN "beneficiary_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "beneficiary_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "iban" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "bank_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "currency" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "transfer" ALTER COLUMN "status" SET DEFAULT 'EN COURS DE TRAITEMENT';--> statement-breakpoint
ALTER TABLE "transfer" ADD COLUMN "sender_bank" text;--> statement-breakpoint
ALTER TABLE "transfer" ADD COLUMN "transaction_reference" text;--> statement-breakpoint
ALTER TABLE "transfer" ADD COLUMN "execution_date" timestamp;--> statement-breakpoint
ALTER TABLE "transfer" ADD COLUMN "sender_account_name" text;--> statement-breakpoint
ALTER TABLE "transfer" ADD COLUMN "sender_account_number" text;--> statement-breakpoint
ALTER TABLE "transfer" ADD COLUMN "bic_swift" text;