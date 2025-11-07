-- Add PDF generation fields to Contract table
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "pdfHash" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "pdfGeneratedAt" TIMESTAMP(3);

-- Add comments for clarity
COMMENT ON COLUMN "contracts"."pdfPath" IS 'PDF file path';
COMMENT ON COLUMN "contracts"."pdfHash" IS 'SHA-256 hash for integrity verification';
COMMENT ON COLUMN "contracts"."pdfGeneratedAt" IS 'PDF generation timestamp';
