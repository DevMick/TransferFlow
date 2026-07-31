ALTER TABLE "transfer" ADD COLUMN "rejection_fee" numeric(19, 4);--> statement-breakpoint
ALTER TABLE "transfer" ADD COLUMN "rejection_fee_currency" text;