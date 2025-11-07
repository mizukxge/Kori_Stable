-- Enhanced Contracts & Document Management System
-- This migration extends the existing contract models with full e-signing, clause library, and automation features

-- ============================================
-- CLAUSE LIBRARY & CONDITIONAL LOGIC
-- ============================================

CREATE TABLE "clauses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "body_html" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "mandatory" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "clauses_slug_idx" ON "clauses"("slug");
CREATE INDEX "clauses_mandatory_idx" ON "clauses"("mandatory");
CREATE INDEX "clauses_tags_idx" ON "clauses" USING GIN("tags");

-- Conditional logic rules for clauses (JSONLogic expressions)
CREATE TABLE "clause_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clause_id" TEXT NOT NULL,
  "expression" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clause_rules_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "clauses"("id") ON DELETE CASCADE
);

CREATE INDEX "clause_rules_clause_id_idx" ON "clause_rules"("clause_id");

-- ============================================
-- ENHANCED CONTRACT TEMPLATES
-- ============================================

-- Drop existing contract_templates constraints to allow updates
ALTER TABLE "contract_templates" DROP CONSTRAINT IF EXISTS "contract_templates_createdBy_fkey";

-- Add new fields to existing contract_templates table
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "event_type" TEXT;
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "body_html" TEXT;
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "variables_schema" JSONB;
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "mandatory_clause_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "contract_templates" ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT false;

-- Update content column to allow null (since we now use body_html)
ALTER TABLE "contract_templates" ALTER COLUMN "content" DROP NOT NULL;

-- Re-add foreign key
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "admin_users"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "contract_templates_type_idx" ON "contract_templates"("type");
CREATE INDEX IF NOT EXISTS "contract_templates_event_type_idx" ON "contract_templates"("event_type");
CREATE INDEX IF NOT EXISTS "contract_templates_is_published_idx" ON "contract_templates"("is_published");

-- ============================================
-- ENHANCED CONTRACTS
-- ============================================

-- Contract numbering and lifecycle
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "base_number" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "reissue_index" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "sign_by_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "effective_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Europe/London';

-- E-signing and portal
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "otp_email" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "otp_code" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "otp_expires_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "portal_password_hash" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "magic_link_token" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "magic_link_expires_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "failed_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signer_session_id" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signer_session_expires_at" TIMESTAMP(3);

-- Document storage and verification
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "ocr_text_path" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "pdf_path_encrypted" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "snapshot_json_encrypted" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "sha256" TEXT;

-- Additional metadata
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "viewed_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "countersigned_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "voided_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "voided_reason" TEXT;

-- Update status enum to include new statuses
-- Note: In PostgreSQL, we need to handle enum updates carefully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ContractStatus' AND e.enumlabel = 'VIEWED'
  ) THEN
    ALTER TYPE "ContractStatus" ADD VALUE 'VIEWED';
    ALTER TYPE "ContractStatus" ADD VALUE 'COUNTERSIGNED';
    ALTER TYPE "ContractStatus" ADD VALUE 'ACTIVE';
    ALTER TYPE "ContractStatus" ADD VALUE 'TERMINATED';
    ALTER TYPE "ContractStatus" ADD VALUE 'VOIDED';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "contracts_base_number_idx" ON "contracts"("base_number");
CREATE INDEX IF NOT EXISTS "contracts_sign_by_at_idx" ON "contracts"("sign_by_at");
CREATE INDEX IF NOT EXISTS "contracts_magic_link_token_idx" ON "contracts"("magic_link_token");
CREATE INDEX IF NOT EXISTS "contracts_sha256_idx" ON "contracts"("sha256");

-- ============================================
-- CONTRACT EVENTS (AUDIT TRAIL)
-- ============================================

CREATE TYPE "ContractEventType" AS ENUM (
  'CREATED',
  'SENT',
  'VIEWED',
  'SIGNED',
  'COUNTERSIGNED',
  'EXPIRED',
  'VOIDED',
  'LINK_LOCKED',
  'REMINDER_SENT',
  'PDF_VIEWED',
  'PASSWORD_FAILED',
  'OTP_SENT',
  'OTP_VERIFIED',
  'SESSION_STARTED',
  'SESSION_EXPIRED',
  'REISSUED',
  'REACTIVATED'
);

CREATE TABLE "contract_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contract_id" TEXT NOT NULL,
  "type" "ContractEventType" NOT NULL,
  "ip" TEXT,
  "user_agent" TEXT,
  "meta" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contract_events_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE
);

CREATE INDEX "contract_events_contract_id_idx" ON "contract_events"("contract_id");
CREATE INDEX "contract_events_type_idx" ON "contract_events"("type");
CREATE INDEX "contract_events_created_at_idx" ON "contract_events"("created_at");

-- ============================================
-- REMINDER & AUTOMATION RULES
-- ============================================

CREATE TABLE "contract_reminder_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "offsets_days" INTEGER[] NOT NULL,
  "business_hours_only" BOOLEAN NOT NULL DEFAULT true,
  "cooldown_hours" INTEGER NOT NULL DEFAULT 24,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "pricing_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "event_type" TEXT,
  "template_id" TEXT,
  "deposit_percent" DECIMAL(5,2) NOT NULL DEFAULT 50,
  "final_due_offset_days" INTEGER NOT NULL DEFAULT 30,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "pricing_rules_event_type_idx" ON "pricing_rules"("event_type");
CREATE INDEX "pricing_rules_template_id_idx" ON "pricing_rules"("template_id");

-- ============================================
-- INVOICE LINKAGE
-- ============================================

-- Add contract linkage to invoices
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "invoices_contract_id_idx" ON "invoices"("contract_id");

-- Track invoice creation failures
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "needs_invoice_retry" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "invoice_failure_reason" TEXT;
