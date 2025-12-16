/* eslint-disable no-undef */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPhotosToGallery() {
  try {
    // Get the Summer Portfolio gallery
    const gallery = await prisma.gallery.findFirst({
      where: { name: 'Summer Portfolio 2025' }
    });

    if (!gallery) {
      console.log('Gallery not found');
      return;
    }

    // Get all assets
    const assets = await prisma.asset.findMany({
      take: 10
    });

    console.log('Found ' + assets.length + ' assets');

    // Add each asset to the gallery
    for (const asset of assets) {
      try {
        await prisma.galleryAsset.create({
          data: {
            galleryId: gallery.id,
            assetId: asset.id,
            position: 0,
          },
        });
      } catch {
        // Ignore if already exists
      }
    }

    console.log('✅ Added photos to gallery');
    console.log('Gallery URL: http://localhost:3000/gallery/' + gallery.token);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPhotosToGallery();
