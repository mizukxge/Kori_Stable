-- CreateEnum
CREATE TYPE "RecordCategory" AS ENUM ('DOCUMENT', 'CONTRACT', 'INVOICE', 'TAX', 'PHOTO', 'VIDEO', 'CORRESPONDENCE', 'LEGAL', 'COMPLIANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'ERROR');

-- CreateTable
CREATE TABLE "records" (
    "id" TEXT NOT NULL,
    "recordNumber" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalPath" TEXT NOT NULL,
    "archivePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "hash" TEXT NOT NULL,
    "hashAlgorithm" TEXT NOT NULL DEFAULT 'SHA256',
    "description" TEXT,
    "category" "RecordCategory" NOT NULL DEFAULT 'DOCUMENT',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retentionPolicyId" TEXT,
    "retainUntil" TIMESTAMP(3),
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldReason" TEXT,
    "legalHoldBy" TEXT,
    "legalHoldAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" TEXT,
    "archivedBy" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disposedAt" TIMESTAMP(3),
    "disposedBy" TEXT,
    "disposalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "retentionYears" INTEGER NOT NULL DEFAULT 7,
    "retentionMonths" INTEGER NOT NULL DEFAULT 0,
    "retentionDays" INTEGER NOT NULL DEFAULT 0,
    "regulatoryBasis" TEXT,
    "category" "RecordCategory",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_hashes" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "computedHash" TEXT NOT NULL,
    "expectedHash" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy" TEXT,
    "fileExists" BOOLEAN NOT NULL,
    "fileSize" BIGINT,
    "error" TEXT,

    CONSTRAINT "record_hashes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "records_recordNumber_key" ON "records"("recordNumber");

-- CreateIndex
CREATE UNIQUE INDEX "records_archivePath_key" ON "records"("archivePath");

-- CreateIndex
CREATE UNIQUE INDEX "records_hash_key" ON "records"("hash");

-- CreateIndex
CREATE INDEX "records_recordNumber_idx" ON "records"("recordNumber");

-- CreateIndex
CREATE INDEX "records_hash_idx" ON "records"("hash");

-- CreateIndex
CREATE INDEX "records_category_idx" ON "records"("category");

-- CreateIndex
CREATE INDEX "records_retainUntil_idx" ON "records"("retainUntil");

-- CreateIndex
CREATE INDEX "records_legalHold_idx" ON "records"("legalHold");

-- CreateIndex
CREATE INDEX "records_verificationStatus_idx" ON "records"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policies_name_key" ON "retention_policies"("name");

-- CreateIndex
CREATE INDEX "retention_policies_name_idx" ON "retention_policies"("name");

-- CreateIndex
CREATE INDEX "retention_policies_isActive_idx" ON "retention_policies"("isActive");

-- CreateIndex
CREATE INDEX "record_hashes_recordId_idx" ON "record_hashes"("recordId");

-- CreateIndex
CREATE INDEX "record_hashes_verifiedAt_idx" ON "record_hashes"("verifiedAt");

-- CreateIndex
CREATE INDEX "record_hashes_matched_idx" ON "record_hashes"("matched");

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_retentionPolicyId_fkey" FOREIGN KEY ("retentionPolicyId") REFERENCES "retention_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_legalHoldBy_fkey" FOREIGN KEY ("legalHoldBy") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_archivedBy_fkey" FOREIGN KEY ("archivedBy") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_disposedBy_fkey" FOREIGN KEY ("disposedBy") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_hashes" ADD CONSTRAINT "record_hashes_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_hashes" ADD CONSTRAINT "record_hashes_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
