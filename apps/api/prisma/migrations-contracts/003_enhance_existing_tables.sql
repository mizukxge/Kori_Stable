-- Migration: Enhance Contract and ContractTemplate Tables
-- Created: 2025-11-03

-- Add new columns to contract_templates
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "documentType" "DocumentType" DEFAULT 'SERVICE_AGREEMENT';
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "headerHtml" TEXT;
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "footerHtml" TEXT;
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "clauseIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT false;
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- Generate slugs for existing templates (if any)
UPDATE "contract_templates" SET "slug" = LOWER(REPLACE("name", ' ', '-')) WHERE "slug" IS NULL;

-- Make slug unique
ALTER TABLE "contract_templates" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "contract_templates_slug_key" ON "contract_templates"("slug");
CREATE INDEX IF NOT EXISTS "contract_templates_documentType_idx" ON "contract_templates"("documentType");
CREATE INDEX IF NOT EXISTS "contract_templates_isPublished_idx" ON "contract_templates"("isPublished");

-- Add new columns to contracts
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "documentType" "DocumentType";
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "eventType" "EventType";
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3);

-- E-signing columns
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "magicLinkToken" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "magicLinkExpiresAt" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "passwordFailCount" INTEGER DEFAULT 0;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "otpCode" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "otpExpiresAt" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "otpVerifiedAt" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signerEmail" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signerName" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signerIp" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "countersignedBy" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "countersignedAt" TIMESTAMP(3);

-- PDF and snapshot columns
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "pdfHash" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "snapshotJson" JSONB;

-- Date columns
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "effectiveDate" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signByDate" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "voidedAt" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "voidReason" TEXT;

-- Add indexes
CREATE UNIQUE INDEX IF NOT EXISTS "contracts_magicLinkToken_key" ON "contracts"("magicLinkToken");
CREATE INDEX IF NOT EXISTS "contracts_status_idx" ON "contracts"("status");
CREATE INDEX IF NOT EXISTS "contracts_signerEmail_idx" ON "contracts"("signerEmail");
CREATE INDEX IF NOT EXISTS "contracts_signByDate_idx" ON "contracts"("signByDate");
