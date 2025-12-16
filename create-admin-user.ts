import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');

    const email = 'michael@shotbymizu.co.uk';
    const password = '#Admin:123';
    const name = 'Michael Admin';

    // Hash the password using argon2
    const hashedPassword = await argon2.hash(password);

    // Create or update the admin user
    const adminUser = await prisma.adminUser.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: {
        email,
        password: hashedPassword,
        name,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Login Details:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log('');
    console.log('🔗 Login at: https://kori-web-production.up.railway.app');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
