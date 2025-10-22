import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

async function seedOrganization() {
  console.log('🌱 Seeding organization data...');

  try {
    // Check if organization exists
    const existing = await prisma.organization.findFirst();

    if (existing) {
      console.log('✅ Organization already exists:', existing.name);
      return;
    }

    // Create default organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Kori Photography',
        legalName: 'Kori Photography Ltd.',
        email: 'hello@kori.photography',
        phone: '+44 20 1234 5678',
        website: 'https://kori.photography',
        
        // Address
        addressLine1: '123 Photography Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'GB',
        
        // Tax
        vatNumber: 'GB123456789',
        defaultTaxRate: 20,
        
        // Branding
        primaryColor: '#4F46E5',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        
        // Locale
        timezone: 'Europe/London',
        locale: 'en-GB',
        currency: 'GBP',
        
        // Feature flags
        features: {
          clientPortal: true,
          proofing: true,
          contracts: true,
          proposals: true,
          webhooks: false,
          apiAccess: false,
          advancedReports: true,
          multiCurrency: false,
          automatedBackups: true,
          twoFactorAuth: false,
        },
      },
    });

    console.log('✅ Created organization:', organization.name);

    // Create some default settings
    const defaultSettings = [
      {
        key: 'email.smtp.host',
        value: { host: 'smtp.gmail.com' },
        category: 'email',
        description: 'SMTP server host',
        isPublic: false,
      },
      {
        key: 'email.smtp.port',
        value: { port: 587 },
        category: 'email',
        description: 'SMTP server port',
        isPublic: false,
      },
      {
        key: 'notification.defaults.email',
        value: { enabled: true },
        category: 'notification',
        description: 'Enable email notifications by default',
        isPublic: true,
      },
      {
        key: 'notification.defaults.inApp',
        value: { enabled: true },
        category: 'notification',
        description: 'Enable in-app notifications by default',
        isPublic: true,
      },
      {
        key: 'invoice.defaultPaymentTerms',
        value: { days: 30 },
        category: 'invoice',
        description: 'Default payment terms in days',
        isPublic: true,
      },
      {
        key: 'gallery.defaultExpiration',
        value: { days: 90 },
        category: 'gallery',
        description: 'Default gallery expiration in days',
        isPublic: true,
      },
    ];

    for (const setting of defaultSettings) {
      await prisma.setting.create({
        data: setting as any,
      });
    }

    console.log(`✅ Created ${defaultSettings.length} default settings`);
    console.log('🎉 Organization seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding organization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly (ES module way)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  seedOrganization()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedOrganization;