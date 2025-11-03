-- Migration: Create Clause Library and Related Tables
-- Created: 2025-11-03

-- Clauses table
CREATE TABLE "clauses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "type" "ClauseType" NOT NULL DEFAULT 'OPTIONAL',
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isMandatory" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);

CREATE INDEX "clauses_slug_idx" ON "clauses"("slug");
CREATE INDEX "clauses_type_idx" ON "clauses"("type");
CREATE INDEX "clauses_isMandatory_idx" ON "clauses"("isMandatory");

-- Clause Rules table
CREATE TABLE "clause_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clauseId" TEXT NOT NULL,
  "condition" JSONB NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clause_rules_clauseId_fkey" FOREIGN KEY ("clauseId") 
    REFERENCES "clauses"("id") ON DELETE CASCADE
);

CREATE INDEX "clause_rules_clauseId_idx" ON "clause_rules"("clauseId");

-- Pricing Rules table
CREATE TABLE "pricing_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "templateId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "depositPercent" INTEGER NOT NULL DEFAULT 50,
  "balanceDueDays" INTEGER NOT NULL DEFAULT 30,
  "schedule" JSONB NOT NULL,
  "createInvoice" "InvoiceSchedule" NOT NULL DEFAULT 'ON_SIGNING',
  "invoiceDaysDelay" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pricing_rules_templateId_fkey" FOREIGN KEY ("templateId") 
    REFERENCES "contract_templates"("id") ON DELETE CASCADE
);

CREATE INDEX "pricing_rules_templateId_idx" ON "pricing_rules"("templateId");

-- Contract Events table
CREATE TABLE "contract_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "eventType" "ContractEventType" NOT NULL,
  "description" TEXT,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "actorIp" TEXT,
  "actorAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contract_events_contractId_fkey" FOREIGN KEY ("contractId") 
    REFERENCES "contracts"("id") ON DELETE CASCADE
);

CREATE INDEX "contract_events_contractId_idx" ON "contract_events"("contractId");
CREATE INDEX "contract_events_eventType_idx" ON "contract_events"("eventType");
CREATE INDEX "contract_events_createdAt_idx" ON "contract_events"("createdAt");

-- Contract Reminder Rules table
CREATE TABLE "contract_reminder_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "frequency" "ReminderFrequency" NOT NULL DEFAULT 'EVERY_3_DAYS',
  "daysBefore" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "sendAfter" TEXT NOT NULL DEFAULT '09:00',
  "sendBefore" TEXT NOT NULL DEFAULT '17:00',
  "lastSentAt" TIMESTAMP(3),
  "reminderCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contract_reminder_rules_contractId_fkey" FOREIGN KEY ("contractId") 
    REFERENCES "contracts"("id") ON DELETE CASCADE
);

CREATE INDEX "contract_reminder_rules_contractId_idx" ON "contract_reminder_rules"("contractId");

-- Invoice Queue table
CREATE TABLE "invoice_queue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "error" TEXT,
  "invoiceData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "invoice_queue_contractId_fkey" FOREIGN KEY ("contractId") 
    REFERENCES "contracts"("id") ON DELETE CASCADE
);

CREATE INDEX "invoice_queue_status_idx" ON "invoice_queue"("status");
CREATE INDEX "invoice_queue_createdAt_idx" ON "invoice_queue"("createdAt");
