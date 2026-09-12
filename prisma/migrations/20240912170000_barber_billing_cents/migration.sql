-- AlterTable
ALTER TABLE "BarberProfile" ADD COLUMN "billingCents" INTEGER;

-- AlterTable
ALTER TABLE "BarberProfile" ALTER COLUMN "approved" SET DEFAULT true;
