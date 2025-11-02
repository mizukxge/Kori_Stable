import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@mizu.studio';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user with only the required fields
    const user = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin User',
      },
    });

    console.log('✅ Admin user created:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${user.id}`);
    console.log('\nYou can now login at: http://localhost:3000/admin/login');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists with this email');
      console.log('   You can use: admin@mizu.studio / admin123');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();