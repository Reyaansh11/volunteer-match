-- Add per-record display metadata while preserving existing stored kilometer values.
ALTER TABLE "StudentProfile"
  ADD COLUMN IF NOT EXISTS "distanceUnit" TEXT NOT NULL DEFAULT 'km',
  ADD COLUMN IF NOT EXISTS "timeZone" TEXT NOT NULL DEFAULT 'America/Phoenix';

ALTER TABLE "Opportunity"
  ADD COLUMN IF NOT EXISTS "timeZone" TEXT NOT NULL DEFAULT 'America/Phoenix',
  ADD COLUMN IF NOT EXISTS "radiusUnit" TEXT NOT NULL DEFAULT 'km';
