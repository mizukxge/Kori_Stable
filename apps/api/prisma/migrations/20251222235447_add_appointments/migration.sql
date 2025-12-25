-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('individual', 'business', 'organization');

-- CreateEnum
CREATE TYPE "EnvelopeStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SigningWorkflow" AS ENUM ('SEQUENTIAL', 'PARALLEL');

-- CreateEnum
CREATE TYPE "SignerStatus" AS ENUM ('PENDING', 'VIEWED', 'SIGNED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('PENDING', 'VIEWED', 'SIGNED', 'DECLINED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ENVELOPE_CREATED', 'ENVELOPE_SENT', 'ENVELOPE_VIEWED', 'ENVELOPE_SIGNED', 'ENVELOPE_DECLINED', 'ENVELOPE_COMPLETED', 'ENVELOPE_CANCELLED', 'ENVELOPE_EXPIRED', 'DOCUMENT_ADDED', 'DOCUMENT_REMOVED', 'SIGNER_ADDED', 'SIGNER_REMOVED', 'SIGNER_VIEWED', 'SIGNER_SIGNED', 'SIGNER_DECLINED', 'SIGNATURE_VERIFIED', 'TAMPER_DETECTED');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('ENVELOPE_CREATED', 'ENVELOPE_SENT', 'ENVELOPE_VIEWED', 'ENVELOPE_SIGNED', 'ENVELOPE_DECLINED', 'ENVELOPE_COMPLETED', 'ENVELOPE_CANCELLED', 'ENVELOPE_EXPIRED', 'SIGNER_VIEWED', 'SIGNER_SIGNED', 'SIGNER_DECLINED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('Introduction', 'CreativeDirection', 'ContractInvoicing');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Draft', 'InviteSent', 'Booked', 'Completed', 'Cancelled', 'NoShow', 'Expired');

-- CreateEnum
CREATE TYPE "AppointmentOutcome" AS ENUM ('Positive', 'Neutral', 'Negative');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "clientType" "ClientType";

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "emailTemplateId" TEXT;

-- CreateTable
CREATE TABLE "proposal_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "title" TEXT,
    "defaultTerms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envelopes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "EnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
    "signingWorkflow" "SigningWorkflow" NOT NULL DEFAULT 'SEQUENTIAL',
    "expiresAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signers" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "sequenceNumber" INTEGER,
    "status" "SignerStatus" NOT NULL DEFAULT 'PENDING',
    "magicLinkToken" TEXT NOT NULL,
    "magicLinkExpiresAt" TIMESTAMP(3) NOT NULL,
    "signerSessionId" TEXT,
    "signerSessionExpiresAt" TIMESTAMP(3),
    "otpEmail" TEXT,
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "viewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "signerIP" TEXT,
    "signerUserAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "status" "SignatureStatus" NOT NULL DEFAULT 'PENDING',
    "signatureDataUrl" TEXT,
    "initialsDataUrl" TEXT,
    "signatureHash" TEXT,
    "pageNumber" INTEGER,
    "xCoordinate" DOUBLE PRECISION,
    "yCoordinate" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "signerIP" TEXT,
    "signerUserAgent" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envelope_audit_logs" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "signerId" TEXT,
    "action" "AuditAction" NOT NULL,
    "metadata" JSONB,
    "actorId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "envelope_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envelope_webhooks" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" "WebhookEvent"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelaySeconds" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "envelope_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "type" "AppointmentType" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 60,
    "clientId" TEXT NOT NULL,
    "proposalId" TEXT,
    "contractId" TEXT,
    "invoiceId" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'Draft',
    "outcome" "AppointmentOutcome",
    "teamsLink" TEXT,
    "recordingUrl" TEXT,
    "recordingConsentGiven" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "clientNotes" TEXT,
    "callSummary" TEXT,
    "noShowReason" TEXT,
    "inviteToken" TEXT,
    "inviteTokenExpiresAt" TIMESTAMP(3),
    "inviteTokenUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientReminder24Sent" BOOLEAN NOT NULL DEFAULT false,
    "clientReminder15Sent" BOOLEAN NOT NULL DEFAULT false,
    "adminReminder24Sent" BOOLEAN NOT NULL DEFAULT false,
    "adminReminder30Sent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_audit_logs" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "appointment_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_blocked_times" (
    "id" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_blocked_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_settings" (
    "id" TEXT NOT NULL,
    "workdayStart" INTEGER NOT NULL DEFAULT 11,
    "workdayEnd" INTEGER NOT NULL DEFAULT 16,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "bookingWindowDays" INTEGER NOT NULL DEFAULT 14,
    "activeTypes" TEXT[] DEFAULT ARRAY['Introduction', 'CreativeDirection', 'ContractInvoicing']::TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposal_templates_createdBy_idx" ON "proposal_templates"("createdBy");

-- CreateIndex
CREATE INDEX "proposal_templates_isActive_idx" ON "proposal_templates"("isActive");

-- CreateIndex
CREATE INDEX "proposal_template_items_templateId_idx" ON "proposal_template_items"("templateId");

-- CreateIndex
CREATE INDEX "proposal_email_templates_createdBy_idx" ON "proposal_email_templates"("createdBy");

-- CreateIndex
CREATE INDEX "proposal_email_templates_isActive_idx" ON "proposal_email_templates"("isActive");

-- CreateIndex
CREATE INDEX "proposal_email_templates_isDefault_idx" ON "proposal_email_templates"("isDefault");

-- CreateIndex
CREATE INDEX "envelopes_createdById_idx" ON "envelopes"("createdById");

-- CreateIndex
CREATE INDEX "envelopes_status_idx" ON "envelopes"("status");

-- CreateIndex
CREATE INDEX "envelopes_expiresAt_idx" ON "envelopes"("expiresAt");

-- CreateIndex
CREATE INDEX "envelopes_createdAt_idx" ON "envelopes"("createdAt");

-- CreateIndex
CREATE INDEX "documents_envelopeId_idx" ON "documents"("envelopeId");

-- CreateIndex
CREATE INDEX "documents_fileHash_idx" ON "documents"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "signers_magicLinkToken_key" ON "signers"("magicLinkToken");

-- CreateIndex
CREATE INDEX "signers_envelopeId_idx" ON "signers"("envelopeId");

-- CreateIndex
CREATE INDEX "signers_status_idx" ON "signers"("status");

-- CreateIndex
CREATE INDEX "signers_email_idx" ON "signers"("email");

-- CreateIndex
CREATE INDEX "signers_magicLinkToken_idx" ON "signers"("magicLinkToken");

-- CreateIndex
CREATE INDEX "signers_envelopeId_sequenceNumber_idx" ON "signers"("envelopeId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "signers_envelopeId_email_key" ON "signers"("envelopeId", "email");

-- CreateIndex
CREATE INDEX "signatures_envelopeId_idx" ON "signatures"("envelopeId");

-- CreateIndex
CREATE INDEX "signatures_signerId_idx" ON "signatures"("signerId");

-- CreateIndex
CREATE INDEX "signatures_status_idx" ON "signatures"("status");

-- CreateIndex
CREATE INDEX "signatures_signedAt_idx" ON "signatures"("signedAt");

-- CreateIndex
CREATE INDEX "envelope_audit_logs_envelopeId_idx" ON "envelope_audit_logs"("envelopeId");

-- CreateIndex
CREATE INDEX "envelope_audit_logs_action_idx" ON "envelope_audit_logs"("action");

-- CreateIndex
CREATE INDEX "envelope_audit_logs_timestamp_idx" ON "envelope_audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "envelope_webhooks_createdById_idx" ON "envelope_webhooks"("createdById");

-- CreateIndex
CREATE INDEX "envelope_webhooks_active_idx" ON "envelope_webhooks"("active");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_inviteToken_key" ON "appointments"("inviteToken");

-- CreateIndex
CREATE INDEX "appointments_clientId_idx" ON "appointments"("clientId");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_inviteToken_idx" ON "appointments"("inviteToken");

-- CreateIndex
CREATE INDEX "appointments_inviteTokenExpiresAt_idx" ON "appointments"("inviteTokenExpiresAt");

-- CreateIndex
CREATE INDEX "appointment_audit_logs_appointmentId_idx" ON "appointment_audit_logs"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_audit_logs_timestamp_idx" ON "appointment_audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "appointment_blocked_times_startAt_idx" ON "appointment_blocked_times"("startAt");

-- CreateIndex
CREATE INDEX "appointment_blocked_times_endAt_idx" ON "appointment_blocked_times"("endAt");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "proposal_email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_templates" ADD CONSTRAINT "proposal_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_template_items" ADD CONSTRAINT "proposal_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "proposal_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_email_templates" ADD CONSTRAINT "proposal_email_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signers" ADD CONSTRAINT "signers_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "signers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envelope_audit_logs" ADD CONSTRAINT "envelope_audit_logs_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envelope_webhooks" ADD CONSTRAINT "envelope_webhooks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_audit_logs" ADD CONSTRAINT "appointment_audit_logs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
