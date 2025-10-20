-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT,
    "createdBy" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_assets" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "galleries_token_key" ON "galleries"("token");

-- CreateIndex
CREATE INDEX "galleries_token_idx" ON "galleries"("token");

-- CreateIndex
CREATE INDEX "galleries_clientId_idx" ON "galleries"("clientId");

-- CreateIndex
CREATE INDEX "galleries_expiresAt_idx" ON "galleries"("expiresAt");

-- CreateIndex
CREATE INDEX "gallery_assets_galleryId_idx" ON "gallery_assets"("galleryId");

-- CreateIndex
CREATE INDEX "gallery_assets_assetId_idx" ON "gallery_assets"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_assets_galleryId_assetId_key" ON "gallery_assets"("galleryId", "assetId");

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_assets" ADD CONSTRAINT "gallery_assets_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_assets" ADD CONSTRAINT "gallery_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
