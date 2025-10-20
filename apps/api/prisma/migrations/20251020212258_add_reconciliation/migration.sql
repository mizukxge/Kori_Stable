-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('AUTO_EXACT', 'AUTO_FUZZY', 'MANUAL', 'SUGGESTED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'UNMATCHED');

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reference" TEXT,
    "bankAccount" TEXT,
    "accountNumber" TEXT,
    "importBatch" TEXT NOT NULL,
    "rawData" JSONB,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "paymentId" TEXT,
    "matchType" "MatchType" NOT NULL DEFAULT 'MANUAL',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "matchedBy" TEXT,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_transactions_transactionDate_idx" ON "bank_transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "bank_transactions_amount_idx" ON "bank_transactions"("amount");

-- CreateIndex
CREATE INDEX "bank_transactions_importBatch_idx" ON "bank_transactions"("importBatch");

-- CreateIndex
CREATE INDEX "bank_transactions_reconciled_idx" ON "bank_transactions"("reconciled");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_bankTransactionId_key" ON "reconciliations"("bankTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_paymentId_key" ON "reconciliations"("paymentId");

-- CreateIndex
CREATE INDEX "reconciliations_status_idx" ON "reconciliations"("status");

-- CreateIndex
CREATE INDEX "reconciliations_matchType_idx" ON "reconciliations"("matchType");

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "bank_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_matchedBy_fkey" FOREIGN KEY ("matchedBy") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
