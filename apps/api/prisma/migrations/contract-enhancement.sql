-- ========================================
-- ENHANCE EXISTING CONTRACT MODEL
-- ========================================
-- This migration adds new fields to existing Contract table

-- Add new columns to Contract table
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "documentType" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "eventType" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP;

-- E-signing fields
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "magicLinkToken" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "magicLinkExpiresAt" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "passwordFailCount" INTEGER DEFAULT 0;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "otpCode" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "otpExpiresAt" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "otpVerifiedAt" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signerEmail" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signerName" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signerIp" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "countersignedBy" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "countersignedAt" TIMESTAMP;

-- PDF & snapshot fields
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "pdfPath" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "pdfHash" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "snapshotJson" JSONB;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "variableValues" JSONB;

-- Dates
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "effectiveDate" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signByDate" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "voidedAt" TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "voidReason" TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS "Contract_templateId_idx" ON "Contract"("templateId");
CREATE INDEX IF NOT EXISTS "Contract_magicLinkToken_idx" ON "Contract"("magicLinkToken");
CREATE INDEX IF NOT EXISTS "Contract_signerEmail_idx" ON "Contract"("signerEmail");
CREATE INDEX IF NOT EXISTS "Contract_status_idx" ON "Contract"("status");

-- Add foreign key to ContractTemplate (after template table is created)
-- ALTER TABLE "Contract" ADD CONSTRAINT "Contract_templateId_fkey" 
--   FOREIGN KEY ("templateId") REFERENCES "contract_templates"("id") ON DELETE SET NULL;

