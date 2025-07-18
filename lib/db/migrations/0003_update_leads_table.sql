-- Migration: Update leads table to new requirements

ALTER TABLE "leads"
	DROP COLUMN IF EXISTS "business_name",
	DROP COLUMN IF EXISTS "first_contact_date",
	DROP COLUMN IF EXISTS "decision_maker_name",
	DROP COLUMN IF EXISTS "decision_maker_phone",
	DROP COLUMN IF EXISTS "medium",
	DROP COLUMN IF EXISTS "completed";

ALTER TABLE "leads"
	ADD COLUMN IF NOT EXISTS "lead_source" varchar(100),
	ADD COLUMN IF NOT EXISTS "date_received" timestamp NOT NULL DEFAULT now(),
	ADD COLUMN IF NOT EXISTS "contact_name" varchar(255) NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS "email_address" varchar(255),
	ADD COLUMN IF NOT EXISTS "phone_number" varchar(50),
	ADD COLUMN IF NOT EXISTS "service_interest" varchar(100),
	ADD COLUMN IF NOT EXISTS "lead_status" varchar(50) NOT NULL DEFAULT 'New',
	ADD COLUMN IF NOT EXISTS "potential_value" integer,
	ADD COLUMN IF NOT EXISTS "follow_up_date" timestamp,
	ADD COLUMN IF NOT EXISTS "notes" text; 