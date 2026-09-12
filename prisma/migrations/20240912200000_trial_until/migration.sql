-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "trialDays" SET DEFAULT 15;
UPDATE "PlatformSettings" SET "trialDays" = 15 WHERE "id" = 'platform';

-- AlterTable
ALTER TABLE "BarberProfile" ADD COLUMN "trialUntil" TIMESTAMP(3);

-- Contas ainda sem pagamento de plano e com acesso vigente entram no teste.
UPDATE "BarberProfile" AS bp
SET "trialUntil" = bp."accessUntil"
WHERE bp."trialUntil" IS NULL
  AND bp."accessUntil" IS NOT NULL
  AND bp."accessUntil" > NOW()
  AND NOT EXISTS (
    SELECT 1
    FROM "Payment" AS p
    WHERE p."barberId" = bp."id"
      AND p."kind" = 'SUBSCRIPTION'
      AND p."status" = 'PAID'
  );
