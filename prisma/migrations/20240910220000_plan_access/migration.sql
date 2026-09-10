-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "durationDays" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN "trialDays" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "BarberProfile" ADD COLUMN "accessUntil" TIMESTAMP(3);

UPDATE "BarberProfile" SET "accessUntil" = NOW() + INTERVAL '30 days' WHERE "accessUntil" IS NULL;
UPDATE "Plan" SET "durationDays" = 365 WHERE "interval" = 'YEARLY' AND "durationDays" = 30;
