-- CreateTable
CREATE TABLE "magic_links" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "uaHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "magic_links_tokenHash_key" ON "magic_links"("tokenHash");

-- CreateIndex
CREATE INDEX "magic_links_email_idx" ON "magic_links"("email");

-- CreateIndex
CREATE INDEX "magic_links_tokenHash_idx" ON "magic_links"("tokenHash");

-- CreateIndex
CREATE INDEX "magic_links_expiresAt_idx" ON "magic_links"("expiresAt");
