-- Migration: Add unique constraint to lead_sources name within team
ALTER TABLE "lead_sources" ADD CONSTRAINT "lead_sources_team_id_name_unique" UNIQUE ("team_id", "name"); 