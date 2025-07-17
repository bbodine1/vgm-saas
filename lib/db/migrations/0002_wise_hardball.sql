CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"first_contact_date" timestamp NOT NULL,
	"decision_maker_name" varchar(255) NOT NULL,
	"decision_maker_phone" varchar(50),
	"medium" varchar(100),
	"completed" integer DEFAULT 0 NOT NULL,
	"team_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;