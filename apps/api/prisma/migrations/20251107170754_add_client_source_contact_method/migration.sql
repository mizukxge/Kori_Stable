-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('WEDDING', 'PORTRAIT', 'COMMERCIAL', 'EVENT', 'FAMILY', 'PRODUCT', 'REAL_ESTATE', 'HEADSHOT', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CONVERTED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CARD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'APPLE_PAY';
ALTER TYPE "PaymentMethod" ADD VALUE 'GOOGLE_PAY';

-- AlterTable
ALTER TABLE "bank_transactions" ALTER COLUMN "currency" SET DEFAULT 'GBP';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "preferredContactMethod" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "paymentType" "PaymentType",
ALTER COLUMN "currency" SET DEFAULT 'GBP';

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'GBP';

-- AlterTable
ALTER TABLE "proposals" ALTER COLUMN "currency" SET DEFAULT 'GBP';

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" VARCHAR(255),
    "inquiryType" "InquiryType" NOT NULL,
    "shootDate" TIMESTAMP(3),
    "shootDescription" TEXT NOT NULL,
    "location" VARCHAR(255),
    "specialRequirements" TEXT,
    "budgetMin" DECIMAL(10,2),
    "budgetMax" DECIMAL(10,2),
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachmentCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactedAt" TIMESTAMP(3),
    "qualifiedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiries_email_idx" ON "inquiries"("email");

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- CreateIndex
CREATE INDEX "inquiries_createdAt_idx" ON "inquiries"("createdAt");

-- CreateIndex
CREATE INDEX "inquiries_clientId_idx" ON "inquiries"("clientId");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
