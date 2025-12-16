import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = 'michael@shotbymizu.co.uk';
  const password = 'Password123';
  const name = 'Michael';

  try {
    // Check if user already exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`✅ User ${email} already exists`);
      return;
    }

    // Hash the password
    const hashedPassword = await argon2.hash(password);

    // Create the admin user
    const user = await prisma.adminUser.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`\n🎯 You can now log in with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
