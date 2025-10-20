-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('RAW', 'EDIT', 'VIDEO');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "checksum" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DOUBLE PRECISION,
    "metadata" JSONB,
    "clientId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_storedName_key" ON "assets"("storedName");

-- CreateIndex
CREATE UNIQUE INDEX "assets_checksum_key" ON "assets"("checksum");

-- CreateIndex
CREATE INDEX "assets_clientId_idx" ON "assets"("clientId");

-- CreateIndex
CREATE INDEX "assets_uploadedBy_idx" ON "assets"("uploadedBy");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "assets_checksum_idx" ON "assets"("checksum");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
