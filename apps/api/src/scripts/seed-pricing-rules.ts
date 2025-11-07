import { PrismaClient, EventType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Pricing Rules
 *
 * Creates default pricing rules for auto-invoice generation based on event types
 */

async function main() {
  console.log('🌱 Seeding Pricing Rules...\n');

  // Wedding pricing rule
  console.log('💒 Creating Wedding Pricing Rule...');
  const weddingRule = await prisma.pricingRule.upsert({
    where: { key: 'event_type:WEDDING' },
    update: {},
    create: {
      key: 'event_type:WEDDING',
      eventType: EventType.WEDDING,
      depositPercent: 30, // 30% deposit
      finalDueOffsetDays: 30, // Final payment due 30 days before event
      notes: 'Standard wedding photography payment structure: 30% deposit to secure date, 50% due 2 weeks before wedding, 20% due on delivery',
    },
  });
  console.log(`  ✅ ${weddingRule.key}: ${weddingRule.depositPercent}% deposit, final due ${weddingRule.finalDueOffsetDays} days before event\n`);

  // Brand/Editorial pricing rule
  console.log('📸 Creating Brand/Editorial Pricing Rule...');
  const brandRule = await prisma.pricingRule.upsert({
    where: { key: 'event_type:BRAND_EDITORIAL' },
    update: {},
    create: {
      key: 'event_type:BRAND_EDITORIAL',
      eventType: EventType.BRAND_EDITORIAL,
      depositPercent: 50, // 50% deposit
      finalDueOffsetDays: 30, // NET 30 for final payment
      notes: 'Commercial brand/editorial work: 50% deposit on booking, 50% NET 30 after delivery',
    },
  });
  console.log(`  ✅ ${brandRule.key}: ${brandRule.depositPercent}% deposit, final due ${brandRule.finalDueOffsetDays} days after delivery\n`);

  // Event photography pricing rule
  console.log('🎉 Creating Event Photography Pricing Rule...');
  const eventRule = await prisma.pricingRule.upsert({
    where: { key: 'event_type:EVENT' },
    update: {},
    create: {
      key: 'event_type:EVENT',
      eventType: EventType.EVENT,
      depositPercent: 50, // 50% deposit
      finalDueOffsetDays: 14, // Final payment due 14 days before event
      notes: 'Corporate and social event photography: 50% deposit, 50% due 2 weeks before event',
    },
  });
  console.log(`  ✅ ${eventRule.key}: ${eventRule.depositPercent}% deposit, final due ${eventRule.finalDueOffsetDays} days before event\n`);

  // Portrait session pricing rule
  console.log('👤 Creating Portrait Session Pricing Rule...');
  const portraitRule = await prisma.pricingRule.upsert({
    where: { key: 'event_type:PORTRAIT' },
    update: {},
    create: {
      key: 'event_type:PORTRAIT',
      eventType: EventType.PORTRAIT,
      depositPercent: 100, // Full payment upfront for portrait sessions
      finalDueOffsetDays: 0, // No final payment (100% deposit)
      notes: 'Portrait sessions: Full payment due at booking (non-refundable session fee)',
    },
  });
  console.log(`  ✅ ${portraitRule.key}: ${portraitRule.depositPercent}% deposit (full payment)\n`);

  // Commercial pricing rule (for high-value established clients)
  console.log('💼 Creating Commercial (Established Client) Pricing Rule...');
  const commercialRule = await prisma.pricingRule.upsert({
    where: { key: 'event_type:COMMERCIAL' },
    update: {},
    create: {
      key: 'event_type:COMMERCIAL',
      eventType: EventType.COMMERCIAL,
      depositPercent: 0, // No deposit for established commercial clients
      finalDueOffsetDays: 30, // NET 30 payment terms
      notes: 'Established commercial clients with good payment history: NET 30 payment terms, no deposit required',
    },
  });
  console.log(`  ✅ ${commercialRule.key}: ${commercialRule.depositPercent}% deposit (NET 30 terms)\n`);

  const ruleCount = await prisma.pricingRule.count();
  console.log(`🎉 Pricing Rules Seeded Successfully!`);
  console.log(`   📊 Total Rules: ${ruleCount}\n`);

  console.log('💡 Usage Guide:');
  console.log('   - Pricing rules auto-generate invoices when contracts are signed');
  console.log('   - Rules are matched by event_type or template_id');
  console.log('   - Deposit invoices are created immediately');
  console.log('   - Final payment invoices are created based on finalDueOffsetDays');
  console.log('   - Custom rules can be added per template via contract_templates table\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding pricing rules:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
