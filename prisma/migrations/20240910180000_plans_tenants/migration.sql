-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('SERVICE', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "PlanInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "shopId" TEXT;

-- AlterTable
ALTER TABLE "BarberProfile" ADD COLUMN "planId" TEXT;
ALTER TABLE "BarberProfile" ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "BarberProfile" SET "subscriptionStatus" = 'ACTIVE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "kind" "PaymentKind" NOT NULL DEFAULT 'SERVICE';

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priceCents" INTEGER NOT NULL,
    "interval" "PlanInterval" NOT NULL DEFAULT 'MONTHLY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL DEFAULT '{"agenda":true,"clients":true,"services":true,"pix":true,"mercadopago":true,"publicShop":true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "pixKey" TEXT NOT NULL DEFAULT '',
    "pixKeyType" "PixKeyType" NOT NULL DEFAULT 'RANDOM',
    "mpPublicKey" TEXT NOT NULL DEFAULT '',
    "mpAccessEnc" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");
CREATE INDEX "User_shopId_idx" ON "User"("shopId");

ALTER TABLE "User" ADD CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "BarberProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BarberProfile" ADD CONSTRAINT "BarberProfile_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
