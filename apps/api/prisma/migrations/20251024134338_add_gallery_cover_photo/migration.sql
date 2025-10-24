-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "coverPhotoId" TEXT;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
