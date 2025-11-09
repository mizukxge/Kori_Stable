import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin
  const superAdminPassword = await argon2.hash('SuperAdmin123!');
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@kori.dev' },
    update: { password: superAdminPassword },
    create: {
      email: 'admin@kori.dev',
      password: superAdminPassword,
      name: 'Super Admin',
    },
  });
  console.log('✅ Created Super Admin:', superAdmin.email);

  // Create Regular Admin
  const adminPassword = await argon2.hash('Admin123!');
  const admin = await prisma.adminUser.upsert({
    where: { email: 'manager@kori.dev' },
    update: { password: adminPassword },
    create: {
      email: 'manager@kori.dev',
      password: adminPassword,
      name: 'Admin Manager',
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // Create Regular User
  const userPassword = await argon2.hash('User123!');
  const user = await prisma.adminUser.upsert({
    where: { email: 'user@kori.dev' },
    update: { password: userPassword },
    create: {
      email: 'user@kori.dev',
      password: userPassword,
      name: 'Regular User',
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
      source: 'referral',
      preferredContactMethod: 'email',
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
      source: 'website',
      preferredContactMethod: 'both',
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
      source: 'direct',
      preferredContactMethod: 'phone',
      tags: ['new'],
      notes: 'Onboarding in progress',
    },
  });
  console.log('✅ Created Client:', client3.name);

  // Create Contract Templates
  console.log('\n📄 Creating Contract Templates...');

  const weddingTemplate = await prisma.contractTemplate.upsert({
    where: { name: 'Wedding Photography Contract' },
    update: {},
    create: {
      name: 'Wedding Photography Contract',
      description: 'Comprehensive wedding photography contract',
      type: 'SERVICE_AGREEMENT',
      eventType: 'WEDDING',
      mandatoryClauseIds: [],
      isActive: true,
      isPublished: true,
      version: 1,
      createdBy: superAdmin.id,
      variablesSchema: {
        sections: [
          {
            title: 'Event Details',
            fields: [
              { name: 'event_date', type: 'date', label: 'Wedding Date', required: true },
              { name: 'venue_name', type: 'text', label: 'Venue Name', required: true },
            ],
          },
          {
            title: 'Payment Terms',
            fields: [
              { name: 'total_amount', type: 'currency', label: 'Total Amount', required: true },
              { name: 'deposit_amount', type: 'currency', label: 'Deposit Amount', required: true },
            ],
          },
        ],
      },
    },
  });
  console.log('✅ Created Wedding Template');

  const portraitTemplate = await prisma.contractTemplate.upsert({
    where: { name: 'Portrait Session Contract' },
    update: {},
    create: {
      name: 'Portrait Session Contract',
      description: 'Standard portrait photography contract',
      type: 'SERVICE_AGREEMENT',
      eventType: 'PORTRAIT',
      mandatoryClauseIds: [],
      isActive: true,
      isPublished: true,
      version: 1,
      createdBy: superAdmin.id,
      variablesSchema: {
        sections: [
          {
            title: 'Session Details',
            fields: [
              { name: 'session_date', type: 'date', label: 'Session Date', required: true },
              { name: 'session_location', type: 'text', label: 'Location', required: true },
            ],
          },
        ],
      },
    },
  });
  console.log('✅ Created Portrait Template');

  // Create Sample Contracts with various statuses
  console.log('\n📝 Creating Sample Contracts...');

  // Helper function to generate contract numbers
  const generateContractNumber = (index: number) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `KORI-${year}${month}-${String(index).padStart(4, '0')}`;
  };

  // Helper function to get date offset
  const getDateOffset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  // Contract 1: SIGNED (Wedding - John Doe)
  const contract1 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(1) },
    update: {},
    create: {
      contractNumber: generateContractNumber(1),
      title: 'Wedding Photography - John & Sarah',
      clientId: client1.id,
      templateId: weddingTemplate.id,
      status: 'SIGNED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-06-15',
        venue_name: 'Grand Ballroom Hotel',
        total_amount: '5000',
        deposit_amount: '1500',
      },
      signByAt: getDateOffset(180),
      sentAt: getDateOffset(-30),
      viewedAt: getDateOffset(-28),
      signedAt: getDateOffset(-25),
    },
  });
  console.log('✅ Created Contract 1: SIGNED');

  // Contract 2: VIEWED (Wedding - Jane Smith)
  const contract2 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(2) },
    update: {},
    create: {
      contractNumber: generateContractNumber(2),
      title: 'Wedding Photography - Jane & Michael',
      clientId: client2.id,
      templateId: weddingTemplate.id,
      status: 'VIEWED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-07-20',
        venue_name: 'Sunset Beach Resort',
        total_amount: '4500',
        deposit_amount: '1350',
      },
      signByAt: getDateOffset(150),
      sentAt: getDateOffset(-5),
      viewedAt: getDateOffset(-3),
      magicLinkToken: `${Math.random().toString(36).substring(2, 15)}`,
      magicLinkExpiresAt: getDateOffset(150),
    },
  });
  console.log('✅ Created Contract 2: VIEWED');

  // Contract 3: SENT (Portrait - Bob Wilson)
  const contract3 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(3) },
    update: {},
    create: {
      contractNumber: generateContractNumber(3),
      title: 'Corporate Portrait Session - Wilson Inc',
      clientId: client3.id,
      templateId: portraitTemplate.id,
      status: 'SENT',
      createdBy: admin.id,
      bodyHtml: '<h1>Portrait Session Contract</h1><p>Sample contract content...</p>',
      variables: {
        session_date: '2025-05-10',
        session_location: 'Studio Downtown',
      },
      signByAt: getDateOffset(60),
      sentAt: getDateOffset(-2),
      magicLinkToken: `${Math.random().toString(36).substring(2, 15)}`,
      magicLinkExpiresAt: getDateOffset(60),
    },
  });
  console.log('✅ Created Contract 3: SENT');

  // Contract 4: DRAFT
  const contract4 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(4) },
    update: {},
    create: {
      contractNumber: generateContractNumber(4),
      title: 'Wedding Photography - Thompson Wedding',
      clientId: client1.id,
      templateId: weddingTemplate.id,
      status: 'DRAFT',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Draft contract content...</p>',
      variables: {
        event_date: '2025-08-15',
        venue_name: 'Mountain View Lodge',
        total_amount: '6000',
        deposit_amount: '2000',
      },
      signByAt: getDateOffset(120),
    },
  });
  console.log('✅ Created Contract 4: DRAFT');

  // Contract 5: SIGNED (Wedding - Different client)
  const contract5 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(5) },
    update: {},
    create: {
      contractNumber: generateContractNumber(5),
      title: 'Wedding Photography - Anderson Wedding',
      clientId: client2.id,
      templateId: weddingTemplate.id,
      status: 'SIGNED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-09-01',
        venue_name: 'Historic Garden Estate',
        total_amount: '5500',
        deposit_amount: '1650',
      },
      signByAt: getDateOffset(200),
      sentAt: getDateOffset(-45),
      viewedAt: getDateOffset(-40),
      signedAt: getDateOffset(-35),
    },
  });
  console.log('✅ Created Contract 5: SIGNED');

  // Contract 6: VOIDED (using VOIDED status instead of DECLINED)
  const contract6 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(6) },
    update: {},
    create: {
      contractNumber: generateContractNumber(6),
      title: 'Portrait Session - Martinez Family',
      clientId: client3.id,
      templateId: portraitTemplate.id,
      status: 'VOIDED',
      createdBy: admin.id,
      bodyHtml: '<h1>Portrait Session Contract</h1><p>Sample contract content...</p>',
      variables: {
        session_date: '2025-04-20',
        session_location: 'City Park',
      },
      signByAt: getDateOffset(-10),
      sentAt: getDateOffset(-20),
      viewedAt: getDateOffset(-18),
      voidedAt: getDateOffset(-15),
      voidedReason: 'Client chose different photographer',
    },
  });
  console.log('✅ Created Contract 6: VOIDED');

  // Contract 7: EXPIRED
  const contract7 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(7) },
    update: {},
    create: {
      contractNumber: generateContractNumber(7),
      title: 'Wedding Photography - Davis Wedding',
      clientId: client1.id,
      templateId: weddingTemplate.id,
      status: 'EXPIRED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-05-01',
        venue_name: 'Riverside Chapel',
        total_amount: '4800',
        deposit_amount: '1440',
      },
      signByAt: getDateOffset(-5),
      sentAt: getDateOffset(-35),
      viewedAt: getDateOffset(-30),
      magicLinkToken: `${Math.random().toString(36).substring(2, 15)}`,
      magicLinkExpiresAt: getDateOffset(-5),
    },
  });
  console.log('✅ Created Contract 7: EXPIRED');

  // Contract 8: SENT (Recent)
  const contract8 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(8) },
    update: {},
    create: {
      contractNumber: generateContractNumber(8),
      title: 'Wedding Photography - Garcia Wedding',
      clientId: client2.id,
      templateId: weddingTemplate.id,
      status: 'SENT',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-10-12',
        venue_name: 'Coastal Resort',
        total_amount: '5200',
        deposit_amount: '1560',
      },
      signByAt: getDateOffset(90),
      sentAt: getDateOffset(-1),
      magicLinkToken: `${Math.random().toString(36).substring(2, 15)}`,
      magicLinkExpiresAt: getDateOffset(90),
    },
  });
  console.log('✅ Created Contract 8: SENT');

  // Contract 9: DRAFT
  const contract9 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(9) },
    update: {},
    create: {
      contractNumber: generateContractNumber(9),
      title: 'Portrait Session - Lee Family',
      clientId: client3.id,
      templateId: portraitTemplate.id,
      status: 'DRAFT',
      createdBy: admin.id,
      bodyHtml: '<h1>Portrait Session Contract</h1><p>Draft contract content...</p>',
      variables: {
        session_date: '2025-06-05',
        session_location: 'Urban Studio',
      },
      signByAt: getDateOffset(100),
    },
  });
  console.log('✅ Created Contract 9: DRAFT');

  // Contract 10: SIGNED (Recent)
  const contract10 = await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(10) },
    update: {},
    create: {
      contractNumber: generateContractNumber(10),
      title: 'Wedding Photography - Chen Wedding',
      clientId: client1.id,
      templateId: weddingTemplate.id,
      status: 'SIGNED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-11-20',
        venue_name: 'Grand Cathedral',
        total_amount: '6500',
        deposit_amount: '2000',
      },
      signByAt: getDateOffset(220),
      sentAt: getDateOffset(-2),
      viewedAt: getDateOffset(-1),
      signedAt: new Date(),
    },
  });
  console.log('✅ Created Contract 10: SIGNED');

  console.log('\n📊 Contract Summary:');
  console.log('  - Total: 10 contracts');
  console.log('  - SIGNED: 3 contracts');
  console.log('  - VIEWED: 1 contract');
  console.log('  - SENT: 2 contracts');
  console.log('  - DRAFT: 2 contracts');
  console.log('  - VOIDED: 1 contract');
  console.log('  - EXPIRED: 1 contract');

  // ============================================
  // PHASE 3: ENVELOPE SEEDING (Multi-Signature)
  // ============================================
  console.log('\n📬 Creating Multi-Signature Envelopes...');

  // Create a sample PDF file path (would be real in production)
  const generateMagicToken = () =>
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Envelope 1: Sequential signing with 3 signers
  const envelope1 = await prisma.envelope.create({
    data: {
      name: 'Wedding Photography Agreement - Smith Wedding',
      description: 'Multi-party contract requiring signatures from bride, groom, and photographer',
      createdById: superAdmin.id,
      status: 'PENDING',
      signingWorkflow: 'SEQUENTIAL',
      expiresAt: getDateOffset(60),
      sentAt: new Date(),
    },
  });
  console.log('✅ Created Envelope 1 (PENDING, Sequential):', envelope1.id);

  // Create document for envelope
  const document1 = await prisma.document.create({
    data: {
      envelopeId: envelope1.id,
      name: 'Wedding Photography Contract',
      fileName: 'wedding-contract.pdf',
      filePath: '/uploads/documents/wedding-contract-abc123.pdf',
      fileHash: 'sha256_abc123def456',
      fileSize: 245600,
    },
  });
  console.log('✅ Created Document 1:', document1.id);

  // Create signers for sequential workflow
  const signer1 = await prisma.signer.create({
    data: {
      envelopeId: envelope1.id,
      name: 'Sarah Smith',
      email: 'sarah.smith@example.com',
      role: 'BRIDE',
      sequenceNumber: 1, // Must sign first
      status: 'PENDING',
      magicLinkToken: generateMagicToken(),
      magicLinkExpiresAt: getDateOffset(60),
    },
  });
  console.log('✅ Created Signer 1 (sequence 1):', signer1.email);

  const signer2 = await prisma.signer.create({
    data: {
      envelopeId: envelope1.id,
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'GROOM',
      sequenceNumber: 2, // Signs after bride
      status: 'PENDING',
      magicLinkToken: generateMagicToken(),
      magicLinkExpiresAt: getDateOffset(60),
    },
  });
  console.log('✅ Created Signer 2 (sequence 2):', signer2.email);

  const signer3 = await prisma.signer.create({
    data: {
      envelopeId: envelope1.id,
      name: 'Alice Johnson',
      email: 'alice@kori.dev',
      role: 'PHOTOGRAPHER',
      sequenceNumber: 3, // Signs last
      status: 'PENDING',
      magicLinkToken: generateMagicToken(),
      magicLinkExpiresAt: getDateOffset(60),
    },
  });
  console.log('✅ Created Signer 3 (sequence 3):', signer3.email);

  // Create signature records (initially empty)
  const sig1 = await prisma.signature.create({
    data: {
      envelopeId: envelope1.id,
      signerId: signer1.id,
      status: 'PENDING',
    },
  });

  const sig2 = await prisma.signature.create({
    data: {
      envelopeId: envelope1.id,
      signerId: signer2.id,
      status: 'PENDING',
    },
  });

  const sig3 = await prisma.signature.create({
    data: {
      envelopeId: envelope1.id,
      signerId: signer3.id,
      status: 'PENDING',
    },
  });
  console.log('✅ Created 3 Signature records (PENDING)');

  // Create audit logs for envelope
  await prisma.envelopeAuditLog.create({
    data: {
      envelopeId: envelope1.id,
      action: 'ENVELOPE_CREATED',
      actorId: superAdmin.id,
      metadata: {
        name: envelope1.name,
        workflow: 'SEQUENTIAL',
        signerCount: 3,
      },
    },
  });

  await prisma.envelopeAuditLog.create({
    data: {
      envelopeId: envelope1.id,
      action: 'ENVELOPE_SENT',
      actorId: superAdmin.id,
      metadata: {
        sentAt: new Date().toISOString(),
        recipients: [signer1.email, signer2.email, signer3.email],
      },
    },
  });
  console.log('✅ Created Envelope Audit Logs');

  console.log('\n📊 Envelope Summary:');
  console.log('  - Total Envelopes: 1');
  console.log('  - Total Signers: 3 (sequential order)');
  console.log('  - Workflow: Sequential (A→B→C)');
  console.log('  - Status: PENDING');

  // Create Audit Log entries
  await prisma.auditLog.create({
    data: {
      action: 'SEED',
      entityType: 'Database',
      userId: superAdmin.id,
      metadata: {
        message: 'Initial database seed completed with contracts and envelopes',
        timestamp: new Date().toISOString(),
        envelopes: 1,
        signers: 3,
      },
    },
  });
  console.log('\n✅ Created Audit Log entry');

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });