/* eslint-disable no-undef */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getGalleryToken() {
  try {
    const gallery = await prisma.gallery.findFirst();
    if (gallery) {
      console.log('Gallery Token:', gallery.token);
      console.log('Gallery Name:', gallery.name);
      console.log('Has Password:', !!gallery.password);
      console.log('');
      console.log('Access URL: http://localhost:3000/gallery/' + gallery.token);
    } else {
      console.log('No galleries found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getGalleryToken();