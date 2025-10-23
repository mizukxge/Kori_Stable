import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugGallery() {
  try {
    // Get Summer Portfolio gallery
    const gallery = await prisma.gallery.findFirst({
      where: { name: 'Summer Portfolio 2025' },
      include: {
        assets: {
          include: {
            asset: true
          }
        }
      }
    });

    console.log('Gallery:', gallery?.name);
    console.log('Gallery ID:', gallery?.id);
    console.log('Token:', gallery?.token);
    console.log('Assets in gallery:', gallery?.assets.length);
    
    if (gallery?.assets.length) {
      console.log('\nFirst asset:');
      console.log('  ID:', gallery.assets[0].asset.id);
      console.log('  Filename:', gallery.assets[0].asset.filename);
      console.log('  Path:', gallery.assets[0].asset.filepath);
    }

    // Also check total assets
    const totalAssets = await prisma.asset.count();
    console.log('\nTotal assets in database:', totalAssets);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGallery();