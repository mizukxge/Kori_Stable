import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function debugAdminUser() {
  const email = 'michael@shotbymizu.co.uk';
  const plainPassword = 'Password123';

  try {
    // Find the user
    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User ${email} not found`);
      return;
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Password hash: ${user.password.substring(0, 50)}...`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Updated: ${user.updatedAt}`);

    // Test password verification
    console.log(`\n🔐 Testing password verification...`);
    const isValid = await argon2.verify(user.password, plainPassword);
    console.log(`   Password "${plainPassword}" is valid: ${isValid}`);

    // Generate a fresh hash and show it
    console.log(`\n🔄 Generating fresh password hash...`);
    const freshHash = await argon2.hash(plainPassword);
    console.log(`   Fresh hash: ${freshHash.substring(0, 50)}...`);

    // Verify the fresh hash
    const freshIsValid = await argon2.verify(freshHash, plainPassword);
    console.log(`   Fresh hash verifies password: ${freshIsValid}`);

    // If current hash doesn't verify, suggest update
    if (!isValid) {
      console.log(`\n⚠️  Current password hash doesn't verify!`);
      console.log(`   This is why login is failing.`);
      console.log(`   Running reset-admin-password.ts should fix this.`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminUser();
