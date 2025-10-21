-- CreateEnum
CREATE TYPE "SelectionType" AS ENUM ('HEART', 'FLAG', 'REJECT');

-- CreateTable
CREATE TABLE "proof_sets" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientEmail" TEXT,
    "clientName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "totalViewed" INTEGER NOT NULL DEFAULT 0,
    "totalSelected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proof_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selections" (
    "id" TEXT NOT NULL,
    "proofSetId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "SelectionType" NOT NULL DEFAULT 'HEART',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "proofSetId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "parentId" TEXT,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "query" TEXT,
    "entityType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proof_sets_galleryId_idx" ON "proof_sets"("galleryId");

-- CreateIndex
CREATE INDEX "proof_sets_clientEmail_idx" ON "proof_sets"("clientEmail");

-- CreateIndex
CREATE INDEX "selections_proofSetId_idx" ON "selections"("proofSetId");

-- CreateIndex
CREATE INDEX "selections_assetId_idx" ON "selections"("assetId");

-- CreateIndex
CREATE INDEX "selections_type_idx" ON "selections"("type");

-- CreateIndex
CREATE UNIQUE INDEX "selections_proofSetId_assetId_key" ON "selections"("proofSetId", "assetId");

-- CreateIndex
CREATE INDEX "comments_proofSetId_idx" ON "comments"("proofSetId");

-- CreateIndex
CREATE INDEX "comments_assetId_idx" ON "comments"("assetId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "saved_filters_userId_idx" ON "saved_filters"("userId");

-- CreateIndex
CREATE INDEX "saved_filters_entityType_idx" ON "saved_filters"("entityType");

-- AddForeignKey
ALTER TABLE "proof_sets" ADD CONSTRAINT "proof_sets_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selections" ADD CONSTRAINT "selections_proofSetId_fkey" FOREIGN KEY ("proofSetId") REFERENCES "proof_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selections" ADD CONSTRAINT "selections_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_proofSetId_fkey" FOREIGN KEY ("proofSetId") REFERENCES "proof_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
