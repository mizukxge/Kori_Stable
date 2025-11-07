import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding rights presets...');

  // Get the first admin user
  const admin = await prisma.adminUser.findFirst();

  if (!admin) {
    console.error('❌ No admin user found. Please create an admin user first.');
    process.exit(1);
  }

  const presets = [
    {
      name: 'Wedding Photography Standard',
      description: 'Standard copyright and usage rights for wedding photography',
      creator: 'Mizu Studio',
      copyrightNotice: '© 2025 Mizu Studio. All Rights Reserved.',
      usageRights: 'Personal use only. Commercial use prohibited without written permission.',
      creditLine: 'Photo by Mizu Studio',
      instructions: 'Credit must be given when sharing on social media.',
      keywords: ['wedding', 'photography', 'personal-use'],
      isDefault: true,
      isActive: true,
      createdBy: admin.id,
    },
    {
      name: 'Commercial Photography',
      description: 'Copyright for commercial and advertising photography',
      creator: 'Mizu Studio',
      copyrightNotice: '© 2025 Mizu Studio. All Rights Reserved.',
      usageRights: 'Commercial use permitted as per signed contract. Licensing terms apply.',
      creditLine: 'Photography by Mizu Studio',
      instructions: 'See contract for detailed usage terms and restrictions.',
      keywords: ['commercial', 'advertising', 'licensed'],
      isDefault: false,
      isActive: true,
      createdBy: admin.id,
    },
    {
      name: 'Editorial Photography',
      description: 'Copyright for editorial and news photography',
      creator: 'Mizu Studio',
      copyrightNotice: '© 2025 Mizu Studio. All Rights Reserved.',
      usageRights: 'Editorial use only. Not for commercial advertising or promotional purposes.',
      creditLine: 'Photo by Mizu Studio',
      instructions: 'Must credit photographer when published.',
      keywords: ['editorial', 'news', 'journalism'],
      isDefault: false,
      isActive: true,
      createdBy: admin.id,
    },
    {
      name: 'Portrait Session Standard',
      description: 'Standard rights for portrait and headshot sessions',
      creator: 'Mizu Studio',
      copyrightNotice: '© 2025 Mizu Studio. All Rights Reserved.',
      usageRights: 'Personal and professional use permitted. May be used for business cards, LinkedIn, and personal websites.',
      creditLine: 'Portrait by Mizu Studio',
      instructions: 'Credit appreciated when sharing professionally.',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      keywords: ['portrait', 'headshot', 'professional'],
      isDefault: false,
      isActive: true,
      createdBy: admin.id,
    },
    {
      name: 'Social Media Licensed',
      description: 'Special licensing for social media marketing',
      creator: 'Mizu Studio',
      copyrightNotice: '© 2025 Mizu Studio. All Rights Reserved.',
      usageRights: 'Licensed for social media use for 12 months from delivery date. Includes Instagram, Facebook, Twitter, LinkedIn.',
      creditLine: '@MizuStudio',
      instructions: 'Tag @MizuStudio when posting. Do not sell or sublicense.',
      keywords: ['social-media', 'licensed', 'marketing'],
      isDefault: false,
      isActive: true,
      createdBy: admin.id,
    },
    {
      name: 'Creative Commons BY-NC',
      description: 'Creative Commons Attribution-NonCommercial',
      creator: 'Mizu Studio',
      copyrightNotice: '© 2025 Mizu Studio. Licensed under CC BY-NC 4.0.',
      usageRights: 'This work is licensed under Creative Commons Attribution-NonCommercial 4.0 International License.',
      creditLine: 'Photo by Mizu Studio (CC BY-NC 4.0)',
      instructions: 'Free to share and adapt for non-commercial purposes with attribution.',
      keywords: ['creative-commons', 'cc-by-nc', 'open-license'],
      isDefault: false,
      isActive: true,
      createdBy: admin.id,
    },
  ];

  for (const presetData of presets) {
    try {
      const preset = await prisma.rightsPreset.create({
        data: presetData,
      });
      console.log(`✅ Created preset: ${preset.name}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        console.log(`⚠️  Preset already exists: ${presetData.name}`);
      } else {
        console.error(`❌ Error creating preset ${presetData.name}:`, error);
      }
    }
  }

  console.log('✅ Rights presets seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
