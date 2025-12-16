/* eslint-disable no-undef */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkAssets() {
  try {
    const galleryId = 'cmgzguym20003tk1wopy2fi11';
    
    // Get all assets
    const assets = await prisma.asset.findMany();
    
    console.log('Found ' + assets.length + ' assets to link');

    // Link each asset to the gallery
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      try {
        await prisma.galleryAsset.create({
          data: {
            galleryId: galleryId,
            assetId: asset.id,
            position: i,
          },
        });
        console.log('✅ Linked: ' + asset.filename);
      } catch {
        console.log('⚠️  Already linked or error: ' + asset.filename);
      }
    }

    console.log('\n✅ Done! Refresh the gallery page');
    console.log('URL: http://localhost:3000/gallery/3b89366dea6b13f49450b5a5de334695');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkAssets();