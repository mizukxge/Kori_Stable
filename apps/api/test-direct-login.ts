/**
 * Direct test of login endpoint
 * Simulates what the web app sends
 */
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function testLoginDirectly() {
  const email = 'michael@shotbymizu.co.uk';
  const password = '#Admin:123';

  try {
    console.log('Testing login workflow...\n');

    // 1. Find user
    console.log(`1️⃣  Finding user: ${email}`);
    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('   ❌ User not found');
      process.exit(1);
    }
    console.log(`   ✅ User found: ${user.name} (ID: ${user.id})`);

    // 2. Verify password
    console.log(`\n2️⃣  Verifying password`);
    const isValid = await argon2.verify(user.password, password);
    console.log(`   ${isValid ? '✅ Password valid' : '❌ Password invalid'}`);

    if (!isValid) {
      process.exit(1);
    }

    // 3. Create session
    console.log(`\n3️⃣  Creating session`);
    const { randomBytes } = await import('crypto');
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });
    console.log(`   ✅ Session created: ${session.id}`);

    // 4. Return what API would return
    console.log(`\n4️⃣  API Response:`);
    const response = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'SUPER_ADMIN',
      },
    };
    console.log('   ' + JSON.stringify(response, null, 2));

    console.log('\n✅ Login workflow completed successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginDirectly();
