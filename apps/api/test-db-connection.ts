import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing Railway database connection...\n');

    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Check if tables exist
    console.log('\n📋 Checking tables:');

    try {
      const adminCount = await prisma.adminUser.count();
      console.log(`✅ AdminUser table exists: ${adminCount} users`);

      const users = await prisma.adminUser.findMany({
        select: { id: true, email: true, name: true }
      });
      console.log('   Users in database:', users);
    } catch (err) {
      console.log('❌ AdminUser table issue:', err);
    }

    try {
      const sessionCount = await prisma.session.count();
      console.log(`✅ Session table exists: ${sessionCount} sessions`);
    } catch (err) {
      console.log('❌ Session table missing or error:', (err as any).message);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
