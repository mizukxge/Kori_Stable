/*
  Warnings:

  - A unique constraint covering the columns `[magicLinkToken]` on the table `contracts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SERVICE_AGREEMENT', 'BOOKING_CONTRACT', 'LICENSE_AGREEMENT', 'MODEL_RELEASE_ADULT', 'NDA', 'SUBCONTRACTOR_AGREEMENT', 'PRIVACY_CONSENT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WEDDING', 'BRAND_EDITORIAL', 'EVENT', 'PORTRAIT', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "ContractEventType" AS ENUM ('CREATED', 'SENT', 'VIEWED', 'SIGNED', 'COUNTERSIGNED', 'EXPIRED', 'VOIDED', 'LINK_LOCKED', 'REMINDER_SENT', 'PDF_VIEWED', 'PASSWORD_FAILED', 'OTP_SENT', 'OTP_VERIFIED', 'SESSION_STARTED', 'SESSION_EXPIRED', 'REISSUED', 'REACTIVATED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContractStatus" ADD VALUE 'VIEWED';
ALTER TYPE "ContractStatus" ADD VALUE 'COUNTERSIGNED';
ALTER TYPE "ContractStatus" ADD VALUE 'ACTIVE';
ALTER TYPE "ContractStatus" ADD VALUE 'TERMINATED';
ALTER TYPE "ContractStatus" ADD VALUE 'VOIDED';

-- AlterTable
ALTER TABLE "contract_templates" ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "eventType" "EventType",
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mandatoryClauseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" "DocumentType",
ADD COLUMN     "variablesSchema" JSONB,
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "baseNumber" TEXT,
ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "countersignedAt" TIMESTAMP(3),
ADD COLUMN     "effectiveAt" TIMESTAMP(3),
ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "invoiceFailureReason" TEXT,
ADD COLUMN     "magicLinkExpiresAt" TIMESTAMP(3),
ADD COLUMN     "magicLinkToken" TEXT,
ADD COLUMN     "needsInvoiceRetry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ocrTextPath" TEXT,
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpEmail" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "pdfPathEncrypted" TEXT,
ADD COLUMN     "portalPasswordHash" TEXT,
ADD COLUMN     "reissueIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sha256" TEXT,
ADD COLUMN     "signByAt" TIMESTAMP(3),
ADD COLUMN     "signerSessionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "signerSessionId" TEXT,
ADD COLUMN     "snapshotJsonEncrypted" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
ADD COLUMN     "viewedAt" TIMESTAMP(3),
ADD COLUMN     "voidedAt" TIMESTAMP(3),
ADD COLUMN     "voidedReason" TEXT,
ALTER COLUMN "templateId" DROP NOT NULL,
ALTER COLUMN "templateVersion" DROP NOT NULL,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "variables" DROP NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "contractId" TEXT;

-- CreateTable
CREATE TABLE "clauses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clause_rules" (
    "id" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "expression" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clause_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_events" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" "ContractEventType" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_reminder_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "offsetsDays" INTEGER[],
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT true,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_reminder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "eventType" "EventType",
    "templateId" TEXT,
    "depositPercent" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "finalDueOffsetDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clauses_slug_key" ON "clauses"("slug");

-- CreateIndex
CREATE INDEX "clauses_slug_idx" ON "clauses"("slug");

-- CreateIndex
CREATE INDEX "clauses_mandatory_idx" ON "clauses"("mandatory");

-- CreateIndex
CREATE INDEX "clause_rules_clauseId_idx" ON "clause_rules"("clauseId");

-- CreateIndex
CREATE INDEX "contract_events_contractId_idx" ON "contract_events"("contractId");

-- CreateIndex
CREATE INDEX "contract_events_type_idx" ON "contract_events"("type");

-- CreateIndex
CREATE INDEX "contract_events_createdAt_idx" ON "contract_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_key_key" ON "pricing_rules"("key");

-- CreateIndex
CREATE INDEX "pricing_rules_eventType_idx" ON "pricing_rules"("eventType");

-- CreateIndex
CREATE INDEX "pricing_rules_templateId_idx" ON "pricing_rules"("templateId");

-- CreateIndex
CREATE INDEX "contract_templates_type_idx" ON "contract_templates"("type");

-- CreateIndex
CREATE INDEX "contract_templates_eventType_idx" ON "contract_templates"("eventType");

-- CreateIndex
CREATE INDEX "contract_templates_isPublished_idx" ON "contract_templates"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_magicLinkToken_key" ON "contracts"("magicLinkToken");

-- CreateIndex
CREATE INDEX "contracts_baseNumber_idx" ON "contracts"("baseNumber");

-- CreateIndex
CREATE INDEX "contracts_signByAt_idx" ON "contracts"("signByAt");

-- CreateIndex
CREATE INDEX "contracts_magicLinkToken_idx" ON "contracts"("magicLinkToken");

-- CreateIndex
CREATE INDEX "contracts_sha256_idx" ON "contracts"("sha256");

-- CreateIndex
CREATE INDEX "invoices_contractId_idx" ON "invoices"("contractId");

-- AddForeignKey
ALTER TABLE "clause_rules" ADD CONSTRAINT "clause_rules_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "contract_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
