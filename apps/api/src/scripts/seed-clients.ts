import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding clients...');

  const clients = [
    {
      name: 'Sarah & Michael Thompson',
      email: 'sarah.thompson@email.com',
      phone: '+1 (555) 123-4567',
      company: 'Thompson Enterprises',
      status: 'ACTIVE',
      address: '123 Oak Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'US',
      notes: 'Wedding photography client - June 2025',
      tags: ['wedding', 'vip', '2025'],
    },
    {
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@startup.io',
      phone: '+1 (555) 234-5678',
      company: 'Rodriguez Tech Startup',
      status: 'ACTIVE',
      address: '456 Innovation Way',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'US',
      notes: 'Corporate headshots and team photos',
      tags: ['corporate', 'headshots', 'repeat-client'],
    },
    {
      name: 'David & Lisa Chen',
      email: 'chen.family@gmail.com',
      phone: '+1 (555) 345-6789',
      status: 'PENDING',
      address: '789 Maple Drive',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'US',
      notes: 'Proposal sent for family portrait session',
      tags: ['family', 'portraits', 'proposal-sent'],
    },
    {
      name: 'Jessica Martinez',
      email: 'jessica.m@fashionhouse.com',
      phone: '+1 (555) 456-7890',
      company: 'Fashion House Studio',
      status: 'ACTIVE',
      address: '321 Fashion Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      notes: 'Fashion and product photography',
      tags: ['commercial', 'fashion', 'high-value'],
    },
    {
      name: 'Robert & Amanda Wilson',
      email: 'wilsonfamily@email.com',
      phone: '+1 (555) 567-8901',
      status: 'INACTIVE',
      address: '654 Pine Court',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201',
      country: 'US',
      notes: 'Completed: Maternity shoot 2024',
      tags: ['maternity', 'completed', '2024'],
    },
    {
      name: 'Marcus Johnson',
      email: 'marcus.j@realestate.com',
      phone: '+1 (555) 678-9012',
      company: 'Johnson Realty Group',
      status: 'ACTIVE',
      address: '987 Business Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'US',
      notes: 'Real estate property photography - monthly contract',
      tags: ['commercial', 'real-estate', 'recurring'],
    },
    {
      name: 'Olivia & James Taylor',
      email: 'taylors@email.com',
      phone: '+1 (555) 789-0123',
      status: 'ACTIVE',
      address: '147 Lake View Road',
      city: 'Denver',
      state: 'CO',
      zipCode: '80201',
      country: 'US',
      notes: 'Engagement photos completed, wedding booked for Fall 2025',
      tags: ['wedding', 'engagement', '2025'],
    },
    {
      name: 'Sophia Anderson',
      email: 'sophia.anderson@brand.co',
      phone: '+1 (555) 890-1234',
      company: 'Anderson Brand Co',
      status: 'PENDING',
      address: '258 Creative Lane',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'US',
      notes: 'Awaiting contract signature for brand campaign',
      tags: ['commercial', 'brand', 'contract-pending'],
    },
  ];

  for (const clientData of clients) {
    try {
      const client = await prisma.client.create({
        data: clientData,
      });
      console.log(`✅ Created client: ${client.name} (${client.email})`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        console.log(`⚠️  Client already exists: ${clientData.email}`);
      } else {
        console.error(`❌ Error creating client ${clientData.email}:`, error);
      }
    }
  }

  console.log('✅ Client seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
