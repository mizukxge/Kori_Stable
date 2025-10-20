import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@kori.dev' },
    update: {},
    create: {
      email: 'admin@kori.dev',
      password: superAdminPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Created Super Admin:', superAdmin.email);

  // Create Regular Admin
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'manager@kori.dev' },
    update: {},
    create: {
      email: 'manager@kori.dev',
      password: adminPassword,
      name: 'Admin Manager',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // Create Regular User
  const userPassword = await bcrypt.hash('User123!', 10);
  const user = await prisma.adminUser.upsert({
    where: { email: 'user@kori.dev' },
    update: {},
    create: {
      email: 'user@kori.dev',
      password: userPassword,
      name: 'Regular User',
      role: 'USER',
      isActive: true,
    },
  });
  console.log('✅ Created User:', user.email);

  // Create Sample Clients
  const client1 = await prisma.client.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0100',
      company: 'Acme Corporation',
      status: 'ACTIVE',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'US',
      tags: ['premium', 'enterprise'],
      notes: 'VIP client - priority support',
    },
  });
  console.log('✅ Created Client:', client1.name);

  const client2 = await prisma.client.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0200',
      company: 'Tech Innovations Inc',
      status: 'ACTIVE',
      address: '456 Market Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      tags: ['startup'],
      notes: 'Early adopter customer',
    },
  });
  console.log('✅ Created Client:', client2.name);

  const client3 = await prisma.client.upsert({
    where: { email: 'bob.wilson@example.com' },
    update: {},
    create: {
      name: 'Bob Wilson',
      email: 'bob.wilson@example.com',
      phone: '+1-555-0300',
      status: 'PENDING',
      address: '789 Oak Avenue',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'US',
      tags: ['new'],
      notes: 'Onboarding in progress',
    },
  });
  console.log('✅ Created Client:', client3.name);

  // Create Audit Log entries
  await prisma.auditLog.create({
    data: {
      action: 'SEED',
      entityType: 'Database',
      userId: superAdmin.id,
      metadata: {
        message: 'Initial database seed completed',
        timestamp: new Date().toISOString(),
      },
    },
  });
  console.log('✅ Created Audit Log entry');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });