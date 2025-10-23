import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestGallery() {
  try {
    // Create a test user first (if doesn't exist)
    let user = await prisma.adminUser.findFirst();
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      user = await prisma.adminUser.create({
        data: {
          email: 'admin@test.com',
          password: hashedPassword,
          name: 'Test Admin',
          role: 'SUPER_ADMIN',
        },
      });
      console.log('✅ Created test admin user (email: admin@test.com, password: password123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Check if gallery already exists
    let gallery = await prisma.gallery.findFirst({
      where: { token: 'test-123-token' }
    });

    if (!gallery) {
      gallery = await prisma.gallery.create({
        data: {
          name: 'Test Gallery',
          description: 'A test gallery for uploads',
          token: 'test-123-token',
          isActive: true,
          createdBy: user.id,
        },
      });
      console.log('✅ Created gallery:', gallery.id);
    } else {
      console.log('ℹ️  Gallery already exists:', gallery.id);
    }

    console.log('');
    console.log('🎉 Setup complete!');
    console.log('   Gallery ID: ' + gallery.id);
    console.log('   Gallery URL: http://localhost:3000/admin/galleries/' + gallery.id);
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestGallery();
