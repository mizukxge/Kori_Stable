-- CreateEnum
CREATE TYPE "ReleaseType" AS ENUM ('MODEL', 'PROPERTY');

-- CreateTable
CREATE TABLE "rights_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creator" TEXT NOT NULL,
    "copyrightNotice" TEXT NOT NULL,
    "usageRights" TEXT NOT NULL,
    "creditLine" TEXT,
    "instructions" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rights_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" TEXT NOT NULL,
    "type" "ReleaseType" NOT NULL,
    "releaseName" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "documentPath" TEXT,
    "notes" TEXT,
    "clientId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rights_presets_name_key" ON "rights_presets"("name");

-- CreateIndex
CREATE INDEX "releases_clientId_idx" ON "releases"("clientId");

-- CreateIndex
CREATE INDEX "releases_type_idx" ON "releases"("type");

-- AddForeignKey
ALTER TABLE "rights_presets" ADD CONSTRAINT "rights_presets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
