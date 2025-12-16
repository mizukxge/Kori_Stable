import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function verifyAdminUser() {
  try {
    console.log('🔍 Verifying admin user...\n');

    const email = 'michael@shotbymizu.co.uk';
    const password = '#Admin:123';

    // Find user
    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found in database');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
    console.log('');

    // Test password verification
    console.log('🔑 Testing password verification...');
    const isValid = await argon2.verify(user.password, password);

    if (isValid) {
      console.log('✅ Password verification PASSED');
    } else {
      console.log('❌ Password verification FAILED');
      console.log(`   Password provided: ${password}`);
      console.log(`   Stored hash: ${user.password}`);
    }

    // Check sessions
    console.log('\n📋 Checking sessions table structure...');
    const sessionCount = await prisma.session.count();
    console.log(`   Total sessions in DB: ${sessionCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminUser();
