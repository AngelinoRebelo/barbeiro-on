-- AlterTable
ALTER TABLE "BarberProfile" ADD COLUMN "brandAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ShopBrand" (
    "barberId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopBrand_pkey" PRIMARY KEY ("barberId")
);

-- AddForeignKey
ALTER TABLE "ShopBrand" ADD CONSTRAINT "ShopBrand_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "BarberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
