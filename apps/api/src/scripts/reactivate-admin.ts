import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking admin user...');

  const admin = await prisma.adminUser.findUnique({
    where: { email: 'admin@kori.dev' },
  });

  if (!admin) {
    console.log('❌ Admin user not found!');
    process.exit(1);
  }

  console.log(`Found admin: ${admin.email} (${admin.name})`);
  console.log(`Current status: Active (no isActive field anymore)`);
  
  console.log('✅ Admin user is ready to use!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@kori.dev');
  console.log('  Password: SuperAdmin123!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });