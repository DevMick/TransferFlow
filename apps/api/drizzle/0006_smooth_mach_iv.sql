CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"recipient" text NOT NULL,
	"payer_name" text NOT NULL,
	"beneficiary_name" text NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"iban" text NOT NULL,
	"company_name" text NOT NULL,
	"subject" text DEFAULT 'Notification de paiement en attente',
	"sender_name" text DEFAULT 'Vinted Pro',
	"language" text DEFAULT 'fr',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;