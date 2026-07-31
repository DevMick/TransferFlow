CREATE TABLE "establishment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logo_path" text,
	"nom_etablissement" text NOT NULL,
	"forme_juridique" text,
	"adresse_rue" text,
	"code_postal" text,
	"ville" text,
	"pays" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
